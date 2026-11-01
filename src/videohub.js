const net = require('net')

// Pretends to be a Videohub router, because that is the only device the GPI and Tally Interface
// reports its GPI inputs to. The interface is set up so that closing GPI n routes hub input n to
// output n. In momentary mode it restores the previous route (the idle input) when the GPI opens.
// Protocol reference: Blackmagic "Videohub Ethernet Protocol" developer manual.

const VIDEOHUB_PORT = 9990
const GPI_COUNT = 8
const IDLE_INPUT = GPI_COUNT // an extra hub input that outputs use while their GPI is open

class VideohubEmulator {
	constructor(onGpiChange, onError) {
		this.onGpiChange = onGpiChange
		this.routing = new Array(GPI_COUNT).fill(IDLE_INPUT) // routing[output] = input
		this.clients = new Set()
		this.server = net.createServer((socket) => this.addClient(socket))
		this.server.on('error', onError)
		this.server.listen(VIDEOHUB_PORT)
	}

	destroy() {
		this.clients.forEach((socket) => socket.destroy())
		this.server.close()
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
		for (const line of lines) {
			const [output, input] = line.split(' ').map(Number)
			if (output < GPI_COUNT) {
				this.routing[output] = input
				this.onGpiChange(output + 1, input === output)
			}
		}
		this.clients.forEach((client) => client.write(this.routingBlock()))
	}

	routingBlock() {
		return block(
			'VIDEO OUTPUT ROUTING:',
			this.routing.map((input, output) => `${output} ${input}`),
		)
	}

	prelude() {
		const labels = this.routing.map((_, i) => `${i} GPI ${i + 1}`)
		return [
			block('PROTOCOL PREAMBLE:', ['Version: 2.8']),
			block('VIDEOHUB DEVICE:', [
				'Device present: true',
				'Model name: Blackmagic Smart Videohub',
				`Video inputs: ${GPI_COUNT + 1}`,
				'Video processing units: 0',
				`Video outputs: ${GPI_COUNT}`,
				'Video monitoring outputs: 0',
				'Serial ports: 0',
			]),
			block('INPUT LABELS:', [...labels, `${IDLE_INPUT} Idle`]),
			block('OUTPUT LABELS:', labels),
			this.routingBlock(),
			block(
				'VIDEO OUTPUT LOCKS:',
				labels.map((_, i) => `${i} U`),
			),
			block('END PRELUDE:', []),
		].join('')
	}
}

function block(header, lines) {
	return [header, ...lines].join('\n') + '\n\n'
}

module.exports = { VideohubEmulator, GPI_COUNT }
