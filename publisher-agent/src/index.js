const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;
const IPFS_HOST = process.env.IPFS_HOST || 'ipfs';
const IPFS_PORT = process.env.IPFS_PORT || '5001';
const WORDPRESS_HOST = process.env.WORDPRESS_HOST || 'wordpress';
const WORDPRESS_PORT = process.env.WORDPRESS_PORT || '80';
const MIRROR_INTERVAL = parseInt(process.env.MIRROR_INTERVAL || '3600000'); // Default: 1 hour
const EXPORT_DIR = '/tmp/wordpress-export';

app.use(express.json());

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║        FreePress Publisher Agent                       ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log('🚀 Publisher Agent initialized');
console.log('📦 IPFS Host:', `${IPFS_HOST}:${IPFS_PORT}`);
console.log('🌐 WordPress Host:', `${WORDPRESS_HOST}:${WORDPRESS_PORT}`);
console.log('⏰ Mirror Interval:', `${MIRROR_INTERVAL}ms (${MIRROR_INTERVAL / 1000 / 60} minutes)`);
console.log('');

/**
 * Export WordPress site using wget --mirror
 * This preserves the multi-page structure and paths
 */
async function exportWordPressSite() {
  try {
    console.log('📥 Starting WordPress export...');
    
    // Ensure export directory exists
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    // Clean previous export
    await execAsync(`rm -rf ${EXPORT_DIR}/*`);
    
    // Use wget to mirror the WordPress site
    // Options:
    // -m: mirror (recursive with infinite depth and timestamping)
    // -p: download all files necessary to display HTML pages
    // -k: convert links for local viewing
    // -P: directory prefix
    // -E: adjust extension of HTML files to .html
    // -np: no parent - don't ascend to parent directory
    // --restrict-file-names=windows: sanitize filenames
    const wgetCommand = `wget --mirror --page-requisites --adjust-extension --convert-links --no-parent --restrict-file-names=windows -P ${EXPORT_DIR} http://${WORDPRESS_HOST}:${WORDPRESS_PORT}/`;
    
    console.log('🔧 Running wget command...');
    const { stdout, stderr } = await execAsync(wgetCommand, { maxBuffer: 10 * 1024 * 1024 });
    
    if (stderr && !stderr.includes('saved')) {
      console.warn('⚠️ wget stderr:', stderr);
    }
    
    console.log('✅ WordPress export completed');
    return path.join(EXPORT_DIR, WORDPRESS_HOST);
  } catch (error) {
    console.error('❌ Error exporting WordPress site:', error.message);
    throw error;
  }
}

/**
 * Upload directory to IPFS preserving structure
 */
async function uploadToIPFS(dirPath) {
  try {
    console.log('📤 Uploading to IPFS...');
    
    // Check if directory exists
    try {
      await fs.access(dirPath);
    } catch {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    
    // Use IPFS HTTP API to add directory recursively
    const ipfsUrl = `http://${IPFS_HOST}:${IPFS_PORT}/api/v0/add`;
    
    // Build form data with all files
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Recursively add files
    async function addFiles(dir, basePath = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          await addFiles(fullPath, relativePath);
        } else {
          const fileContent = await fs.readFile(fullPath);
          formData.append('file', fileContent, {
            filepath: relativePath,
            filename: relativePath
          });
        }
      }
    }
    
    await addFiles(dirPath);
    
    // Upload to IPFS with wrap-with-directory to preserve structure
    const response = await axios.post(
      `${ipfsUrl}?wrap-with-directory=true&recursive=true`,
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    
    // Parse IPFS response (newline-delimited JSON)
    const lines = response.data.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const result = JSON.parse(lastLine);
    
    console.log('✅ Uploaded to IPFS:', result.Hash);
    console.log('🔗 IPFS Gateway URL:', `http://${IPFS_HOST}:8080/ipfs/${result.Hash}`);
    
    return {
      cid: result.Hash,
      name: result.Name,
      size: result.Size
    };
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error.message);
    throw error;
  }
}

/**
 * Pin content to IPFS to ensure it's retained
 */
async function pinToIPFS(cid) {
  try {
    console.log('📌 Pinning to IPFS:', cid);
    
    const pinUrl = `http://${IPFS_HOST}:${IPFS_PORT}/api/v0/pin/add?arg=${cid}`;
    await axios.post(pinUrl);
    
    console.log('✅ Pinned to IPFS');
  } catch (error) {
    console.error('❌ Error pinning to IPFS:', error.message);
    // Don't throw - pinning failure shouldn't stop the process
  }
}

/**
 * Main mirror function - export and upload to IPFS
 */
async function mirrorWordPress() {
  const startTime = Date.now();
  console.log('\n🔄 Starting WordPress mirroring cycle...');
  console.log('🕐 Started at:', new Date().toISOString());
  
  try {
    // Export WordPress site
    const exportPath = await exportWordPressSite();
    
    // Upload to IPFS
    const ipfsResult = await uploadToIPFS(exportPath);
    
    // Pin to IPFS
    await pinToIPFS(ipfsResult.cid);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('✅ Mirror cycle completed successfully');
    console.log('⏱️  Duration:', duration, 'seconds');
    console.log('📦 Site CID:', ipfsResult.cid);
    console.log('');
    
    return ipfsResult;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ Mirror cycle failed after', duration, 'seconds');
    console.error('Error:', error.message);
    console.log('');
    throw error;
  }
}

// API endpoint to trigger manual mirroring
app.post('/api/mirror', async (req, res) => {
  try {
    const result = await mirrorWordPress();
    res.json({
      success: true,
      cid: result.cid,
      size: result.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'publisher-agent',
    ipfsHost: `${IPFS_HOST}:${IPFS_PORT}`,
    wordpressHost: `${WORDPRESS_HOST}:${WORDPRESS_PORT}`,
    mirrorInterval: MIRROR_INTERVAL
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🌐 API server listening on port ${PORT}`);
  console.log('');
});

// Start periodic mirroring
let isFirstRun = true;
setInterval(async () => {
  try {
    await mirrorWordPress();
  } catch (error) {
    // Error already logged in mirrorWordPress
  }
}, MIRROR_INTERVAL);

// Run first mirror after a short delay to allow services to start
console.log('⏳ First mirror will run in 30 seconds...');
setTimeout(async () => {
  try {
    await mirrorWordPress();
  } catch (error) {
    console.error('First mirror attempt failed, will retry on next interval');
  }
}, 30000);

