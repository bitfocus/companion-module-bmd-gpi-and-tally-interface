const { InstanceStatus, TCPHelper } = require('@companion-module/base')
module.exports = {
    ConnectClient: async function (self) {
        if (self.socket) {
            self.socket.destroy()
            delete self.socket
        }

        if (self.ping) {
            self.ping = null;
        }
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
            self.socket.on('connect', () => {
                if (self.config.emulate) MapGpisToEmulator(self)
            })
            self.ping = setInterval(() => ping(self), 2000);
            self.socket.on('data', (data) => {
                //self.log('info', data.toString())
                data.toString().split('\n\n').forEach((blocks) => {
                    let lines = blocks.split('\n')
                    switch (lines[0]) {
                        case "ACK":
                            self.updateStatus(InstanceStatus.Ok)
                            break;
                        case "NACK":
                            self.updateStatus(InstanceStatus.UnknownWarning)
                            break;
                        case "BUTTON SDI_A:":
                            lines.shift();
                            lines.forEach((line) => {
                                let xpoint = line.split(' ')
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

// GPI n routes emulated Videohub input n to output n, and is released again when the contact opens
function MapGpisToEmulator(self) {
    for (let gpi = 1; gpi <= 8; gpi++) {
        module.exports.SetSrc(self, gpi, gpi)
        module.exports.SetDst(self, gpi, gpi)
    }
    module.exports.SetLatch(self, '0') // momentary
}

function ping(self) {
    if (self.socket !== undefined && self.socket.isConnected) {
        self.socket.send('PING:\n\n');
    }
}