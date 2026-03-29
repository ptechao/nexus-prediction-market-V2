#!/bin/bash
set -e

DOMAIN="nexus.gocc.store"

echo "[1/3] Installing Nginx..."
apt-get update
apt-get install -y nginx

echo "[2/3] Creating Nginx Configuration for $DOMAIN (Cloudflare-Ready)..."
cat <<EOF > /etc/nginx/sites-available/nexus
server {
    listen 80;
    server_name $DOMAIN;

    # Important for Cloudflare/Proxy IP handling
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 199.27.128.0/21;
    real_ip_header CF-Connecting-IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Activate the site
if [ ! -f /etc/nginx/sites-enabled/nexus ]; then
  ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/nexus
fi

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

echo "[3/3] Testing Nginx Configuration & Restarting..."
nginx -t
systemctl restart nginx

echo "Nginx Proxy Configuration DONE for $DOMAIN!"
echo "Please set your Cloudflare SSL mode to 'Flexible'."
systemctl status nginx --no-pager
