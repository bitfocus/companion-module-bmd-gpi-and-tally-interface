const { test, before, after } = require('node:test')
const assert = require('node:assert')
const net = require('net')
const { EventEmitter } = require('events')
const { ConnectClient, SetSrc, AutoConfigure } = require('../src/comm')
const { waitFor } = require('./helpers')

// Shortened from what a real GPI & Tally Interface sends on connect
const STATUS_DUMP = [
	'PROTOCOL PREAMBLE:\nVersion: 1.1\n\n',
	'SETTINGS:\nFollow mode: 1\nLatch mode: 1\n\n',
	'BUTTON SDI_A:\n-1 0\n0 0\n1 1\n7 7\n8 0\n15 7\n\n',
	'BUTTON SDI_B:\n-1 -1\n0 3\n1 0\n15 0\n\n',
	'ACK\n\n',
].join('')

// Stands in for the interface's configuration port
let fakeInterface,
	received = ''
// Stands in for the Companion instance
const self = {
	config: { host: '127.0.0.1', emulate: true },
	variables: {},
	log: () => {},
	updateStatus: () => {},
	setVariableValues: (values) => Object.assign(self.variables, values),
	checkFeedbacks: () => {},
}

before(async () => {
	fakeInterface = net.createServer((socket) => {
		// Like the real interface, split the dump in the middle of a block
		const middle = STATUS_DUMP.indexOf('7 7')
		socket.write(STATUS_DUMP.slice(0, middle))
		setTimeout(() => socket.write(STATUS_DUMP.slice(middle)), 50)
		socket.on('data', (data) => (received += data))
	})
	await new Promise((resolve) => fakeInterface.listen(9991, '127.0.0.1', resolve))
	ConnectClient(self)
	await waitFor(() => self.socket.isConnected && 'GPI2Dest' in self.variables)
})

after(() => {
	clearInterval(self.ping)
	self.socket.destroy()
	fakeInterface.close()
})

test('the status dump fills the GPI event and latch variables, 1-based', () => {
	assert.deepStrictEqual(self.variables, {
		latch: '1',
		GPI1Src: 1,
		GPI2Src: 2,
		GPI8Src: 8,
		GPI1Dest: 4,
		GPI2Dest: 1,
	})
})

test('setting a GPI source sends it 0-based', async () => {
	received = ''
	SetSrc(self, 3, 5)
	await waitFor(() => received === 'BUTTON SDI_A:\n2 4\n\n\n')
})

test('auto-configure points the interface at Companion, then maps every GPI and GPO once it connects', async () => {
	received = ''
	self.videohub = { clients: new Set(), server: new EventEmitter() } // the emulator, before the interface connects
	AutoConfigure(self)
	await waitFor(() => received === 'NETWORK:\nVideohub address: 127.0.0.1\nVideohub port: 9990\n\n')

	self.videohub.server.emit('connection')
	await waitFor(() => received.includes('SETTINGS:'))
	const [, sources, destinations, settings] = received.trim().split('\n\n')
	assert.match(sources, /^BUTTON SDI_A:\n0 0\n1 1\n.*\n7 7\n8 0\n.*\n15 7$/s)
	assert.match(destinations, /^BUTTON SDI_B:\n0 0\n.*\n15 15$/s)
	assert.strictEqual(settings, 'SETTINGS:\nLatch mode: 0\nFollow mode: 0')
})
