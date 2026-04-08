# FreePress Desktop Installation

This directory contains the Electron desktop application wrapper for FreePress.

## Quick Start

### Development

1. **Install dependencies** (run once):
   ```bash
   npm run install:all
   ```

2. **Start development mode**:
   ```bash
   npm run dev
   ```
   This will:
   - Start the backend API server
   - Start the frontend dev server
   - Launch Electron with hot-reload

### Building for Production

#### For your current platform:
```bash
npm run package
```

#### For specific platforms:

**macOS:**
```bash
npm run package:mac
```
This creates:
- `release/FreePress-<version>.dmg` (installer)
- `release/FreePress-<version>-mac.zip` (portable)

**Linux:**
```bash
npm run package:linux
```
This creates:
- `release/FreePress-<version>.AppImage` (portable)
- `release/FreePress-<version>.deb` (Debian/Ubuntu)
- `release/FreePress-<version>.rpm` (Fedora/RHEL)

## System Requirements

### Development
- Node.js 22+ (for Waku dependencies)
- npm 10+
- 4GB RAM minimum
- 10GB free disk space

### Production (End Users)
- macOS 10.13+ or Linux (Ubuntu 18.04+, Fedora 32+, etc.)
- 2GB RAM minimum
- 5GB free disk space
- Internet connection (for IPFS and Waku)

## Features

The desktop application includes:

- ✅ **Standalone Application** - No need to install Docker
- ✅ **Self-contained Backend** - Backend API runs within the app
- ✅ **Single Installer** - One-click installation for end users
- ✅ **Auto-updates** - (Coming soon)
- ✅ **Native Menus** - Platform-specific menu integration
- ✅ **System Tray** - (Coming soon)

## Architecture

```
FreePress Desktop
├── electron/          # Electron main process
│   ├── main.js        # App entry point
│   └── icons/         # App icons
├── frontend/          # React UI (Vite)
│   └── dist/          # Built frontend
├── backend/           # Node.js API
│   └── dist/          # Built backend
└── package.json       # Desktop app config
```

## Troubleshooting

### "Cannot find module" errors
Run `npm run install:all` to ensure all dependencies are installed.

### Backend not starting
Check that port 4000 is not already in use.

### Frontend not loading
Ensure the frontend was built: `npm run build:frontend`

### Permission errors on Linux
Make sure the AppImage is executable:
```bash
chmod +x FreePress-*.AppImage
```

## Development Tips

- **DevTools**: Press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Linux) to open DevTools
- **Reload**: Press `Cmd+R` (Mac) or `Ctrl+R` (Linux) to reload the app
- **Force Reload**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Linux)

## Notes

### Docker Services
The desktop application currently runs the frontend and backend, but some services still require Docker:
- IPFS
- Tor
- WordPress

For the full experience, you still need to run:
```bash
docker compose up -d
```

Future versions will bundle these services into the desktop app or provide easier setup.

### Icons
To customize the app icon, replace the placeholder files in `electron/icons/` with:
- `icon.png` (512x512 or 1024x1024 for Linux)
- `icon.icns` (for macOS - use `iconutil` to convert from PNG)
- `icon.ico` (for Windows)

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](../LICENSE) file for details.
