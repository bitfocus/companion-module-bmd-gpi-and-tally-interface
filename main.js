const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')
const UpdateActions = require('./src/actions')
const UpdateFeedbacks = require('./src/feedbacks')
const UpdateVariableDefinitions = require('./src/variables')
const { ConnectClient, SetSrc, SetDst, SetLatch } = require('./src/comm')
const { AtemEmulator, TALLY_COUNT } = require('./src/atem')
const { VideohubEmulator, GPI_COUNT } = require('./src/videohub')

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
				label: 'Emulate an ATEM switcher (use the interface as GPIO)',
				tooltip: "Point the interface's switcher/Videohub IP to this Companion machine",
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
	// Companion acts as the ATEM (tally outputs) and as the Videohub (GPI inputs) the interface connects to
	startEmulation() {
		this.stopEmulation()
		if (!this.config.emulate) return

		const onError = (err) => {
			this.log('error', 'Emulation: ' + err.message)
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		}
		this.atem = new AtemEmulator(onError)
		this.videohub = new VideohubEmulator((gpi, closed) => this.setVariableValues({ [`gpi_input_${gpi}`]: closed }), onError)

		const variables = {}
		for (let i = 1; i <= GPI_COUNT; i++) variables[`gpi_input_${i}`] = false
		for (let i = 1; i <= TALLY_COUNT; i++) variables[`tally_output_${i}`] = false
		this.setVariableValues(variables)
	}

	stopEmulation() {
		this.atem?.destroy()
		this.videohub?.destroy()
		delete this.atem
		delete this.videohub
	}

	setTallyOutput(output, state) {
		if (!this.atem) return this.log('warn', 'Enable ATEM emulation in the module config to use tally outputs')
		const on = state === 'toggle' ? !this.atem.tally[output - 1] : state === 'on'
		this.atem.setTally(output - 1, on)
		this.setVariableValues({ [`tally_output_${output}`]: on })
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
