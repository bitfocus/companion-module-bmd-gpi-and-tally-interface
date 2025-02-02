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
				let portField = await parent.parseVariablesInString(event.options.port);
				let port = parseInt(portField)
				let gpiField = await parent.parseVariablesInString(event.options.gpi);
				let gpi = parseInt(gpiField)
				if (isNaN(port) || gpi < 1 || gpi > 8 || isNaN(gpi)) {
					self.log('error', 'Set source action value error: GPI:'+gpi+' Port:'+port);
					return;
				}
				parent.log("info", "Set Source action GPI: " + gpi + " Port: " + port)
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
				let portField = await parent.parseVariablesInString(event.options.port);
				let port = parseInt(portField)
				let gpiField = await parent.parseVariablesInString(event.options.gpi);
				let gpi = parseInt(gpiField)
				if (isNaN(port) || gpi < 1 || gpi > 8 || isNaN(gpi)) {
					self.log('error', 'Set destination action Value error: GPI:'+gpi+' Port:'+port);
					return;
				}
				parent.log("info", "Set Destination action GPI: " + gpi + " Port: " + port)
				parent.setDst(gpi, port)
			},
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
				parent.log("info", "Setting latch mode: " + event.options.latch)
				parent.setLatch(event.options.latch)
			}
		}
	})
}
