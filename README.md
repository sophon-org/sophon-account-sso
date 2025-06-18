# Sophon SSO - Proof of Concept

A passkey-based authentication system for Web3 applications using WebAuthn and account abstraction.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Device with Touch ID, Face ID, Windows Hello, or PIN/password authentication
- Modern browser (Chrome, Safari, Edge, Firefox)

### Installation & Setup

1. **Clone and install:**

   ```bash
   git clone https://github.com/yourusername/sophon-sso.git
   cd sophon-sso
   npm install
   npm run build:connector  # Build the connector library
   ```

2. **Start both services:**

   ```bash
   # Terminal 1: Start auth server (handles authentication)
   npm run dev:auth

   # Terminal 2: Start demo app (example integration)
   npm run dev:demo
   ```

3. **Test the authentication flow:**
   - Open http://localhost:3001 (demo app)
   - Click "Login with Sophon"
   - Complete passkey authentication in the popup
   - See authenticated state back in the demo app

## 📋 What's Running

- **Auth Server**: http://localhost:3000 - Authentication popup service
- **Demo App**: http://localhost:3001 - Example application showing integration
- **Connector**: TypeScript library for integrating Sophon auth into any app

## 🏗️ Project Structure

```
sophon-sso/
├── packages/
│   ├── auth-server/     # Next.js authentication service
│   ├── connector/       # TypeScript connector library
│   └── demo-app/        # Example integration
└── README.md
```

## 🔧 How It Works

1. **Demo app** opens authentication popup (auth-server)
2. **Auth server** handles passkey creation/authentication using WebAuthn
3. **Account creation** generates a smart contract wallet
4. **Authentication data** is sent back to demo app via postMessage
5. **Demo app** receives user data and shows authenticated state

## 🧪 Testing Requirements

**For passkey authentication to work, you need:**

- Biometric authentication enabled (Touch ID, Face ID, Windows Hello)
- OR device PIN/password set up
- Secure context (localhost or HTTPS)

## 🛠️ Available Scripts

```bash
# Build connector library
npm run build:connector

# Development servers
npm run dev:auth        # Start auth server only
npm run dev:demo        # Start demo app only

# Build for production
npm run build:auth      # Build auth server
npm run build:all       # Build all packages
```

## 🔍 Troubleshooting

**"Passkey creation failed"**

- Ensure biometric authentication is enabled on your device
- Try using PIN/password authentication if biometrics aren't available

**"Cross-origin" or popup issues**

- Make sure both services are running on the correct ports
- Auth server: http://localhost:3000
- Demo app: http://localhost:3001

**npm install fails**

- Make sure you're running commands from the project root
- Try deleting `node_modules` and `package-lock.json` then reinstall

## 📝 Integration Guide

To integrate Sophon SSO into your own app:

1. **Install the connector:**

   ```bash
   npm install sophon-sso
   ```

2. **Open authentication popup:**

   ```javascript
   import { openSophonAuth } from "sophon-sso";

   const authData = await openSophonAuth("http://localhost:3000");
   console.log("User authenticated:", authData);
   ```

3. **Handle the authentication response** - see `packages/demo-app/src/` for complete examples

## 🤝 Contributing

This is a proof of concept. Feel free to:

- Test the authentication flow
- Report issues or suggestions
- Fork and experiment with the code

## ⚠️ Important Notes

- This is a **proof of concept** - not production ready
- Passkeys are stored locally on your device
- Auth server should use HTTPS in production
- Smart contract wallet addresses are generated but not deployed to mainnet

---

**Need help?** Open an issue or reach out to the team!
