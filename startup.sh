#!/bin/bash
set -e
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y curl gnupg2 ca-certificates lsb-release software-properties-common

# Node 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs build-essential

# pm2
npm install -g pm2

# nginx
apt-get install -y nginx
systemctl enable --now nginx

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $SUDO_USER || true

# App directory and demo app
mkdir -p /var/www/babynode
cat > /var/www/babynode/index.js <<'EOF'
const http = require("http");
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type":"text/plain"});
  res.end("Baby Node backend is running\n");
});
server.listen(port, () => console.log("Server listening on", port));
EOF

cd /var/www/babynode
pm2 start index.js --name babynode
pm2 save

# nginx reverse proxy
cat > /etc/nginx/sites-available/babynode <<'NGINX'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/babynode /etc/nginx/sites-enabled/babynode
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# certbot (will run manually later with your domain)
apt-get install -y certbot python3-certbot-nginx

# ensure pm2 restarts on reboot
pm2 startup systemd -u $(whoami) --hp /home/$(whoami) || true
pm2 save

echo "startup script finished" > /var/log/babynode-startup.log
