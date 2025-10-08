# FreePress Frontend

The FreePress frontend provides two main interfaces:

## 🌐 Main Page (/)
**Content Discovery & Exploration**

The landing page is designed for content consumers to discover and explore publications on the FreePress network:

- **Discover Publications**: Browse all published content on the network
- **Search & Filter**: Find content by tags and sort by recency or mirror count
- **Read Content**: Access publications via IPFS gateway or Tor onion URLs
- **Mirror Content**: Become a mirror to help keep content available

## 🎛️ Dashboard (/dashboard)
**Publisher Control Panel**

The dashboard is for content publishers to manage their node and publications:

### Publish Tab
- Generate Ed25519 keypair for identity
- Publish WordPress content to IPFS
- Create signed manifests
- Announce publications to the network

### Mirror Tab
- View all content you're mirroring
- Manage storage and pinning
- Configure auto-mirror settings

### Status Tab
- Monitor service health (Backend, IPFS, Tor, WordPress)
- View system information
- Check connectivity status

### Settings Tab
- Manage keypairs (export/import)
- Configure node settings
- Backup and recovery options

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Vite** for build tooling
- **Waku** for decentralized discovery (libp2p pubsub)
- **Protobuf** for message encoding

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Styling

The app follows the FreePress design system with:
- Color palette: `#37322F` (primary), `#F7F5F3` (secondary background)
- Typography: System fonts with serif for headings
- Consistent spacing and borders matching the landing site design

## API Integration

The frontend connects to the FreePress backend at `http://localhost:4000` by default. Configure via `VITE_API_URL` environment variable.

### Key Endpoints

- `GET /api/status` - System status
- `GET /api/discover` - Fetch discovered publications
- `POST /api/publish` - Publish content to IPFS
- `POST /api/generate-keypair` - Generate Ed25519 keys
- `POST /api/sign-manifest` - Sign and publish manifest
- `GET /api/manifests` - Get mirrored content
- `POST /api/mirror` - Start mirroring content
- `DELETE /api/mirror/:cid` - Stop mirroring

## Project Structure

```
src/
├── pages/
│   ├── LandingPage.tsx    # Main discovery interface
│   └── Dashboard.tsx       # Publisher dashboard
├── components/
│   ├── StatusTab.tsx       # System status view
│   ├── PublishTab.tsx      # Publishing interface
│   ├── ExploreTab.tsx      # Network exploration (deprecated - moved to LandingPage)
│   ├── MirrorTab.tsx       # Mirror management
│   └── SettingsTab.tsx     # Settings & configuration
├── App.tsx                 # Router setup
├── main.tsx               # App entry point
└── index.css              # Global styles
```

## Features

✅ **Two-Interface Architecture**
- Consumer-focused landing page for discovery
- Publisher-focused dashboard for management

✅ **Responsive Design**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)

✅ **Real-time Updates**
- Auto-refresh service status every 10s
- Live connection status indicator

✅ **Accessibility**
- Semantic HTML
- Keyboard navigation support
- Focus states on interactive elements

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:4000
```
