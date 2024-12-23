module.exports = function (self) {
	let parent = self
	self.setActionDefinitions({
		set_source: {
			name: 'Set source',
			options: [
				{
					id: 'gpi',
					type: 'textinput',
					label: 'GPI event',
					useVariables: true,
					default: "0",
					required: true,
					regex: "^[1-8]$",
					tooltip: "Number between 1-8"
				},
				{
					id: 'port',
					type: 'textinput',
					label: 'Source Port',
					default: 0,
					min: 0,
					max: 255,
					useVariables: true,
					regex: "^[0-9]*$",
					required: true,
				}
			],
			callback: async (event) => {
				parent.log("info", "Setting dst_action")
				let portFiled = await parent.parseVariablesInString(event.options.port);
				let port = parseInt(portFiled)
				let gpiFiled = await parent.parseVariablesInString(event.options.port);
				let gpi = parseInt(gpiFiled)
				if (isNaN(port) || gpi < 1 || gpi > 8) {
					self.log('error', 'Port is not a number: ' + optAddress);
					return;
				}

				if (isNaN(port)) {
					self.log('error', 'Port is not a number: ' + optAddress);
					return;
				}
				parent.setSrc(gpi, port)
			},
		},
		set_destination: {
			name: 'Set destination',
			options: [
				{
					id: 'gpi',
					type: 'textinput',
					label: 'GPI event',
					useVariables: true,
					default: "0",
					required: true,
					regex: "^[1-8]$",
					tooltip: "Number between 1-8"
				},
				{
					id: 'port',
					type: 'textinput',
					label: 'Destination Port',
					default: 0,
					min: 0,
					max: 255,
					useVariables: true,
					regex: "^[0-9]*$",
					required: true,
				}
			],
			callback: async (event) => {
				parent.log("info", "Setting dst_action")
				let portFiled = await parent.parseVariablesInString(event.options.port);
				let port = parseInt(portFiled)
				let gpiFiled = await parent.parseVariablesInString(event.options.port);
				let gpi = parseInt(gpiFiled)
				if (isNaN(port) || gpi < 1 || gpi > 8) {
					self.log('error', 'Port is not a number: ' + optAddress);
					return;
				}

				if (isNaN(port)) {
					self.log('error', 'Port is not a number: ' + optAddress);
					return;
				}
				parent.setDst(gpi, port)
			}
		},
		SetLatch: {
			name: 'Override mode',
			options: [
				{
					id: 'latch',
					type: 'dropdown',
					label: 'Override mode',
					default: '0',
					choices: [
						{ id: '0', label: 'Momentary Hold Video' },
						{ id: '1', label: 'Latch mode' },
					],
				}],
			callback: async (event) => {
				parent.log("info", "Setting dst_action")
				parent.setLatch(event.options.latch)
			}
		}
	})
}
