//const { spawn } = require("child_process")
const { createConnection } = require("net");
const { createInterface } = require("readline")
const { b64coder, CryptorRSA, CryptorAES } = require('./crypt')

const { password, iv } = require('./config.json')


// TOR routing
/* const https = require("https");
const { SocksProxyAgent } = require("socks-proxy-agent");

const agent = new SocksProxyAgent("socks5h://192.168.137.133:9050");

https.get("https://ifconfig.me", {
  agent
}, res => {
  res.pipe(process.stdout);
}); */


const config = {
    host: "192.168.10.102",
    port: 5555
}

const b64 = new b64coder()
const crypt = new CryptorAES(password, iv)


function translate_out(cleartext){
    const encodedData = b64.encode_b64(cleartext.toString())
    const encrypted = crypt.encrypt(encodedData)
    return(encrypted)
}

function translate_in(ciphertext){
    //console.log(ciphertext.toString())
    const decrypted = crypt.decrypt(ciphertext.toString())
    const decodedData = b64.decode_b64(decrypted)
    return(decodedData)
}


const client = createConnection(config, () => {
    const int = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ""
    })

    int.on("line", (data) => {
        client.write(translate_out(data))
        //int.prompt()
    })

    int.on("SIGINT", () => {
        client.end()
    })

    client.on("data", (data) => {
        console.log(translate_in(data))
        //int.prompt()
    });
     
    client.on("connect", (data) => {
         console.log("Connect Success")
         //int.prompt()
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