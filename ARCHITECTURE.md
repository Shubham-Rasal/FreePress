# FreePress Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "User Interface"
        Frontend["React Frontend<br/>(Dashboard)<br/>Port 5173"]
        LandingSite["Landing Site<br/>(Next.js)<br/>Port 3000"]
    end

    subgraph "Backend Services"
        Backend["Node.js Backend<br/>(Hono API)<br/>Port 4000"]
        WordPress["WordPress CMS<br/>(MySQL)<br/>Port 80"]
    end

    subgraph "Privacy & Anonymity"
        Onionize["Tor Onionize<br/>(Onion Service)"]
        TorService["Tor Hidden Service<br/>(.onion address)"]
    end

    subgraph "Storage & Distribution"
        IPFS["IPFS Kubo<br/>(Port 5001/8081)"]
        IPFSCluster["IPFS Cluster<br/>(Port 9094/9096)"]
        StaticSite["Static Site Mirror<br/>/static_site volume"]
    end

    subgraph "Discovery Network"
        Waku["Waku Network<br/>(libp2p ReliableChannel)"]
        Protobuf["Protobuf Messages<br/>(ManifestMessage)"]
    end

    subgraph "Cryptography"
        Ed25519["Ed25519 Keypair<br/>(Signing)"]
        Manifest["Signed Manifest<br/>(JSON + Signature)"]
    end

    %% User interactions
    Frontend -->|API Calls| Backend
    Frontend -->|Waku Connection| Waku
    Frontend -->|IPFS Queries| IPFS
    
    %% Publishing flow
    WordPress -->|Content Creation| Backend
    Backend -->|Mirror via Tor| TorService
    Onionize -->|Manages| TorService
    Backend -->|wget + torsocks| StaticSite
    StaticSite -->|Auto-sync every 60s| IPFS
    IPFS -->|Replication| IPFSCluster
    
    %% Signing & Discovery
    Backend -->|Generate/Load| Ed25519
    Ed25519 -->|Sign| Manifest
    Manifest -->|Publish| IPFS
    Manifest -->|Encode| Protobuf
    Protobuf -->|Announce| Waku
    
    %% Discovery
    Waku -->|Listen| Frontend
    Frontend -->|Display Publications| Frontend

    style Frontend fill:#4A90E2
    style Backend fill:#50C878
    style IPFS fill:#69D2E7
    style Waku fill:#F39C12
    style Ed25519 fill:#E74C3C
    style TorService fill:#9B59B6
```

## Publishing Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard as React Dashboard
    participant Backend as Backend API
    participant WordPress
    participant Tor
    participant IPFS
    participant Waku as Waku Network
    participant Peers as Discovery Peers

    User->>Dashboard: 1. Access Dashboard
    User->>WordPress: 2. Create Content
    User->>Dashboard: 3. Click "Create Mirror"
    
    Dashboard->>Backend: POST /api/mirror/start
    Backend->>Tor: Get .onion address
    Backend->>Tor: wget via torsocks
    Tor-->>Backend: Static site files
    Backend->>IPFS: Auto-sync (60s interval)
    IPFS-->>Backend: Site CID
    
    User->>Dashboard: 4. Generate Keypair
    Dashboard->>Backend: POST /api/generate-keypair
    Backend-->>Dashboard: Ed25519 Public Key
    
    User->>Dashboard: 5. Add Metadata<br/>(Title, Description, Tags)
    User->>Dashboard: 6. Sign & Announce
    
    Dashboard->>IPFS: Get Site CID
    IPFS-->>Dashboard: CID from MFS
    
    Dashboard->>Backend: POST /api/sign-manifest<br/>{site_cid}
    Backend->>Backend: Create manifest JSON
    Backend->>Backend: Sign with Ed25519
    Backend->>IPFS: Publish signed manifest
    IPFS-->>Backend: Manifest CID
    Backend-->>Dashboard: {manifest_cid, signature}
    
    Dashboard->>Waku: Announce via ReliableChannel
    Note over Dashboard,Waku: Protobuf encoded:<br/>timestamp, cids, pubkey,<br/>signature, metadata
    Waku->>Peers: Broadcast announcement
    
    Peers->>IPFS: Fetch & verify content
    Peers->>Peers: Pin content (mirroring)
```

## Data Flow

```mermaid
flowchart LR
    A[WordPress Content] --> B[Tor Mirror]
    B --> C[Static Files]
    C --> D[IPFS Storage]
    D --> E[CID Generated]
    
    E --> F[Create Manifest]
    G[Ed25519 Keypair] --> H[Sign Manifest]
    F --> H
    H --> I[Signed Manifest JSON]
    
    I --> J[Publish to IPFS]
    J --> K[Manifest CID]
    
    K --> L[Encode Protobuf]
    M[Metadata<br/>Title/Desc/Tags] --> L
    L --> N[Waku Announcement]
    
    N --> O[Discovery Network]
    O --> P[Other Nodes]
    P --> Q[Verify & Mirror]
```

## Component Integration

```mermaid
graph LR
    subgraph "Docker Compose Stack"
        A[WordPress + MySQL]
        B[Onionize]
        C[IPFS Kubo]
        D[IPFS Cluster]
        E[Backend API]
        F[Frontend]
    end
    
    subgraph "Shared Volumes"
        V1[static_site]
        V2[onion_services]
        V3[ipfs_data]
        V4[backend/keys]
    end
    
    A -.->|writes| V1
    B -.->|manages| V2
    C -.->|stores| V3
    E -.->|stores keys| V4
    
    V1 -.->|reads| C
    V2 -.->|reads| E
    V2 -.->|reads| C
```

## Technology Stack

```mermaid
mindmap
  root((FreePress))
    Frontend
      React + TypeScript
      Vite
      Waku SDK
      Protobuf.js
      Axios
    Backend
      Node.js
      Hono Framework
      Ed25519 Crypto
      Axios
    Storage
      IPFS Kubo
      IPFS Cluster
      MFS Mutable File System
    Privacy
      Tor Onionize
      Onion Services
      torsocks
    Discovery
      Waku libp2p
      ReliableChannel
      Protobuf Messages
    Publishing
      WordPress
      MySQL
      wget mirroring
    Security
      Ed25519 Signatures
      Cryptographic Manifests
      Signature Verification
```

## Manifest Structure

```mermaid
classDiagram
    class Manifest {
        +string version
        +string site_cid
        +uint64 timestamp
        +string publisher (hex pubkey)
        +string signature (hex)
    }
    
    class WakuMessage {
        +uint64 timestamp
        +string manifest_cid
        +string site_cid
        +string pubkey
        +string signature
        +string title
        +string description
        +string tags (CSV)
        +string onion_url
        +uint32 mirror_count
    }
    
    class WordPressMirror {
        +string id
        +string name
        +string path
        +number createdAt
        +number size
        +number fileCount
        +string ipfsCid
        +boolean isPinned
    }
    
    Manifest --> WakuMessage : announces
    WordPressMirror --> Manifest : generates
```

## Network Discovery Flow

```mermaid
stateDiagram-v2
    [*] --> Initialization
    Initialization --> WakuConnecting: Start Waku Node
    WakuConnecting --> WakuHealthy: Connection Success
    WakuConnecting --> WakuUnhealthy: Connection Failed
    
    WakuHealthy --> Listening: Subscribe to Channel
    Listening --> MessageReceived: Announcement Detected
    
    MessageReceived --> Decoding: Decode Protobuf
    Decoding --> Verification: Verify Signature
    Verification --> Valid: Ed25519 Check Pass
    Verification --> Invalid: Signature Fail
    
    Valid --> FetchContent: Get from IPFS
    FetchContent --> Display: Show in Explore Tab
    Display --> Listening
    
    Invalid --> Listening: Discard Message
    WakuUnhealthy --> WakuConnecting: Retry
```

## IPFS Sync Process

```mermaid
sequenceDiagram
    participant Mirror as WordPress Mirror
    participant FS as File System (/static_site)
    participant IPFS as IPFS Daemon
    participant MFS as MFS (/site/{onion})
    participant Frontend
    
    loop Every 60 seconds
        Note over IPFS: Check for onion address
        IPFS->>FS: Read /var/lib/tor/.../hostname
        IPFS->>FS: Find mirror directory
        FS-->>IPFS: /site/wordpress/{onion_addr}
        
        IPFS->>MFS: Remove old /site/{onion}
        IPFS->>MFS: Add -r mirror_dir
        MFS-->>IPFS: New CID generated
        
        Note over IPFS: Content now pinned & addressable
    end
    
    Frontend->>IPFS: Query MFS /site/{onion}
    IPFS-->>Frontend: Return CID
    Frontend->>Frontend: Use CID for signing
```

## Key Features

### ✅ Implemented
- WordPress local publishing
- Tor onion service integration
- Static site mirroring via wget + torsocks
- IPFS automatic syncing (60s intervals)
- Ed25519 keypair generation & storage
- Manifest signing
- IPFS manifest publishing (on-chain)
- Waku P2P discovery network
- Protobuf message encoding
- Real-time CID fetching from IPFS MFS
- Publication metadata (title, description, tags)
- Cryptographic signature verification UI
- Multi-tab dashboard (Publish, Explore, Mirror, Settings)

### 🔄 Architecture Highlights
- **Decentralized**: No central servers, all P2P
- **Censorship-resistant**: Tor + IPFS + Waku
- **Cryptographically signed**: Ed25519 for authenticity
- **Privacy-preserving**: Onion services, no accounts
- **Resilient**: Content persists via IPFS pinning
- **Discoverable**: Waku announcements for network-wide visibility


