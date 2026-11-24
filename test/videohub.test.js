const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert')
const { VideohubEmulator } = require('../src/videohub')
const { connect, waitFor } = require('./helpers')

const PORT = 19990 // 9990 may be taken by Blackmagic's own Videohub server
let hub, changes, interfaceSocket

beforeEach(async () => {
	changes = 0
	hub = new VideohubEmulator(() => changes++, assert.fail, PORT)
	interfaceSocket = await connect(PORT)
	await waitFor(() => interfaceSocket.received.includes('END PRELUDE:'))
})

afterEach(() => {
	interfaceSocket.destroy()
	hub.destroy()
})

test('prelude describes 9 inputs, 16 outputs and routes everything to the idle input', () => {
	const prelude = interfaceSocket.received
	assert.match(prelude, /Video inputs: 9\n/)
	assert.match(prelude, /Video outputs: 16\n/)
	assert.match(prelude, /VIDEO OUTPUT ROUTING:\n0 8\n1 8\n/)
	assert.match(prelude, /VIDEO OUTPUT LOCKS:\n0 U\n/)
})

test('a GPI closing and opening is reported as routes on its output', async () => {
	interfaceSocket.write('VIDEO OUTPUT ROUTING:\n2 2\n\n')
	await waitFor(() => hub.gpiClosed(3))
	assert.strictEqual(changes, 1)

	interfaceSocket.write('VIDEO OUTPUT ROUTING:\n2 8\n\n')
	await waitFor(() => !hub.gpiClosed(3))
})

test('a block split over several packets is still understood', async () => {
	interfaceSocket.write('VIDEO OUTPUT ROU')
	interfaceSocket.write('TING:\n0 0\n')
	interfaceSocket.write('\n')
	await waitFor(() => hub.gpiClosed(1))
})

test('every block is acknowledged, including pings', async () => {
	interfaceSocket.received = ''
	interfaceSocket.write('PING:\n\n')
	await waitFor(() => interfaceSocket.received === 'ACK\n\n')
})

test('routes to unknown outputs or inputs are ignored', async () => {
	interfaceSocket.write('VIDEO OUTPUT ROUTING:\n16 0\n0 9\n\n')
	await waitFor(() => interfaceSocket.received.endsWith('ACK\n\n'))
	assert.strictEqual(hub.routing.length, 16)
	assert.ok(!hub.gpiClosed(1))
	assert.strictEqual(changes, 0)
})

test('setting a relay sends its route to every connected interface', async () => {
	const second = await connect(PORT)
	await waitFor(() => second.received.includes('END PRELUDE:'))
	second.received = ''
	hub.setRelay(2, true)
	assert.ok(hub.relayOn(2))
	await waitFor(() => second.received === 'VIDEO OUTPUT ROUTING:\n9 1\n\n')

	hub.setRelay(2, false)
	assert.ok(!hub.relayOn(2))
	await waitFor(() => interfaceSocket.received.endsWith('VIDEO OUTPUT ROUTING:\n9 8\n\n'))
	second.destroy()
})
