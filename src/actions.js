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
					max: 8,
					useVariables: true
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
				parent.setSrc(event.options.gpi, event.options.port)
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
					max: 8,
					useVariables: true
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
				parent.setDst(event.options.gpi, event.options.port)
			}
		}
	})
}
