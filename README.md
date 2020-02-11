B4Bcore
=======

This project is for end users of the B4Bcoin.  It's purpose is to help them install and configure the full stack, giving them access to the API and Block Explorer.

----
Getting Started
=====================================
Known to work on this platform: Ubuntu 16.04/x86_64

Deploying B4bcore full-stack manually:
----
````
mkdir ~/bdk
mkdir ~/.b4bcore
mkdir ~/.b4bcore/data
cd ~/bdk
sudo apt-get update
sudo apt-get -y install libevent-dev libboost-all-dev libminiupnpc10 libzmq5 software-properties-common curl git build-essential libzmq3-dev
sudo add-apt-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get -y install libdb4.8-dev libdb4.8++-dev
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

##(restart your shell/os)##
cd ~/rdk
nvm install lts/dubnium
nvm install-latest-npm
nvm use lts/dubnium
##(install mongodb)##
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod.service

##(restart your shell/os)##
cd ~/bdk
##(install b4bcore)##
git clone https://github.com/B4Bcoin/b4bcore.git

## install b4bcore, with or without b4bcoin
## option 1: downloads and installs b4bcoin at /node_modules/b4bcore-node/bin/b4bd
npm install -g b4bcore --production
## options 2: use this instead if you're maintaining your own b4bcoin installation
#SKIP_B4BCOIN_DOWNLOAD=1 npm install -g b4bcore --production

````

b4bcore Node Configuration
---
Copy the [example configuration](examples/b4bcore-node.json) to `~/.b4bcore/b4bcore-node.json`
also the b4b.conf needs to be in `~/.b4bcore/data/`

Some things you'll want to customize:
----
- `insight-api/db`: settings should match the ones you use when you set up Mongo (see below)
- `disableCors`: set to `false` if you want to restrict cross-origin requests.
- socket.io
  - If you'd like to restrict other services from being able to query your API with live updates:
    - add this setting at the top level (does not follow standard regex rules. If you have a subdomain, the format would be(without angle brackets<>):
      - `"allowedOriginRegexp": "^https://<yourdomain>\\.<yourTLD>$"`
      - `"allowedOriginRegexp": "^https://<yoursubdomain>\\.<yourdomain>\\.<yourTLD>$"`
    - change `disablePolling` to `true`
  - `enableSocketRPC` should be set to `false` unless you can control who is connecting to your socket.io service.


Mongo Configuration
---
MongoDB is used to store values behind some stats endpoints.  Run the following commands to set it up (the ones that start with `>` are run within mongo):
````
mongo
>use b4b-api-livenet
>db.createUser( { user: "test", pwd: "test1234", roles: [ "readWrite" ] } )
>exit
````

(NOTE: if you change any of the values here, change them in the `insight-api/db` section of your `b4bcore-node.json`)

b4bcoin Node Configuration
---
Copy the [example configuration](examples/b4b.conf) to `~/.b4bcore/data/b4b.conf`

(NOTE: If you change the rpcuser or rpcpassword in this file be sure to also change it in the `b4bd` section of your `~/.b4bcore/b4bcore-node.json`)

Launch b4bcore
---
````
b4bcored
````
You can then view the b4bcoin block explorer at the location: `http://localhost:3001`

Troubleshooting
----
Here are a few known issues that have come up and workarounds.

If the mongod isn't running some users have fixed it with these steps:
1. change mongo host from 127.0.0.1 --> 0.0.0.0 in /etc/mongod.conf
2. restart with sudo service mongod restart

If npm is having trouble with node-x16r:
1. sudo apt-get install node-gyp
2. run node-gyp rebuild from b4bcore/node_modules/node-x16r
3. run npm install from b4bcore/node_modules/node-x16r

If node is having trouble with "zmq.node":
1. run `npm install zeromq` in b4bcore
2. or, run `npm rebuild zeromq` in b4bcore

There may still be some lurking problems with the download-b4bd script:
* unknown host breaks download into interactive mode
* the `ln` doesn't seem to work (but works manually afterwards)
* there's a path setting problem if b4bcore isn't in your home directory



Create an Nginx proxy
----
To forward port 80 and 443 (with a snakeoil ssl cert) traffic:

IMPORTANT: this "nginx-b4bcore" config is not meant for production use
see this guide [here](https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/) for production usage
````
sudo apt-get install -y nginx ssl-cert
````
copy the following into a file named "nginx-b4bcore" and place it in /etc/nginx/sites-available/
````
server {
    listen 80;
    listen 443 ssl;

    include snippets/snakeoil.conf;
    root /home/b4bcore/www;
    access_log /var/log/nginx/b4bcore-access.log;
    error_log /var/log/nginx/b4bcore-error.log;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 10;
        proxy_send_timeout 10;
        proxy_read_timeout 100; # 100s is timeout of Cloudflare
        send_timeout 10;
    }
    location /robots.txt {
       add_header Content-Type text/plain;
       return 200 "User-agent: *\nallow: /\n";
    }
    location /b4bcore-hostname.txt {
        alias /var/www/html/b4bcore-hostname.txt;
    }
}
````
Then enable your site:
````
sudo ln -s /etc/nginx/sites-available/nginx-b4bcore /etc/nginx/sites-enabled
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default
sudo mkdir /etc/systemd/system/nginx.service.d
sudo printf "[Service]\nExecStartPost=/bin/sleep 0.1\n" | sudo tee /etc/systemd/system/nginx.service.d/override.conf
sudo systemctl daemon-reload
sudo systemctl restart nginx
````
Upgrading b4bcore full-stack manually:
----

- This will leave the local blockchain copy intact:
Shutdown the b4bcored application first, and backup your unique b4b.conf and b4bcore-node.json
````
$cd ~/
$rm -rf .npm .node-gyp b4bcore
$rm .b4bcore/data/b4b.conf .b4bcore/b4bcore-node.json
##reboot##
$git clone https://github.com/B4Bcoin/b4bcore.git
$npm install -g b4bcore --production
````
(recreate your unique b4b.conf and b4bcore-node.json)

- This will redownload a new blockchain copy:
(Some updates may require you to reindex the blockchain data. If this is the case, redownloading the blockchain only takes 20 minutes)
Shutdown the b4bcored application first, and backup your unique b4b.conf and b4bcore-node.json
````
$cd ~/
$rm -rf .npm .node-gyp b4bcore
$rm -rf .b4bcore
##reboot##
$git clone https://github.com/B4Bcoin/b4bcore.git
$npm install -g b4bcore --production
````
(recreate your unique b4b.conf and b4bcore-node.json)

#reboot

git clone https://github.com/B4Bcoin/b4bcore.git
cd b4bcore && git checkout lightweight
npm install -g --production
````
(recreate your unique b4b.conf and b4bcore-node.json)

Undeploying b4bcore full-stack manually:
----
````
nvm deactivate
nvm uninstall 10.5.0
rm -rf .npm .node-gyp b4bcore
rm .b4bcore/data/b4b.conf .b4bcore/b4bcore-node.json
mongo
>use b4b-api-livenet
>db.dropDatabase()
>exit
````

## Applications

- [Node](https://github.com/B4Bcoin/b4bcore-node) - A full node with extended capabilities using b4bcoin Core
- [Insight API](https://github.com/B4Bcoin/insight-api) - A blockchain explorer HTTP API
- [Insight UI](https://github.com/B4Bcoin/insight) - A blockchain explorer web user interface

## Libraries

- [Lib](https://github.com/B4Bcoin/b4bcore-lib) - All of the core b4bcoin primatives including transactions, private key management and others
- [P2P](https://github.com/B4Bcoin/b4bcore-p2p) - The peer-to-peer networking protocol
- [Message](https://github.com/B4Bcoin/b4bcore-message) - b4bcoin message verification and signing

## Security

We're using b4bcore in production, but please use common sense when doing anything related to finances! We take no responsibility for your implementation decisions.

## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. For more information on how to contribute, please refer to our [CONTRIBUTING](https://github.com/B4Bcoin/b4bcore/blob/master/CONTRIBUTING.md) file.

To verify signatures, use the following PGP keys:
- TBD

## License

Code released under [the MIT license](https://github.com/B4Bcoin/b4bcore/blob/master/LICENSE).
