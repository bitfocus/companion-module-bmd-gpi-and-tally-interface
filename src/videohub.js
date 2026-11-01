const net = require('net')

// Pretends to be the Videohub router the GPI and Tally Interface connects to, so Companion can use
// the interface as GPIO. Everything is expressed as routes on the emulated hub:
//
//   GPI n closed  <=>  output n     shows input n   (the interface routes it; in momentary mode it
//                                                     restores the idle input when the contact opens)
//   Relay n on    <=>  output 8 + n shows input n   (Companion routes it; GPO n is set to that crosspoint)
//
// Protocol reference: Blackmagic "Videohub Ethernet Protocol" developer manual.

const VIDEOHUB_PORT = 9990
const GPIO_COUNT = 8
const IDLE_INPUT = GPIO_COUNT // an extra input that outputs show while their GPI or relay is off
const RELAY_OUTPUT = (relay) => GPIO_COUNT + relay - 1

class VideohubEmulator {
	constructor(onChange, onError) {
		this.onChange = onChange
		this.routing = new Array(2 * GPIO_COUNT).fill(IDLE_INPUT) // routing[output] = input
		this.clients = new Set()
		this.server = net.createServer((socket) => this.addClient(socket))
		this.server.on('error', onError)
		this.server.listen(VIDEOHUB_PORT)
	}

	destroy() {
		this.clients.forEach((socket) => socket.destroy())
		this.server.close()
	}

	gpiClosed(gpi) {
		return this.routing[gpi - 1] === gpi - 1
	}

	relayOn(relay) {
		return this.routing[RELAY_OUTPUT(relay)] === relay - 1
	}

	setRelay(relay, on) {
		this.route([[RELAY_OUTPUT(relay), on ? relay - 1 : IDLE_INPUT]])
	}

	route(changes) {
		changes.forEach(([output, input]) => (this.routing[output] = input))
		const routingUpdate = block(
			'VIDEO OUTPUT ROUTING:',
			changes.map(([output, input]) => `${output} ${input}`),
		)
		this.clients.forEach((client) => client.write(routingUpdate))
		this.onChange()
	}

	addClient(socket) {
		this.clients.add(socket)
		socket.on('close', () => this.clients.delete(socket))
		socket.on('error', () => socket.destroy())
		socket.write(this.prelude())

		// Messages are blocks of lines that end with an empty line, and may arrive split over several packets
		let unfinished = ''
		socket.on('data', (data) => {
			const blocks = (unfinished + data).split('\n\n')
			unfinished = blocks.pop()
			blocks.forEach((block) => this.handleBlock(socket, block.trim()))
		})
	}

	handleBlock(socket, block) {
		if (!block) return
		const [header, ...lines] = block.split('\n')
		socket.write('ACK\n\n') // to "PING:" and everything else

		if (header !== 'VIDEO OUTPUT ROUTING:') return
		const changes = lines.map((line) => line.split(' ').map(Number))
		const valid = changes.filter(([output, input]) => this.routing[output] !== undefined && input <= IDLE_INPUT)
		this.route(valid)
	}

	prelude() {
		const outputs = this.routing.map((_, i) => i)
		const inputLabels = outputs.slice(0, GPIO_COUNT).map((i) => `${i} GPIO ${i + 1}`)
		const outputLabels = outputs.map((i) => (i < GPIO_COUNT ? `${i} GPI ${i + 1}` : `${i} Relay ${i - GPIO_COUNT + 1}`))
		return [
			block('PROTOCOL PREAMBLE:', ['Version: 2.8']),
			block('VIDEOHUB DEVICE:', [
				'Device present: true',
				'Model name: Blackmagic Smart Videohub',
				`Video inputs: ${GPIO_COUNT + 1}`,
				'Video processing units: 0',
				`Video outputs: ${this.routing.length}`,
				'Video monitoring outputs: 0',
				'Serial ports: 0',
			]),
			block('INPUT LABELS:', [...inputLabels, `${IDLE_INPUT} Idle`]),
			block('OUTPUT LABELS:', outputLabels),
			block(
				'VIDEO OUTPUT ROUTING:',
				this.routing.map((input, output) => `${output} ${input}`),
			),
			block(
				'VIDEO OUTPUT LOCKS:',
				outputs.map((i) => `${i} U`),
			),
			block('END PRELUDE:', []),
		].join('')
	}
}

function block(header, lines) {
	return [header, ...lines].join('\n') + '\n\n'
}

module.exports = { VideohubEmulator, GPIO_COUNT }
