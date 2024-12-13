const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')
const UpdateActions = require('./src/actions')
const UpdateFeedbacks = require('./src/feedbacks')
const UpdateVariableDefinitions = require('./src/variables')
const { ConnectClient, SetSrc, SetDst } = require('./src/comm')

class ModuleInstance extends InstanceBase {
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
	}

	async configUpdated(config) {
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
		this.log("info", "Setting dst_main")
		SetDst(this, gpi, port)
	}
	setSrc(gpi, port) {
		this.log("info", "Setting src_main")
		SetSrc(this, gpi, port)
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

runEntrypoint(ModuleInstance, UpgradeScripts)
