# WordPress Multi-Page Mirroring to IPFS

## Overview

The FreePress publisher-agent implements automatic periodic mirroring of WordPress sites to IPFS, preserving the complete multi-page structure and all internal paths. This ensures that content remains accessible even if the original WordPress instance goes offline.

## How It Works

### Architecture

The publisher-agent runs as a sidecar container alongside WordPress, periodically:
1. Exporting the entire WordPress site using `wget --mirror`
2. Uploading the complete directory structure to IPFS
3. Pinning the content to ensure it's retained

```
┌──────────────┐     ┌──────────────────┐     ┌──────────┐
│  WordPress   │────▶│ Publisher-Agent  │────▶│   IPFS   │
│              │     │  (Sidecar)       │     │          │
│              │     │  - Export        │     │  - Store │
│              │     │  - Upload        │     │  - Pin   │
│              │     │  - Schedule      │     │          │
└──────────────┘     └──────────────────┘     └──────────┘
                            │
                            ▼
                     (Repeats every N hours)
```

### Export Process

The export uses `wget --mirror` with the following options:
- `--mirror`: Recursive download with infinite depth and timestamping
- `--page-requisites`: Download all files necessary to display HTML pages (CSS, images, JS)
- `--adjust-extension`: Save HTML files with `.html` extension
- `--convert-links`: Convert links for local viewing and proper navigation
- `--no-parent`: Don't ascend to parent directory
- `--restrict-file-names=windows`: Sanitize filenames for cross-platform compatibility

This ensures that:
- ✅ All pages are exported
- ✅ All assets (images, CSS, JavaScript) are included
- ✅ Internal links work correctly
- ✅ Directory structure is preserved
- ✅ Multi-page navigation works in IPFS

### IPFS Upload

The exported site is uploaded to IPFS with:
- `wrap-with-directory=true`: Preserves the directory structure
- `recursive=true`: Uploads all files and subdirectories
- Automatic pinning to prevent garbage collection

The resulting IPFS CID points to the root directory of the site, making it accessible via:
```
http://ipfs-gateway:8080/ipfs/<CID>/
```

## Configuration

### Environment Variables

Configure the publisher-agent via environment variables in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `IPFS_HOST` | `ipfs` | IPFS node hostname |
| `IPFS_PORT` | `5001` | IPFS API port |
| `WORDPRESS_HOST` | `wordpress` | WordPress hostname |
| `WORDPRESS_PORT` | `80` | WordPress port |
| `MIRROR_INTERVAL` | `3600000` | Mirror interval in milliseconds (1 hour) |
| `PORT` | `3001` | API server port |

### Example Configuration

```yaml
publisher-agent:
  build:
    context: ./publisher-agent
  environment:
    - IPFS_HOST=ipfs
    - IPFS_PORT=5001
    - WORDPRESS_HOST=wordpress
    - WORDPRESS_PORT=80
    - MIRROR_INTERVAL=3600000  # 1 hour
  ports:
    - "3001:3001"
  depends_on:
    - wordpress
    - ipfs
```

## API Endpoints

### Manual Trigger

Trigger a manual mirror operation:

```bash
curl -X POST http://localhost:3001/api/mirror
```

Response:
```json
{
  "success": true,
  "cid": "QmXxxx...",
  "size": "12345",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Health Check

Check the service status:

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "service": "publisher-agent",
  "ipfsHost": "ipfs:5001",
  "wordpressHost": "wordpress:80",
  "mirrorInterval": 3600000
}
```

## Usage

### Start the Stack

```bash
docker compose up -d
```

The publisher-agent will:
1. Wait 30 seconds for services to initialize
2. Run the first mirror operation
3. Continue mirroring at the configured interval

### View Logs

```bash
# View publisher-agent logs
docker compose logs -f publisher-agent
```

Example output:
```
╔════════════════════════════════════════════════════════╗
║        FreePress Publisher Agent                       ║
╚════════════════════════════════════════════════════════╝

🚀 Publisher Agent initialized
📦 IPFS Host: ipfs:5001
🌐 WordPress Host: wordpress:80
⏰ Mirror Interval: 3600000ms (60 minutes)

🌐 API server listening on port 3001

⏳ First mirror will run in 30 seconds...

🔄 Starting WordPress mirroring cycle...
🕐 Started at: 2024-01-01T00:00:00.000Z
📥 Starting WordPress export...
🔧 Running wget command...
✅ WordPress export completed
📤 Uploading to IPFS...
✅ Uploaded to IPFS: QmXxxx...
🔗 IPFS Gateway URL: http://ipfs:8080/ipfs/QmXxxx...
📌 Pinning to IPFS: QmXxxx...
✅ Pinned to IPFS
✅ Mirror cycle completed successfully
⏱️  Duration: 45.23 seconds
📦 Site CID: QmXxxx...
```

### Access Mirrored Content

Once mirrored, access your site via IPFS:

```bash
# Using local IPFS gateway
http://localhost:8081/ipfs/<CID>/

# Using public IPFS gateways
https://ipfs.io/ipfs/<CID>/
https://gateway.pinata.cloud/ipfs/<CID>/
https://cloudflare-ipfs.com/ipfs/<CID>/
```

### Manual Trigger

Trigger an immediate mirror (useful after publishing new content):

```bash
curl -X POST http://localhost:3001/api/mirror
```

## Multi-Page Support

The implementation fully supports multi-page WordPress sites:

### Page Types Supported
- ✅ Home page
- ✅ Posts and pages
- ✅ Categories and archives
- ✅ Custom post types
- ✅ Media (images, videos)
- ✅ Static assets (CSS, JavaScript)
- ✅ RSS feeds
- ✅ Sitemap

### Path Preservation

All internal paths are preserved and converted for local browsing:
- `/about/` → `/about/index.html`
- `/post/my-article/` → `/post/my-article/index.html`
- `/wp-content/uploads/image.jpg` → `/wp-content/uploads/image.jpg`

### Navigation

Internal links are automatically converted by `wget` to work in the IPFS environment, so:
- Navigation between pages works correctly
- Asset loading (images, CSS, JS) works correctly
- The site functions as a complete static copy

## Troubleshooting

### Mirror Not Running

Check that all services are running:
```bash
docker compose ps
```

Ensure WordPress is accessible:
```bash
curl http://localhost:8080
```

### IPFS Upload Fails

Check IPFS is running:
```bash
curl http://localhost:5001/api/v0/version
```

Check IPFS logs:
```bash
docker compose logs -f ipfs
```

### Incomplete Export

If some pages are missing:
1. Check WordPress is fully loaded (all plugins activated)
2. Verify all pages are published (not draft)
3. Check for broken internal links
4. Increase wget timeout if needed

### Large Sites

For large WordPress sites (>1GB):
1. Increase `MIRROR_INTERVAL` to allow more time between exports
2. Monitor disk space in `/tmp/wordpress-export`
3. Consider selective export of recent content only

## Performance Considerations

### Export Time
- Small sites (<100 pages): 10-30 seconds
- Medium sites (100-1000 pages): 1-5 minutes
- Large sites (>1000 pages): 5-20 minutes

### IPFS Upload Time
- Depends on site size
- Local IPFS node: Fast (same machine)
- Remote IPFS node: Slower (network transfer)

### Storage
- Exports stored temporarily in `/tmp/wordpress-export`
- Automatically cleaned before each new export
- IPFS storage: Pinned content retained permanently

### Interval Recommendations

| Site Update Frequency | Recommended Interval |
|----------------------|---------------------|
| Hourly posts | 30 minutes (`1800000`) |
| Daily posts | 1-2 hours (`3600000` - `7200000`) |
| Weekly posts | 6-12 hours (`21600000` - `43200000`) |
| Monthly posts | 24 hours (`86400000`) |

## Security Considerations

### Content Privacy
- ⚠️ All mirrored content is PUBLIC on IPFS
- Don't mirror private/draft WordPress content
- Ensure WordPress is configured to only serve public content

### Access Control
- Publisher-agent API has no authentication
- Run behind firewall or use network policies
- Consider adding authentication for production use

### Data Integrity
- Content is stored immutably on IPFS
- Each mirror creates a new CID
- Previous versions remain accessible via their CIDs

## Future Enhancements

Potential improvements for future versions:

1. **Selective Mirroring**: Only mirror changed content
2. **Compression**: Compress content before IPFS upload
3. **Encryption**: Encrypt sensitive content
4. **CDN Integration**: Automatic CDN distribution
5. **Metrics**: Track mirror success rates and timing
6. **Notifications**: Alert on mirror failures
7. **Version History**: Track CID history
8. **Differential Sync**: Only upload changed files

## References

- [IPFS Documentation](https://docs.ipfs.tech/)
- [wget Manual](https://www.gnu.org/software/wget/manual/)
- [WordPress Export](https://wordpress.org/support/article/tools-export-screen/)
- [IPFS HTTP API](https://docs.ipfs.tech/reference/kubo/rpc/)
