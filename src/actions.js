module.exports = function (self) {
	let parent = self
	self.setActionDefinitions({
		set_source: {
			name: 'Set source',
			options: [
				{
					id: 'gpi',
					type: 'number',
					label: 'GPI event',
					default: 0,
					min: 1,
					max: 8
				},
				{
					id: 'port',
					type: 'textinput',
					label: 'Source Port',
					default: 0,
					min: 0,
					max: 255,
					useVariables: true,
					regex: "^[0-9]*$"
				}
			],
			callback: async (event) => {
				let portFiled  = await self.parseVariablesInString(event.options.port);
				let port = parseInt(portFiled)

				if (isNaN(port)) {
					self.log('error', 'Port is not a number: ' + optAddress);
					return;
				}
				parent.log("info", "Setting src_action")
				parent.setSrc(event.options.gpi, port)
			},
		},
		set_destination: {
			name: 'Set destination',
			options: [
				{
					id: 'gpi',
					type: 'number',
					label: 'GPI event',
					default: 0,
					min: 1,
					max: 8
				},
				{
					id: 'port',
					type: 'textinput',
					label: 'Destination Port',
					default: 0,
					min: 0,
					max: 255,
					useVariables: true,
					regex: "^[0-9]*$"
				}
			],
			callback: async (event) => {
				parent.log("info", "Setting dst_action")
				let portFiled  = await self.parseVariablesInString(event.options.port);
				let port = parseInt(portFiled)

				if (isNaN(port)) {
					self.log('error', 'Port is not a number: ' + optAddress);
					return;
				}
				parent.setDst(event.options.gpi, port)
			}
		},
		SetLatch : {
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
