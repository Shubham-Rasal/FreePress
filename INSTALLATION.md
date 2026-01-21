# FreePress Desktop Application - Installation and Usage Guide

## 📦 What's Been Implemented

FreePress now has a **user-friendly desktop application** that runs on **macOS** and **Linux** with a single installer. No need to manually set up Docker Compose or run multiple commands!

## 🎉 Features

- ✅ **One-Click Installation**: Simple installers for Mac (.dmg) and Linux (.AppImage, .deb, .rpm)
- ✅ **Standalone Application**: Frontend and backend bundled together
- ✅ **Cross-Platform**: Works on macOS 10.13+ and Linux (Ubuntu 18.04+, Fedora 32+, etc.)
- ✅ **Auto-Start Backend**: Backend API starts automatically when you open the app
- ✅ **Native Menus**: Platform-specific application menus
- ✅ **Updated Dependencies**: All packages updated to latest compatible versions
- ✅ **Zero Build Errors**: Clean builds with no TypeScript or dependency errors

## 📥 Installation

### Linux

#### Option 1: AppImage (Recommended - Works on all distros)
1. Download `FreePress-0.1.0.AppImage` from releases
2. Make it executable:
   ```bash
   chmod +x FreePress-*.AppImage
   ```
3. Run it:
   ```bash
   ./FreePress-*.AppImage
   ```

#### Option 2: Debian/Ubuntu (.deb)
```bash
sudo dpkg -i freepress-desktop_0.1.0_amd64.deb
```

#### Option 3: Fedora/RHEL (.rpm)
```bash
sudo rpm -i freepress-desktop-0.1.0.x86_64.rpm
```

### macOS

1. Download `FreePress-<version>.dmg` from releases
2. Open the DMG file
3. Drag FreePress to Applications
4. Launch from Applications

**Note**: On first launch, you may need to right-click → Open to bypass Gatekeeper.

## 🚀 Running the Application

1. **Launch FreePress** from your applications menu or by double-clicking the AppImage
2. The app will:
   - Start the backend API on port 4000
   - Open the React dashboard in a native window
   - Connect to Docker services (IPFS, Tor, WordPress)

3. **First-time setup**: You still need Docker services running:
   ```bash
   cd FreePress
   docker compose up -d
   ```

## 🏗️ Building from Source

### Prerequisites
- Node.js 22+ (for Waku dependencies)
- npm 10+

### Build Instructions

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Build for your platform**:

   **Linux:**
   ```bash
   npm run package:linux
   ```
   
   **macOS:**
   ```bash
   npm run package:mac
   ```

3. **Find your installers in `release/` directory**:
   - `FreePress-0.1.0.AppImage` (Linux portable)
   - `freepress-desktop_0.1.0_amd64.deb` (Debian/Ubuntu)
   - `freepress-desktop-0.1.0.x86_64.rpm` (Fedora/RHEL)
   - `FreePress-0.1.0.dmg` (macOS)

## 🔧 Development Mode

For developers wanting to work on the app:

```bash
# Start backend, frontend, and Electron with hot-reload
npm run dev
```

This will:
- Start backend on port 4000 with watch mode
- Start Vite dev server on port 5173
- Open Electron window with DevTools

## 📋 System Requirements

### End Users
- **macOS**: 10.13 High Sierra or later
- **Linux**: Ubuntu 18.04+, Fedora 32+, or any modern distro
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 5GB free space
- **Internet**: Required for IPFS and Waku

### Developers
- Node.js 22+ (required for Waku packages)
- npm 10+
- 4GB RAM minimum
- 10GB free disk space

## 🐳 Docker Services

The desktop app handles the frontend and backend, but these services still run via Docker:

- **IPFS**: Decentralized storage
- **Tor**: Anonymous onion services
- **WordPress**: Content management

To start Docker services:
```bash
docker compose up -d
```

Check service status:
```bash
docker compose ps
```

## 📝 What Was Fixed

### 1. Dependency Updates
- ✅ Updated `@waku/react` from `0.0.7-b9d400c` to `0.0.8` (React 19 support)
- ✅ Updated `@waku/sdk` from `0.0.35` to `0.0.36`
- ✅ Fixed peer dependency conflicts

### 2. Build Errors Fixed
- ✅ Resolved TypeScript unused variable warnings
- ✅ Fixed React version compatibility issues
- ✅ Clean builds with zero errors

### 3. Desktop App Implementation
- ✅ Created Electron main process with backend integration
- ✅ Configured electron-builder for packaging
- ✅ Created application icons (512x512 with multiple sizes)
- ✅ Added platform-specific build scripts
- ✅ Integrated native menus and window management

### 4. Security
- ✅ CodeQL security scan: **Zero vulnerabilities found**
- ✅ No code quality issues
- ✅ All dependencies up to date

## 📚 Documentation

- **Desktop Setup**: [DESKTOP.md](DESKTOP.md) - Detailed desktop development guide
- **Main README**: [README.md](README.md) - Full project documentation
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

## 🎯 Usage

1. **Create Content**: Access WordPress at http://localhost:80
2. **Create Mirror**: Click "Create New Mirror" in the Publish tab
3. **Sign & Announce**: Generate keypair, add metadata, and publish to IPFS/Waku
4. **Explore**: Discover other publications in the Explore tab

## 🐛 Troubleshooting

### App won't start
- Check if ports 4000 and 5173 are available
- Ensure Docker services are running: `docker compose ps`

### Backend API not responding
- Check backend logs in the app's DevTools (View → Toggle Developer Tools)
- Restart the application

### IPFS not connecting
- Ensure Docker IPFS service is running: `docker compose up -d ipfs`
- Check IPFS is accessible: `curl http://localhost:5001/api/v0/version`

### Linux permissions
For AppImage:
```bash
chmod +x FreePress-*.AppImage
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Built for the Internet Archive Europe challenge: Resilient Anonymous Publishing**

*"The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion."* - Albert Camus
