# Kiss2FA

**A lightweight 2FA token manager for advanced users**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 📋 Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [Installation](#-installation)
* [Usage](#-usage)
* [Production Deployment](#-production-deployment)
* [Security](#-security)
* [Backup and Restore](#-backup-and-restore)
* [Contributing](#-contributing)
* [License](#-license)

## 🚀 Overview

Kiss2FA is a lightweight and secure two-factor authentication (2FA) token manager. It allows you to store your TOTP codes securely and provides a simple interface to generate codes on demand. Unlike complex solutions, Kiss2FA follows the KISS (Keep It Simple, Stupid) philosophy by offering only the essential features.

## ✨ Features

* Minimalist and intuitive user interface
* Secure storage of TOTP secrets (AES encryption)
* Automatic generation of time-based codes
* Encrypted data export/import
* Compatible with TOTP standards
* Works with all common services (Google, Microsoft, GitHub, etc.)
* Local web application for optimal security

## 💻 Installation

### Prerequisites

* [Node.js](https://nodejs.org/) (v14 or higher)
* [npm](https://www.npmjs.com/) (v6 or higher)

### Local installation

```bash
# Clone the repository
git clone https://github.com/Kisakay/Kiss2FA.git
cd Kiss2FA

# Install main project dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Start in development mode

```bash
# Start the application (client + server)
npm start

# Or start only the client
npm run dev

# Or start only the server
npm run server
```

The app will be available at [http://localhost:5173](http://localhost:5173) (client) and [http://localhost:3001](http://localhost:3001) (API).

## 🔧 Usage

### First launch

1. Start the app and access the web interface
2. Create a new vault with a strong password
3. Add your first TOTP secrets by scanning a QR code or entering the secret key manually

### Add a new entry

1. Click the "Add" button
2. Scan the service’s QR code or enter the secret manually
3. Name the service
4. Optionally, add an icon or logo
5. Save the entry

### Generate a code

Codes are automatically generated for each entry and update every 30 seconds.

### Export and backup

1. Go to settings
2. Select "Export"
3. Enter your password to confirm
4. Save the generated file in a secure location

## 🏢 Production Deployment

### Option 1: Use with PM2 (recommended)

```bash
# Install PM2
npm install -g pm2

# Start the app
pm2 start server/server.js --name "kiss2fa"
pm2 save
pm2 startup
```

### Option 2: Docker (Untested)

You can create a `Dockerfile` at the project root:

```Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy config files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --production
RUN cd server && npm install --production && cd ..

# Copy remaining files
COPY dist/ ./dist/
COPY server/ ./server/

# Expose port
EXPOSE 3001

# Startup command
CMD ["node", "server/server.js"]
```

Then build and run the container:

```bash
# Build the image
docker build -t kiss2fa .

# Run the container
docker run -d -p 3001:3001 -v /path/to/data:/app/server/data --name kiss2fa kiss2fa
```

## 🔐 Security

### Best practices

* Use HTTPS in production by configuring a reverse proxy like Nginx with Let's Encrypt
* Protect your vault with a strong, unique password
* Avoid exposing the app to the internet if possible; use it locally or through a VPN
* Regularly back up the `server/vault.json` file

### HTTPS configuration with Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 💾 Backup and Restore

### Backup

The most important file to back up is `server/vault.json`, which contains your encrypted data.

```bash
# Manual backup
cp server/vault.json /path/to/backup/
```

### Restore

```bash
# Restore from backup
cp /path/to/backup/vault.json server/
```

You can also use the built-in export/import feature in the web interface.

## 👥 Contributing

Contributions are welcome! Feel free to open an issue or a pull request to improve Kiss2FA.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.