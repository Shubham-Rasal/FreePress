# FreePress 🕊️

> **Publish Without Permission** - Private, Censorship-Proof, Autonomous Publishing

FreePress is a resilient anonymous publishing system that empowers journalists, activists, and communities to publish and discover content without centralized infrastructure, surveillance, or censorship.

## 🌍 Why FreePress?

The ability to publish freely is under threat from:
- Centralized platform censorship
- Government surveillance and takedowns
- Domain seizures and DNS blocking
- De-anonymization and tracking

FreePress solves this by running **locally on your machine**, serving content over **Tor** and **IPFS**, with decentralized **Waku/libp2p** discovery.

## ✨ Features

- 🖥️ **Local-first** - Runs on your computer, not someone else's cloud
- 🔒 **Private by design** - No accounts, no tracking, no central servers
- 🌐 **Resilient network** - IPFS + Waku/libp2p for unstoppable discovery
- 🧩 **Familiar tools** - Use WordPress or Ghost inside containerized stack
- 🪶 **Anonymous discovery** - Explore publishers without metadata leakage
- 🔄 **Auto-mirroring** - Content persists even when publisher goes offline

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- 4GB RAM minimum
- 10GB free disk space

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FreePress.git
cd FreePress
```

2. **Start the stack**
```bash
docker compose up -d
```

3. **Access the dashboard**
Open your browser to: **http://localhost:3000**

That's it! Your FreePress node is now running.

## 🧩 Architecture

**📊 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed diagrams and data flows.**

```
┌─────────────────────────────────────────┐
│     React Dashboard (Port 5173)         │
│  ┌──────────┬──────────┬─────────────┐  │
│  │ Publish  │ Explore  │   Mirror    │  │
│  └──────────┴──────────┴─────────────┘  │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│     Backend API (Hono - Port 4000)      │
│  • Signing  • Mirroring  • Keypairs    │
└──┬─────────┬──────────┬─────────────────┘
   │         │          │
┌──▼──┐  ┌──▼──────┐  ┌▼─────────┐
│ Tor │  │  IPFS   │  │WordPress │
│ .   │  │ + Cluster│  │ + MySQL  │
│onion│  │         │  │  (80)    │
└─────┘  └────┬────┘  └──────────┘
              │
         ┌────▼────┐
         │  Waku   │
         │Discovery│
         └─────────┘
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| **Dashboard** | 5173 | React frontend UI (Vite) |
| **Landing Site** | 3000 | Next.js marketing site |
| **Backend API** | 4000 | Node.js REST API (Hono) |
| **WordPress** | 80 | CMS for content creation |
| **IPFS Gateway** | 8081 | IPFS HTTP gateway |
| **IPFS API** | 5001 | IPFS RPC API |
| **IPFS Cluster** | 9094 | IPFS Cluster REST API |
| **MySQL** | - | WordPress database (internal) |
| **Tor** | - | Onion service (internal) |
| **Waku** | - | P2P discovery (client-side) |

## 📖 Usage

### 1. Check System Status

Visit http://localhost:3000 to see all services running:
- ✅ Backend API
- ✅ IPFS Node
- ✅ Tor Service (initializing → healthy)
- ✅ WordPress CMS

### 2. Create Content

Access WordPress at http://localhost:8080 to create posts.

### 3. Publish Anonymously

(Coming in Day 2)
- Export content to IPFS
- Generate signed manifest
- Announce to discovery network

### 4. Discover Others

(Coming in Day 4)
- Browse manifests from other publishers
- Access via .onion or IPFS CID
- Mirror content you care about

## 🛠️ Development

### Project Structure

```
FreePress/
├── backend/              # Express API
│   ├── src/
│   │   ├── index.js      # Main server
│   │   └── routes/       # API routes
│   ├── Dockerfile
│   └── package.json
│
├── frontend/             # React Dashboard
│   ├── src/
│   │   ├── App.jsx       # Main component
│   │   └── main.jsx      # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── publisher-agent/      # Export & IPFS service
├── discovery-node/       # Indexer service
├── tor/                  # Tor configuration
│   └── torrc
├── docker-compose.yml
└── README.md
```

### Available Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Reset everything (⚠️ deletes all data)
docker compose down -v
```

## 🔐 Security & Privacy

### What FreePress Protects

✅ **Publisher anonymity** - .onion addresses hide your IP  
✅ **Content integrity** - Ed25519 signatures prevent tampering  
✅ **Censorship resistance** - IPFS mirrors keep content alive  
✅ **Discovery privacy** - Bloom filters prevent metadata leakage  

### What FreePress Doesn't Protect

❌ **Content of posts** - Posts are public once published  
❌ **WordPress login** - Secure your WP admin with strong passwords  
❌ **Network traffic** - Use Tor Browser to access .onion addresses  

### Best Practices

1. **Keep keys secure** - Backup your Ed25519 keypair
2. **Use strong passwords** - For WordPress admin access
3. **Run behind Tor** - Access .onion addresses via Tor Browser only
4. **Rotate keys** - For high-risk publishing scenarios
5. **Monitor mirrors** - Ensure at least 3 nodes mirror your content

## 🗓️ Roadmap

### Week 1 - MVP (Current)

- [x] Day 1: Docker compose + basic dashboard
- [ ] Day 2: IPFS publishing + manifest signing
- [ ] Day 3: Tor integration + onion display
- [ ] Day 4: Waku/libp2p discovery
- [ ] Day 5: UI polish + mirror functionality
- [ ] Day 6: Resilience testing
- [ ] Day 7: Packaging + demo

### Phase 2 - Enhanced Discovery

- [ ] Curator lists & trust system
- [ ] Bloom-filter private search
- [ ] Encrypted keyword search
- [ ] Tag-based filtering

### Phase 3 - Long-term Persistence

- [ ] Filecoin integration
- [ ] Arweave backup
- [ ] web3.storage pinning
- [ ] Automatic backup scheduling

### Phase 4 - Better UX

- [ ] Electron desktop app
- [ ] Mobile reader app
- [ ] Browser extension
- [ ] One-click installer

## 🤝 Contributing

Contributions are welcome! This project is built for a critical need - helping people publish freely under censorship.

### Areas Needing Help

- **Security audit** - Review cryptography and Tor setup
- **UX design** - Make it accessible to non-technical users
- **Documentation** - Guides for journalists and activists
- **Testing** - Real-world censorship scenarios
- **Translations** - Localize for different regions

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built for the **Internet Archive Europe** challenge: *Resilient Anonymous Publishing*

Inspired by:
- [Tor Project](https://www.torproject.org/)
- [IPFS](https://ipfs.tech/)
- [Waku](https://waku.org/)
- [OnionPress](https://github.com/torservers/onionpress)
- [SecureDrop](https://securedrop.org/)

## 📞 Support

- 📖 [Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/yourusername/FreePress/issues)
- 💬 [Discussions](https://github.com/yourusername/FreePress/discussions)
- 🔐 [Security Policy](./SECURITY.md)

---

**Remember**: Free speech is a human right. This tool is designed to protect that right.

*"The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion."* - Albert Camus

