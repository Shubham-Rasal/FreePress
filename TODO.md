# FreePress - Implementation TODO

## Project Goal
Build a resilient, anonymous publishing system with Docker Compose that runs:
- Web dashboard (React) + backend API (Express/Node.js)
- CMS (WordPress or Ghost) running locally
- Tor/Onion routing for the CMS
- IPFS node and publisher-agent that snapshots & publishes to IPFS, signs manifest.json
- Discovery node (indexer) that listens on Waku or libp2p pubsub, pins manifests, exposes /discover API
- Demo script showing publish → discover → node stop → mirror retrieval

---

## Minimum Acceptance Criteria
- [ ] `docker compose up -d` launches all services
- [ ] Dashboard reachable at http://localhost:3000
- [ ] Dashboard can generate Ed25519 keypair and show pubkey
- [ ] Dashboard can export CMS content, `ipfs add -r` it, and produce site_cid
- [ ] `manifest.json` is signed and added to IPFS → manifest_cid
- [ ] Publisher-agent announces manifest_cid on discovery channel
- [ ] Discovery node fetches manifest, verifies signature, pins site_cid and manifest_cid
- [ ] Tor onion address shown in Dashboard
- [ ] Simulate publisher shutdown; indexer/mirror serves content from IPFS CID

---

## Day 1 - Repo Scaffold & Core Compose (Bootstrap)
**Objective**: Get a runnable docker-compose with dashboard, backend, WordPress, Tor, and IPFS. Basic wiring only.

### Tasks
- [ ] Create repo skeleton structure
  - [ ] `/frontend` - React dashboard
  - [ ] `/backend` - Express API (Node.js)
  - [ ] `/publisher-agent` - Export & IPFS service
  - [ ] `/discovery-node` - Indexer service
  - [ ] `/docker` - Docker configs
  
- [ ] Write `docker-compose.yml` with services:
  - [ ] `dashboard` - React dev server or NGINX static
  - [ ] `backend` - Express API (exposes `/api/*`)
  - [ ] `wordpress` - WordPress CMS
  - [ ] `db` - MySQL/MariaDB for WordPress
  - [ ] `tor` - Containerized Tor (alpine/tor or onionize)
  - [ ] `ipfs` - ipfs/kubo
  - [ ] `publisher-agent` - Stub service
  - [ ] `discovery-node` - Stub service

- [ ] Backend: Implement health routes
  - [ ] `GET /api/health` - Service health check
  - [ ] `GET /api/onion-status` - Tor status
  - [ ] `GET /api/ipfs-status` - IPFS node status

- [ ] Dashboard: Simple status page
  - [ ] Show service status tiles
  - [ ] "Generate keypair" button (mock for now)
  - [ ] Basic layout with Tailwind CSS

- [ ] Documentation
  - [ ] `README.md` with run instructions
  - [ ] `.env.example` for configuration

- [ ] Test & validate
  - [ ] Run `docker compose up -d` without errors
  - [ ] Verify all containers start successfully
  - [ ] Access http://localhost:3000 and see dashboard

### Deliverables
- ✅ Working `docker-compose.yml`
- ✅ Dashboard showing container status
- ✅ README with run instructions

### Acceptance Check
- [ ] `docker compose up -d` runs without errors
- [ ] http://localhost:3000 loads dashboard
- [ ] All containers show "running" status

---

## Day 2 - Publisher-Agent: Export, IPFS Add, Signing
**Objective**: Implement publisher-agent to export site, add to IPFS, build signed manifest.

### Tasks
- [ ] Choose and implement export method
  - [ ] WordPress: `wp export` or `wget --mirror` or WP2Static plugin
  - [ ] Ghost: `ghost export` or static build
  - [ ] Decision: Static export via wget for MVP speed

- [ ] Publisher-agent endpoints
  - [ ] `POST /api/publish` - Runs export, `ipfs add -r public/`, returns site_cid
  - [ ] `POST /api/sign-manifest` - Creates and signs manifest.json
  - [ ] `POST /api/generate-keypair` - Generates Ed25519 keypair

- [ ] Implement Ed25519 signing
  - [ ] Add signing utilities (Node.js `tweetnacl` or `@noble/ed25519`)
  - [ ] Generate keypair and store securely
  - [ ] Sign manifest with private key
  - [ ] Return signature and public key

- [ ] IPFS integration
  - [ ] Connect to IPFS API (http://ipfs:5001)
  - [ ] `ipfs add -r public/` → parse and return site_cid
  - [ ] `ipfs add manifest.json` → return manifest_cid
  - [ ] Pin both CIDs automatically

- [ ] Dashboard: Publish UI
  - [ ] Create "Publish" page/tab
  - [ ] Form to trigger `/api/publish`
  - [ ] Display site_cid and manifest_cid
  - [ ] Show publish progress/status

- [ ] Key management
  - [ ] Store private key encrypted on disk
  - [ ] Simple password prompt for MVP
  - [ ] Export/backup keypair functionality

### Code Snippets Reference
```javascript
// Ed25519 signing example (Node.js)
const nacl = require('tweetnacl');
const { Buffer } = require('buffer');

const keypair = nacl.sign.keyPair();
const publicKey = Buffer.from(keypair.publicKey).toString('hex');
const privateKey = Buffer.from(keypair.secretKey).toString('hex');

const manifestString = JSON.stringify(manifest);
const manifestBytes = Buffer.from(manifestString);
const signature = nacl.sign.detached(manifestBytes, keypair.secretKey);
const signatureHex = Buffer.from(signature).toString('hex');
```

### Deliverables
- ✅ Publisher-agent returns site_cid and manifest_cid
- ✅ Dashboard publishes and displays CIDs
- ✅ Keypair generation and storage working

### Acceptance Check
- [ ] Publish flow completes successfully
- [ ] Returns valid manifest_cid and site_cid
- [ ] Can verify signature with public key

---

## Day 3 - Tor + Onion Exposure
**Objective**: Connect CMS to Tor and display onion hostname in dashboard.

### Tasks
- [ ] Configure Tor hidden service
  - [ ] Create `tor/torrc` configuration file
  - [ ] Set `HiddenServiceDir /var/lib/tor/hidden_service/`
  - [ ] Set `HiddenServicePort 80 wordpress:80`
  - [ ] Mount volume to persist onion keys
  - [ ] Set `Log notice stdout`

- [ ] Backend integration
  - [ ] Read `/var/lib/tor/hidden_service/hostname`
  - [ ] Expose via `GET /api/onion-url`
  - [ ] Handle cases where onion not yet generated
  - [ ] Monitor Tor service status

- [ ] Dashboard updates
  - [ ] Display onion URL prominently
  - [ ] Generate QR code for onion address
  - [ ] Add "Copy to clipboard" functionality
  - [ ] Show Tor connection status

- [ ] Testing
  - [ ] Verify onion hostname file is created
  - [ ] Test access via Tor Browser (if available)
  - [ ] Document onion URL access for demo

- [ ] Documentation
  - [ ] Add Tor setup instructions to README
  - [ ] Document onion service architecture
  - [ ] Add security notes about .onion addresses

### Deliverables
- ✅ Onion hostname exposed in Dashboard
- ✅ Tor container and hidden service configured
- ✅ QR code generation for easy sharing

### Acceptance Check
- [ ] Dashboard shows onion address
- [ ] Onion hostname file readable from backend
- [ ] WordPress accessible via .onion (in Tor Browser)

---

## Day 4 - Discovery Mechanism & Indexer
**Objective**: Implement discovery announcement (publisher → pubsub) and indexer that subscribes, fetches, verifies, pins.

### Decision Point
**Choose one for MVP**:
- [ ] **Waku** - For intermittent readers, built-in store/relay
- [ ] **libp2p gossipsub** - Simpler mesh, easier to implement

### Tasks
- [ ] Implement pubsub announcement in publisher-agent
  - [ ] Create announcement message structure
    ```json
    {
      "type": "announce",
      "manifest_cid": "Qm...",
      "timestamp": 1234567890
    }
    ```
  - [ ] Connect to Waku or libp2p node
  - [ ] Publish to topic `resilientpub:announcements`
  - [ ] Handle publish errors/retries

- [ ] Implement discovery-node (indexer)
  - [ ] Subscribe to pubsub topic
  - [ ] On message: fetch `ipfs get manifest_cid`
  - [ ] Validate signature: `verify(manifest.signature, manifest.pubkey)`
  - [ ] Pin both manifest_cid and site_cid
  - [ ] Store manifest in local SQLite DB

- [ ] Discovery API endpoints
  - [ ] `GET /discover?tag=xyz` - Query manifests by tag
  - [ ] `GET /discover` - List all manifests
  - [ ] `GET /manifest/:cid` - Get specific manifest
  - [ ] `GET /stats` - Network statistics

- [ ] Database schema
  - [ ] Create SQLite tables for manifests
  - [ ] Index by CID, pubkey, tags, timestamp
  - [ ] Store pin status and mirror info

- [ ] Dashboard: Explore tab
  - [ ] Query discovery-node API
  - [ ] Display list of discovered manifests
  - [ ] Show tags, pubkey, onion, timestamp
  - [ ] Filter and search functionality

- [ ] IPFS pinning
  - [ ] Pin via `curl -X POST http://ipfs:5001/api/v0/pin/add?arg=<cid>`
  - [ ] Track pin status
  - [ ] Handle pinning errors

### Deliverables
- ✅ Working announcement + indexer
- ✅ Discovery API at http://localhost:port/discover
- ✅ Database storing manifests

### Acceptance Check
- [ ] After publish, indexer logs show "fetched manifest"
- [ ] Indexer verifies signature successfully
- [ ] Indexer pins site_cid
- [ ] Dashboard Explore tab shows discovered content

---

## Day 5 - UI Polish & Mirror Functionality
**Objective**: Make UI usable and demo-ready with Publish/Explore/Mirror flows.

### Tasks
- [ ] Dashboard: Publish page polish
  - [ ] Content preview before publishing
  - [ ] Show onion URL + site CID + manifest CID
  - [ ] Publishing progress indicator
  - [ ] Success/error notifications
  - [ ] Copy buttons for all IDs

- [ ] Dashboard: Explore page
  - [ ] List manifests in card/grid layout
  - [ ] Display: tags, pubkey, onion, mirror status
  - [ ] Search/filter by tags
  - [ ] Sort by timestamp
  - [ ] "Open in Tor" button
  - [ ] "View on IPFS" button

- [ ] Mirror functionality
  - [ ] "Become a Mirror" button on manifest cards
  - [ ] `POST /api/mirror` endpoint
  - [ ] Trigger indexer pin API
  - [ ] Show mirror count per manifest
  - [ ] Display "You are mirroring" status

- [ ] Backend endpoints
  - [ ] `POST /api/mirror` - Calls indexer pin API
  - [ ] `GET /api/manifests` - Returns pinned manifests with mirror info
  - [ ] `DELETE /api/mirror/:cid` - Unpin/stop mirroring

- [ ] Settings page
  - [ ] Display keypair (public key only)
  - [ ] Export keypair (with password protection)
  - [ ] Import keypair
  - [ ] "Nuke data" button - Wipe local key & DB
  - [ ] Confirmation dialogs

- [ ] Styling
  - [ ] Apply Tailwind CSS styling
  - [ ] Responsive layout
  - [ ] Dark mode toggle
  - [ ] Consistent color scheme
  - [ ] Loading states

- [ ] Error handling
  - [ ] User-friendly error messages
  - [ ] Retry mechanisms
  - [ ] Offline state handling

### Deliverables
- ✅ Dashboard with Publish/Explore/Mirror tabs
- ✅ Mirror function pins content
- ✅ Clean, usable UI

### Acceptance Check
- [ ] Reader can click "Mirror" → indexer pins site
- [ ] Indexer shows mirror onion or gateway URL
- [ ] UI is intuitive and responsive

---

## Day 6 - Resilience Tests & Demo Script
**Objective**: Test robustness, automate node stop/start scenarios, finalize demo script.

### Tasks
- [ ] Resilience test cases
  - [ ] **Test 1**: Publish → Discover → Stop publisher
    - [ ] Verify Tor onion unreachable
    - [ ] Verify IPFS site_cid still accessible via indexer
    - [ ] Verify manifest still in discovery
  - [ ] **Test 2**: Multiple indexers
    - [ ] Start 2-3 indexer nodes
    - [ ] Verify all receive announcements
    - [ ] Stop one indexer, verify others continue
  - [ ] **Test 3**: Network partition
    - [ ] Isolate publisher from indexers
    - [ ] Verify content persists on indexers
    - [ ] Reconnect and verify re-announcement

- [ ] Automated test scripts
  - [ ] `scripts/publish_test.sh` - Automated publish flow
  - [ ] `scripts/simulate_failure.sh` - Stop publisher, verify mirrors
  - [ ] `scripts/health_check.sh` - Verify all services running
  - [ ] `scripts/integration_test.sh` - Full end-to-end test

- [ ] Demo script creation
  - [ ] Write step-by-step demo commands
  - [ ] Create demo content (sample posts)
  - [ ] Screenshot/recording points
  - [ ] Narration script

- [ ] Documentation
  - [ ] `docs/demo.md` - Demo walkthrough
  - [ ] `docs/architecture.md` - System architecture
  - [ ] `docs/privacy-model.md` - Privacy guarantees
  - [ ] `docs/troubleshooting.md` - Common issues

- [ ] Performance testing
  - [ ] Measure publish time
  - [ ] Measure discovery latency
  - [ ] Test with large content (images, videos)
  - [ ] Monitor resource usage

### Demo Script Outline
1. **Start** (30s): `docker compose up -d` → show Dashboard
2. **Publish** (60s): Generate keypair → Create post → Publish → Show CIDs
3. **Discover** (30s): Show manifest in Explore tab
4. **Access** (30s): Open onion URL in Tor Browser
5. **Resilience** (90s): Stop publisher → Show onion fails → Access via IPFS
6. **Recovery** (30s): Restart publisher → Show re-announcement
7. **Wrap** (30s): Architecture diagram + key takeaways

### Deliverables
- ✅ Test scripts in `scripts/`
- ✅ Demo script and documentation
- ✅ Performance benchmarks

### Acceptance Check
- [ ] Simulated failure shows mirror serving content
- [ ] All test scripts pass
- [ ] Demo runs smoothly end-to-end

---

## Day 7 - Packaging, Installer & Submission
**Objective**: Make it easy for non-technical users and prepare deliverables.

### Tasks
- [ ] Create installer script
  - [ ] `install.sh` - Check Docker, clone/download repo
  - [ ] Run `docker compose up -d`
  - [ ] Wait for services to be ready
  - [ ] Open http://localhost:3000 automatically
  - [ ] Print onion URL and next steps

- [ ] Environment setup
  - [ ] `.env.example` with all configuration options
  - [ ] Sensible defaults for all services
  - [ ] Comments explaining each variable

- [ ] Demo recording
  - [ ] `scripts/demo-recording.sh` - Automated demo commands
  - [ ] Record 3-5 minute screencast
  - [ ] Add voiceover/captions
  - [ ] Upload to YouTube/Vimeo

- [ ] README finalization
  - [ ] One-line install command
  - [ ] Quick start guide
  - [ ] Architecture overview
  - [ ] Privacy and security notes
  - [ ] Link to demo video
  - [ ] Contributing guidelines
  - [ ] License information

- [ ] Challenge submission package
  - [ ] `docs/summary.md` - One-page project summary
  - [ ] `docs/architecture.md` - Technical architecture
  - [ ] `docs/privacy-model.md` - Privacy guarantees
  - [ ] `docs/tradeoffs.md` - Usability vs resilience vs anonymity
  - [ ] Demo video link
  - [ ] GitHub repository URL

- [ ] Release preparation
  - [ ] Pin all Docker image versions
  - [ ] Create release tarball
  - [ ] GitHub release with changelog
  - [ ] Tag version v0.1.0-alpha

- [ ] Testing on fresh system
  - [ ] Test install.sh on clean Ubuntu VM
  - [ ] Test on macOS (if possible)
  - [ ] Verify first-run experience
  - [ ] Collect timing metrics

- [ ] Security checklist
  - [ ] Disable WordPress telemetry
  - [ ] Disable logging or rotate logs
  - [ ] Encrypt stored keys
  - [ ] Review Tor configuration
  - [ ] Document security considerations

### One-Line Install (Goal)
```bash
curl -fsSL https://freepress.sh/install | bash
```

### Deliverables
- ✅ `install.sh` working on fresh systems
- ✅ Release tarball or GitHub release
- ✅ Complete docs/ folder
- ✅ Demo video (3-5 minutes)

### Acceptance Check
- [ ] Fresh VM user can run install.sh
- [ ] Dashboard accessible at http://localhost:3000
- [ ] All documentation complete
- [ ] Demo video recorded and uploaded

---

## Post-MVP Stretch Goals

### Phase 2 - Enhanced Discovery
- [ ] Curator lists & trust system
- [ ] Bloom-filter based private discovery
- [ ] Encrypted keyword search (PSI)
- [ ] Tag-based filtering with privacy

### Phase 3 - Long-term Persistence
- [ ] Filecoin integration for paid persistence
- [ ] Arweave backup option
- [ ] web3.storage pinning service
- [ ] Automatic backup scheduling

### Phase 4 - Better UX
- [ ] Electron wrapper for desktop app
- [ ] Mobile reader app
- [ ] Browser extension for discovery
- [ ] One-click mirror setup

### Phase 5 - Advanced Features
- [ ] Encrypted content support
- [ ] Subscriber-only content
- [ ] RSS feed generation
- [ ] ActivityPub integration

---

## Progress Tracking

**Week 1 Status**: [ ] Not Started | [x] In Progress | [ ] Complete

- Day 1: [x] COMPLETE ✅
- Day 2: [ ] Not Started
- Day 3: [ ] Not Started
- Day 4: [ ] Not Started
- Day 5: [ ] Not Started
- Day 6: [ ] Not Started
- Day 7: [ ] Not Started

**Last Updated**: 2025-10-07 (Day 1 Complete)

---

## Notes & Decisions

### Technology Choices
- **Backend**: [x] Express (Node.js)
- **Discovery**: [ ] Waku | [ ] libp2p gossipsub
- **CMS**: [ ] WordPress | [ ] Ghost | [ ] Both
- **Styling**: [x] Tailwind CSS

### Key Risks
1. **Pubsub messages lost** if no indexers exist → Mitigation: Run 2+ indexers with demo
2. **IPFS garbage collection** → Mitigation: Pin to web3.storage or volunteer mirrors
3. **Tor availability** → Mitigation: Always provide IPFS gateway fallback

### Questions to Resolve
- [ ] Password encryption for private keys - which library?
- [ ] Static export vs dynamic WP - which is easier?
- [ ] Local SQLite vs Redis for manifest cache?
- [ ] QR code library for onion addresses?

---

## Resources & References

- [Tor Hidden Service Documentation](https://community.torproject.org/onion-services/)
- [IPFS HTTP API](https://docs.ipfs.tech/reference/kubo/rpc/)
- [Waku Documentation](https://docs.waku.org/)
- [libp2p PubSub](https://docs.libp2p.io/concepts/pubsub/overview/)
- [Ed25519 Signing (TweetNaCl.js)](https://github.com/dchest/tweetnacl-js)
- [WordPress Docker](https://hub.docker.com/_/wordpress)
- [Ghost Docker](https://hub.docker.com/_/ghost)

