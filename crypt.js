const { createCipheriv, createDecipheriv, generateKeyPairSync, publicEncrypt, privateDecrypt, constants } = require('crypto');
const { writeFileSync, readFileSync, existsSync, mkdir, mkdirSync } = require('fs');
const path = require('path');

class CryptorAES {
    constructor(password, iv) {
        this.password = password
        this.iv = iv
    }
    encrypt(cleartext) {
        let cipher = createCipheriv("aes-256-ctr", this.password, this.iv);
        let encText = cipher.update(cleartext, 'utf-8', 'hex');
        encText += cipher.final('hex');
        return (encText);
    }

    decrypt(ciphertext) {
        let decipher = createDecipheriv("aes-256-ctr", this.password, this.iv);
        let decText = decipher.update(ciphertext, 'hex', 'utf-8');
        decText += decipher.final('utf-8');
        return (decText);
    }
}


class CryptorRSA {
    constructor(publicKeyPath, privateKeyPath) {
        this.publicKey
        this.privateKey

        if (publicKeyPath === undefined || privateKeyPath === undefined){
            console.log("No keys have been defined. Checking for existing key pair.")
            try {
                if (!existsSync('./keys') === true){
                    console.log("Default keys dir does not exist.")
                    mkdirSync(path.join(__dirname, 'keys'), (err) => {
                        console.log("created keys dir")
                        console.log("generating new key pair and loading them.")
                        this.generateAndLoad()
                    })
                } else {
                    if(existsSync('./keys/public.pem') && existsSync('./keys/private.pem')){
                        console.log("Found existing keys.")    
                        this.loadKeys("./keys/public.pem", "./keys/private.pem")
                    } else {
                        this.generateAndLoad()
                    }
                    
                }
            } catch (error) {
                console.error(error)
            }
            
        }  else {
            this.loadKeys(publicKeyPath, privateKeyPath)
        }
    }

    loadKeys(publicKeyPath, privateKeyPath){
        try {
            const publicKey = readFileSync(publicKeyPath)
            const privateKey = readFileSync(privateKeyPath)
            this.publicKey = publicKey
            this.privateKey = privateKey
        } catch (error) {
            console.error(error)
        }   
    }

    generateNewKeyPair() {
        const { publicKey, privateKey } = generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: "pkcs1",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs1",
                format: "pem",
            }
        })

        try {
            console.log("Writing pub/priv keys to files.")
            writeFileSync("./keys/public.pem", publicKey);
            writeFileSync("./keys/private.pem", privateKey);    
            console.log("Done.")
        } catch (error) {
            console.error(error)
        }
    }

    generateAndLoad(){
        this.generateNewKeyPair()
        this.loadKeys("./keys/public.pem", "./keys/private.pem")
    }

    encrypt(cleartext) {
        const encryptedData = publicEncrypt(
            {
                key: this.publicKey,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(cleartext)
        );
        return encryptedData
    }

    decrypt(buffer) {
        const decryptedData = privateDecrypt(
            {
                key: this.privateKey,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            buffer
        );
        return (decryptedData.toString());
    }

}

class b64coder {
    encode_b64(string){
        let bufferObj = Buffer.from(string, "utf8");
        return(bufferObj.toString("base64"));
    }
    
    decode_b64(b64string){
        let bufferObj = Buffer.from(b64string, "base64");
        return(bufferObj.toString("utf8"));
    }
}


/* 
const pubkey = "./keys/public.pem"
const privkey = "./keys/private.pem"
const rsa = new CryptorRSA(pubkey, privkey)
const data = "test";
const ciphertext = rsa.encrypt(data)
console.log(ciphertext)

const cleartext = rsa.decrypt(ciphertext)
console.log(cleartext)
*/


module.exports = { CryptorAES, CryptorRSA, b64coder }