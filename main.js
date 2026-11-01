const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')
const UpdateActions = require('./src/actions')
const UpdateFeedbacks = require('./src/feedbacks')
const UpdateVariableDefinitions = require('./src/variables')
const { ConnectClient, SetSrc, SetDst, SetLatch } = require('./src/comm')
const { VideohubEmulator, GPIO_COUNT } = require('./src/videohub')

class BmdGPIAndTallyControll extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.updateStatus(InstanceStatus.Connecting) // set status to connecting
		this.connectClient() // connect to client
		this.startEmulation()
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
		this.stopEmulation()
		if (this.comm) {
			this.comm.destroy()
		} else {
			this.updateStatus(InstanceStatus.Disconnected)
		}

	}

	async configUpdated(config) {
		if (this.comm) {
			this.comm.destroy()
			delete this.comm
		}
		this.config = config
		this.connectClient()
		this.startEmulation()
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'checkbox',
				id: 'emulate',
				label: 'Emulate a Videohub (use the interface as GPIO)',
				tooltip: "Set the interface's Remote Videohub IP to this Companion machine",
				width: 12,
				default: false,
			},
		]
	}

	setDst(gpi, port) {
		SetDst(this, gpi, port)
	}
	setSrc(gpi, port) {
		SetSrc(this, gpi, port)
	}
	setLatch(value) {
		SetLatch(this, value)
	}
	// Companion acts as the Videohub the interface connects to, see src/videohub.js
	startEmulation() {
		this.stopEmulation()
		if (!this.config.emulate) return

		const onError = (err) => {
			this.log('error', 'Videohub emulation: ' + err.message)
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		}
		this.videohub = new VideohubEmulator(() => this.updateGpioVariables(), onError)
		this.updateGpioVariables()
	}

	stopEmulation() {
		this.videohub?.destroy()
		delete this.videohub
	}

	updateGpioVariables() {
		const values = {}
		for (let i = 1; i <= GPIO_COUNT; i++) {
			values[`gpi_input_${i}`] = this.videohub.gpiClosed(i)
			values[`tally_output_${i}`] = this.videohub.relayOn(i)
		}
		this.setVariableValues(values)
	}

	setTallyOutput(relay, state) {
		if (!this.videohub) return this.log('warn', 'Enable Videohub emulation in the module config to use tally outputs')
		this.videohub.setRelay(relay, state === 'toggle' ? !this.videohub.relayOn(relay) : state === 'on')
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
	connectClient() {
		ConnectClient(this)
	}
}

runEntrypoint(BmdGPIAndTallyControll, UpgradeScripts)
