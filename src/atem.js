const dgram = require('dgram')

// Pretends to be an ATEM switcher, so the GPI and Tally Interface connects to Companion
// and closes tally relay n whenever Companion puts "switcher input n" on program.
// Protocol reference: atem-connection (src/lib/atemSocketChild.ts) by Sofie / NRK.

const ATEM_PORT = 9910
const TALLY_COUNT = 16 // a second interface can be set to "Switcher Inputs 9-16"
const PROTOCOL_VERSION = 0x0002001e // ATEM protocol 2.30 (firmware 8.1)
const MAX_PACKET_ID = 1 << 15
const CLIENT_TIMEOUT = 5000 // ms
const PROGRAM = 0x01

// Packet flags, stored in the top 5 bits of each packet
const FLAG_ACK_REQUEST = 0x01
const FLAG_HELLO = 0x02
const FLAG_ACK_REPLY = 0x10
const HELLO_ACCEPTED = Buffer.from([0x02, 0, 0, 0, 0, 0, 0, 0])

class AtemEmulator {
	constructor(onError) {
		this.tally = new Array(TALLY_COUNT).fill(false)
		this.clients = new Map()
		this.socket = dgram.createSocket('udp4')
		this.socket.on('error', onError)
		this.socket.on('message', (message, sender) => this.receive(message, sender))
		this.socket.bind(ATEM_PORT)
		this.keepAlive = setInterval(() => this.resendToAll(), 1000)
	}

	destroy() {
		clearInterval(this.keepAlive)
		this.socket.close()
	}

	setTally(index, on) {
		this.tally[index] = on
		this.clients.forEach((client) => this.sendState(client))
	}

	receive(message, { address, port }) {
		const flags = message[0] >> 3
		const key = `${address}:${port}`

		if (flags & FLAG_HELLO) {
			const sessionId = message.readUInt16BE(2)
			const client = {
				address,
				port,
				sessionId: sessionId | 0x8000,
				nextPacketId: 1,
				ackedPacketId: 0,
				lastSeen: Date.now(),
			}
			this.clients.set(key, client)
			this.send(client, packet(FLAG_HELLO, sessionId, { payload: HELLO_ACCEPTED }))
			this.sendState(client)
			return
		}

		const client = this.clients.get(key)
		if (!client) return
		client.lastSeen = Date.now()
		if (flags & FLAG_ACK_REPLY) client.ackedPacketId = message.readUInt16BE(4)
		if (flags & FLAG_ACK_REQUEST) {
			this.send(client, packet(FLAG_ACK_REPLY, client.sessionId, { ackId: message.readUInt16BE(10) }))
		}
	}

	// Runs every second: forgets silent clients and resends from the first unacknowledged packet.
	// Every packet carries the full tally state, so resending the current state replaces any lost packet.
	resendToAll() {
		for (const [key, client] of this.clients) {
			if (Date.now() - client.lastSeen > CLIENT_TIMEOUT) {
				this.clients.delete(key)
				continue
			}
			client.nextPacketId = (client.ackedPacketId + 1) % MAX_PACKET_ID
			this.sendState(client)
		}
	}

	sendState(client) {
		const tally = Buffer.alloc(2 + TALLY_COUNT)
		tally.writeUInt16BE(TALLY_COUNT, 0)
		this.tally.forEach((on, i) => (tally[2 + i] = on ? PROGRAM : 0))

		const commands = [command('TlIn', tally)]
		// Until the client has acknowledged a state packet, each one is sent as the initial state dump
		if (client.ackedPacketId === 0) {
			const version = Buffer.alloc(4)
			version.writeUInt32BE(PROTOCOL_VERSION)
			commands.unshift(command('_ver', version))
			commands.push(command('InCm', Buffer.alloc(4)))
		}

		const packetId = client.nextPacketId
		client.nextPacketId = (packetId + 1) % MAX_PACKET_ID
		this.send(client, packet(FLAG_ACK_REQUEST, client.sessionId, { packetId, payload: Buffer.concat(commands) }))
	}

	send(client, buffer) {
		this.socket.send(buffer, client.port, client.address)
	}
}

// 12 byte header: flags + length, session id, acknowledged packet id, 4 unused bytes, own packet id
function packet(flags, sessionId, { ackId = 0, packetId = 0, payload = Buffer.alloc(0) }) {
	const header = Buffer.alloc(12)
	header.writeUInt16BE((flags << 11) | (header.length + payload.length), 0)
	header.writeUInt16BE(sessionId, 2)
	header.writeUInt16BE(ackId, 4)
	header.writeUInt16BE(packetId, 10)
	return Buffer.concat([header, payload])
}

// 8 byte header: length, 2 unused bytes, 4 character name
function command(name, data) {
	const header = Buffer.alloc(8)
	header.writeUInt16BE(header.length + data.length, 0)
	header.write(name, 4, 'ascii')
	return Buffer.concat([header, data])
}

module.exports = { AtemEmulator, TALLY_COUNT }
