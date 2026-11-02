const net = require('net')

// A TCP client that collects everything it receives in `socket.received`
function connect(port) {
	return new Promise((resolve, reject) => {
		const socket = net.connect(port, '127.0.0.1', () => resolve(socket))
		socket.received = ''
		socket.on('data', (data) => (socket.received += data))
		socket.on('error', reject)
	})
}

async function waitFor(condition, timeout = 1000) {
	const start = Date.now()
	while (!condition()) {
		if (Date.now() - start > timeout) throw new Error('Timed out waiting for ' + condition)
		await new Promise((resolve) => setTimeout(resolve, 10))
	}
}

module.exports = { connect, waitFor }
