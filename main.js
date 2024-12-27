const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')
const UpdateActions = require('./src/actions')
const UpdateFeedbacks = require('./src/feedbacks')
const UpdateVariableDefinitions = require('./src/variables')
const { ConnectClient, SetSrc, SetDst, SetLatch } = require('./src/comm')

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

	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
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
			}
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
