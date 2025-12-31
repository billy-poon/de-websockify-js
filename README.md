# de-websockify: Translates normal socket traffic to WebSocket

[websockify](https://github.com/novnc/websockify) translates WebSockets traffic to normal socket traffic, while this package translates normal socket traffic to WebSocket. So you can use it to build a transparent proxy:

[service] <--normal socket--> [websockify] <--WebSocket--> [de-websockify] <--normal socket--> [app]

## Sample Usage

### Server Side

+ [tinyproxy](https://github.com/tinyproxy/tinyproxy) for example
  ```
  sudo apt install -y tinyproxy

  sudo lsof -i 4 -n -P | grep tinyproxy
  ----------------
  tinyproxy 130177       tinyproxy    0u  IPv4 1644173      0t0  TCP *:8888 (LISTEN)
  ----------------
  ```

+ websockify
  ```
  which websockify || sudo python3 -m pip install websockify

  cat <<EOF | sudo tee /lib/systemd/system/websockify-tinyproxy.service > /dev/null
  [Unit]
  Description=tinyproxy via websockify
  After=network-online.target

  [Service]
  Type=simple

  StandardOutput=file:/var/run/websockify-tinyproxy.out
  StandardError=file:/var/run/websockify-tinyproxy.err

  CapabilityBoundingSet=CAP_NET_BIND_SERVICE
  AmbientCapabilities=CAP_NET_BIND_SERVICE
  DynamicUser=true
  LimitNOFILE=32768

  ExecStart=websockify 127.0.0.1:3128 127.0.0.1:8888

  [Install]
  WantedBy=multi-user.target
  EOF

  sudo systemctl enable websockify-tinyproxy.service --now

  sudo lsof -i 4 -n -P | grep websockify | grep -i listen
  ----------------
  websockif  483 websockify-tinyproxy    3u  IPv4  21678      0t0  TCP 127.0.0.1:3128 (LISTEN)
  ...
  ----------------
  ```

+ nginx
  > Replace `domain.com` with your domain name.
  ```
  sudo vim /etc/nginx/sites-enabled/default
  ----------------
  ...
  server {
      listen 80;
      listen 443 ssl;
      server_name domain.com;
      ...

      location /tiny {
          proxy_pass http://127.0.0.1:3128;

          proxy_redirect off;
          proxy_set_header Host $host;

          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
      }
  }
  ...
  ----------------

  sudo nginx -s reload
  ```

### Client Side
> [Node.js](https://nodejs.org/en/download/) is required

+ de-websockify
  ```
  mkdir -pv ~/bin && cd ~/bin

  curl -OL https://github.com/billy-poon/de-websockify-js/raw/refs/heads/master/dist/de-websockify.js

  chmod +x de-websockify.js

  node de-websockify.js 8888 http://domain.com/tiny
  ```

+ Use as http proxy
  ```
  https_proxy=http://127.0.0.1:8888 curl 'https://api64.ipify.org?format=json'
  ----------------
  {"ip":"x.x.x.x"}
  ----------------
  ```
