const { InstanceStatus, TCPHelper } = require('@companion-module/base')
const { GPIO_COUNT, VIDEOHUB_PORT, block } = require('./videohub')
module.exports = {
    ConnectClient: async function (self) {
        if (self.socket) {
            self.socket.destroy()
            delete self.socket
        }
        clearInterval(self.ping)
        self.updateStatus(InstanceStatus.Connecting)
        if (self.config.host) {
            self.socket = new TCPHelper(self.config.host, 9991)

            self.socket.on('status_change', (status, message) => {
                self.updateStatus(status, message)
            })
            self.socket.on('error', (err) => {
                self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
                self.log('error', 'Network error: ' + err.message)
            })
            self.ping = setInterval(() => ping(self), 2000);
            // The interface splits blocks over several packets, so keep the unfinished end for the next one
            let unfinished = ''
            self.socket.on('data', (data) => {
                const received = (unfinished + data).split('\n\n')
                unfinished = received.pop()
                received.forEach((blocks) => {
                    let lines = blocks.split('\n')
                    switch (lines[0]) {
                        case "ACK":
                            self.updateStatus(InstanceStatus.Ok)
                            break;
                        case "NAK":
                            self.updateStatus(InstanceStatus.UnknownWarning)
                            break;
                        case "BUTTON SDI_A:":
                            lines.shift();
                            lines.forEach((line) => {
                                let xpoint = line.split(' ')
                                if (xpoint[0] < 0 || xpoint[0] >= GPIO_COUNT) return // skip -1 and the GPO buttons
                                let varname = 'GPI' + (parseInt(xpoint[0]) + 1) + 'Src'
                                let id = parseInt(xpoint[1]) + 1
                                self.setVariableValues({ [varname]: id })
                            })
                            break;
                        case "SETTINGS:":
                            lines.shift();
                            lines.forEach((line) => {
                                let keyvalue = line.split(': ')
                                if (keyvalue[0] === "Latch mode")
                                    self.setVariableValues({"latch": keyvalue[1]})
                            })
                            break;
                        case "BUTTON SDI_B:":
                            lines.shift();
                            lines.forEach((line) => {
                                let xpoint = line.split(' ')
                                if (xpoint[0] < 0 || xpoint[0] >= GPIO_COUNT) return // skip -1 and the GPO buttons
                                let varname = 'GPI' + (parseInt(xpoint[0]) + 1) + 'Dest'
                                let id = parseInt(xpoint[1]) + 1;
                                self.setVariableValues({ [varname]: id })
                            })
                            break;
                        default:
                            // Unhandled config blocks (e.g. the GPO crosspoints) are logged so they can be supported later
                            if (blocks.trim()) self.log('debug', 'Unhandled block from interface:\n' + blocks)
                    }
                })
                self.checkFeedbacks('SourceState', 'DestinationState', 'LatchMode')
            })
        } else {
            // The host is only needed to configure the interface, emulation works without it
            self.updateStatus(self.config.emulate ? InstanceStatus.Ok : InstanceStatus.BadConfig)
        }
    },
    SetSrc: function (self, gpi, xpoint) {
        gpi = (parseInt(gpi) - 1).toString()
        xpoint = (parseInt(xpoint) - 1).toString()
        if (self.socket !== undefined && self.socket.isConnected) {
            self.socket.send('BUTTON SDI_A:\n' + gpi + ' ' + xpoint + '\n\n\n')
        }
    },
    SetDst: function (self, gpi, xpoint) {
        gpi = (parseInt(gpi) - 1).toString()
        xpoint = (parseInt(xpoint) - 1).toString()
        if (self.socket !== undefined && self.socket.isConnected) {
            self.socket.send('BUTTON SDI_B:\n' + gpi + ' ' + xpoint + '\n\n\n')
        }
    },
    SetLatch: function(self, value) {
        self.log("info", "Set Latch " + value)
        if (self.socket !== undefined && self.socket.isConnected) {
            self.socket.send('SETTINGS:\nLatch mode: ' + value + '\n\n\n')
        }
    }
}

// Points the interface at Companion's emulated Videohub and maps its buttons onto it (see src/videohub.js).
// Buttons 0-7 are the GPIs, 8-15 the GPOs: button b routes input b % 8 to output b.
// The interface only accepts routes to outputs its Videohub has, so the buttons are mapped once it is connected to ours.
module.exports.AutoConfigure = function (self) {
    if (!self.socket?.isConnected) return self.log('warn', 'Auto-configure needs a connection to the Target IP')

    const companionIp = self.socket._socket.localAddress // the address the interface reaches us on
    self.socket.send(block('NETWORK:', [`Videohub address: ${companionIp}`, `Videohub port: ${VIDEOHUB_PORT}`]))

    const buttons = [...Array(2 * GPIO_COUNT).keys()]
    const mapButtons = () =>
        self.socket.send(
            block('BUTTON SDI_A:', buttons.map((b) => `${b} ${b % GPIO_COUNT}`)) +
                block('BUTTON SDI_B:', buttons.map((b) => `${b} ${b}`)) +
                // Momentary, so a GPI is released when its contact opens. Follow mode is "GPO match", which ignores the GPO routes
                block('SETTINGS:', ['Latch mode: 0', 'Follow mode: 0']),
        )
    if (self.videohub.clients.size) mapButtons()
    else self.videohub.server.once('connection', mapButtons)
}

function ping(self) {
    if (self.socket !== undefined && self.socket.isConnected) {
        self.socket.send('PING:\n\n');
    }
}