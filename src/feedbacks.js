const { combineRgb } = require('@companion-module/base')
const { GPIO_COUNT } = require('./videohub')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		TallyOutput: {
			name: 'Emulation: Tally output on',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(255, 0, 0), color: combineRgb(255, 255, 255) },
			options: [{ id: 'output', type: 'number', label: 'Tally output', default: 1, min: 1, max: GPIO_COUNT }],
			callback: (feedback) => self.videohub?.relayOn(feedback.options.output) ?? false,
		},
		DestinationState: {
			name: 'Feedback for destination value',
			type: 'boolean',
			label: 'Destination feedback',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 0),
				color: combineRgb(0, 0, 0),
			},
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
					regex: "^[0-9]*$"
				}
			],
			callback: (feedback) => {
				let portnatname = 'GPI' + feedback.options.gpi + 'Dest'
				let port = self.getVariableValue(portnatname)
				if (port === parseInt(feedback.options.port)) {
					return true
				} else {
					return false
				}
			}
		},
		SourceState: {
			name: 'Feedback for source value',
			type: 'boolean',
			label: 'Source feedback',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 0),
				color: combineRgb(0, 0, 0),
			},
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
					regex: "^[0-9]*$"
				}
			],
			callback: (feedback) => {
				let portnatname = 'GPI' + feedback.options.gpi + 'Src'
				let port = self.getVariableValue(portnatname)
				if (port === parseInt(feedback.options.port)) {
					return true
				} else {
					return false
				}

			},
		},
		LatchMode: {
			name: 'Feedback for latch mode',
			type: 'boolean',
			label: 'Latch mode feedback',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'value',
					type: 'dropdown',
					label: 'Latch mode',
					default: '0',
					choices: [
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' }
					]
				}
			],
			callback: (feedback) => {
				let value = self.getVariableValue('latch')
				if (value === feedback.options.value) {
					return true
				} else {
					return false
				}
			}
		}
	})
}
