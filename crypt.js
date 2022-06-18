const { createCipheriv, createDecipheriv, generateKeyPairSync, publicEncrypt, privateDecrypt, constants } = require('crypto');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

class CryptorAES {
    constructor(password, iv) {
        this.password = password
        this.iv = iv
    }

    encrypt(chunk) {
        let cipher = createCipheriv("aes-256-ctr", this.password, this.iv);
        let result = Buffer.concat([cipher.update(chunk), cipher.final()]);
        return result;
    }

    decrypt(chunk) {
        let decipher = createDecipheriv("aes-256-ctr", this.password, this.iv);
        let result = Buffer.concat([decipher.update(chunk), decipher.final()]);
        return result;
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