const { combineRgb } = require('@companion-module/base')
const { GPIO_COUNT } = require('./videohub')

const STATES = { on: 'ON', off: 'OFF', toggle: 'TOGGLE' }

// An on, off and toggle button for every tally output, lit red while the output is on
module.exports = function (self) {
	const presets = {}
	for (const [state, label] of Object.entries(STATES)) {
		for (let output = 1; output <= GPIO_COUNT; output++) {
			presets[`tally_${output}_${state}`] = {
				type: 'button',
				category: 'Tally outputs',
				name: `Tally output ${output} ${state}`,
				style: { text: `Tally ${output}\\n${label}`, size: '14', color: combineRgb(255, 255, 255), bgcolor: 0 },
				steps: [{ down: [{ actionId: 'set_tally_output', options: { output, state } }], up: [] }],
				feedbacks: [{ feedbackId: 'TallyOutput', options: { output }, style: { bgcolor: combineRgb(255, 0, 0) } }],
			}
		}
	}
	self.setPresetDefinitions(presets)
}
