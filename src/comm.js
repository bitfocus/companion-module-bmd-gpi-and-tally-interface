const { InstanceStatus } = require('@companion-module/base')
const net = require('net')

module.exports = {
    ConnectClient: async function (self) {
        if (self.communicator !== undefined) {
            self.log('info', 'Disconnecting')
            self.updateStatus(InstanceStatus.Error, 'Disconnecting')
            clearInterval(self.ping)
            self.communicator.destroySoon()
        }
        if (!self.config.host) {
            self.updateStatus(InstanceStatus.BadConfig, 'No host')
            return
        }
        self.log('info', 'Connecting')
        self.updateStatus(InstanceStatus.Connecting)
        self.communicator = new net.Socket()
        
        self.communicator.connect(9991, self.config.host, () => {
            self.ping = setInterval(() => ping(self), 5000)
            self.communicator.setKeepAlive(true, 5000) // 5 second keepalive
            self.updateStatus(InstanceStatus.Ok)

        })
        self.communicator.on('data', (data) => {

            data.toString().split('\n\n').forEach((blocks) => {
                let lines = blocks.split('\n')
                switch (lines[0]) {
                    case "ACK":
                        self.updateStatus(InstanceStatus.Ok)
                        break;
                    case "NACK":
                        self.updateStatus(InstanceStatus.ConnectionFailure)
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
                    case "BUTTON SDI_B:":
                        lines.shift();
                        lines.forEach((line) => {
                            let xpoint = line.split(' ')
                            let varname = 'GPI' + (parseInt(xpoint[0]) + 1) + 'Dest'
                            let id = parseInt(xpoint[1]) + 1;
                            self.setVariableValues({ [varname]: id })
                        })
                        break;
                }
            })
        })
        self.communicator.on('close', () => {
            self.log('info', 'Disconnected')
            self.updateStatus(InstanceStatus.Error, 'Disconnected')
            clearInterval(self.ping)
        })
        self.communicator.on('error', (err) => {
            self.log('error', err)
            this.updateStatus(InstanceStatus.BadConfig)
            
        })

    },

    SetSrc: function (self, gpi, xpoint) {
        gpi = (parseInt(gpi)-1).toString()
        xpoint = (parseInt(xpoint)-1).toString()
        self.log("info", "Setting source " + gpi + " " + xpoint)
        self.communicator.write('BUTTON SDI_A:\n' + gpi + ' ' + xpoint  + '\n\n\n')
    },
    SetDst: function (self, gpi, xpoint) {
        gpi = (parseInt(gpi)-1).toString()
        xpoint = (parseInt(xpoint)-1).toString()
        self.log("info", "Setting source " + gpi + " " + xpoint)
        self.communicator.write('BUTTON SDI_B:\n' + gpi + ' ' + xpoint  + '\n\n\n')
    }
}

function ping(self) {
    self.communicator.write('PING:\n\n');
}