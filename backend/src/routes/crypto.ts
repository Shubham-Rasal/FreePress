import { Hono } from 'hono';
import { generateKeyPairSync, sign } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const crypto = new Hono();

// Store keypairs (in production, use secure storage like a database or secrets manager)
const KEYS_DIR = '/app/keys';
let currentKeypair: {
  publicKey: string;
  privateKey: string;
} | null = null;

// Ensure keys directory exists
async function ensureKeysDirectory() {
  try {
    await fs.access(KEYS_DIR);
  } catch {
    await fs.mkdir(KEYS_DIR, { recursive: true, mode: 0o700 });
  }
}

// Load existing keypair if available
async function loadKeypair(): Promise<boolean> {
  try {
    await ensureKeysDirectory();
    const publicKeyPath = path.join(KEYS_DIR, 'public.pem');
    const privateKeyPath = path.join(KEYS_DIR, 'private.pem');
    
    const publicKey = await fs.readFile(publicKeyPath, 'utf-8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf-8');
    
    currentKeypair = { publicKey, privateKey };
    return true;
  } catch {
    return false;
  }
}

// Save keypair to disk
async function saveKeypair(publicKey: string, privateKey: string) {
  await ensureKeysDirectory();
  const publicKeyPath = path.join(KEYS_DIR, 'public.pem');
  const privateKeyPath = path.join(KEYS_DIR, 'private.pem');
  
  await fs.writeFile(publicKeyPath, publicKey, { mode: 0o644 });
  await fs.writeFile(privateKeyPath, privateKey, { mode: 0o600 });
}

// Helper: Get onion URL from onionize service
async function getOnionUrl(): Promise<string> {
  const hostnameFile = '/var/lib/tor/onion_services/wordpress/hostname';
  
  try {
    const hostname = await fs.readFile(hostnameFile, 'utf-8');
    return `http://${hostname.trim()}`;
  } catch (err: any) {
    console.error('Failed to read onion hostname:', err);
    // Return placeholder if onion URL is not available
    return 'http://example.onion';
  }
}

// Initialize - load existing keypair
loadKeypair();

// Generate Ed25519 keypair
crypto.post('/generate-keypair', async (c) => {
  try {
    // Generate Ed25519 keypair
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Store the keypair
    currentKeypair = {
      publicKey,
      privateKey
    };

    // Save to disk for persistence
    await saveKeypair(publicKey, privateKey);

    // Return public key as hex for display
    const publicKeyHex = Buffer.from(publicKey).toString('hex');

    return c.json({
      success: true,
      publicKey: publicKeyHex,
      publicKeyPem: publicKey,
      message: 'Keypair generated successfully'
    });
  } catch (err: any) {
    console.error('Failed to generate keypair:', err);
    return c.json({
      error: 'Failed to generate keypair',
      message: err.message
    }, 500);
  }
});

// Get current public key
crypto.get('/public-key', async (c) => {
  if (!currentKeypair) {
    // Try to load from disk
    const loaded = await loadKeypair();
    if (!loaded) {
      return c.json({
        error: 'No keypair found',
        message: 'Please generate a keypair first'
      }, 404);
    }
  }

  const publicKeyHex = Buffer.from(currentKeypair!.publicKey).toString('hex');

  return c.json({
    success: true,
    publicKey: publicKeyHex,
    publicKeyPem: currentKeypair!.publicKey
  });
});

// Sign manifest
crypto.post('/sign-manifest', async (c) => {
  try {
    const body = await c.req.json();
    const { site_cid } = body;

    if (!site_cid) {
      return c.json({
        error: 'Missing site_cid',
        message: 'site_cid is required'
      }, 400);
    }

    if (!currentKeypair) {
      // Try to load from disk
      const loaded = await loadKeypair();
      if (!loaded) {
        return c.json({
          error: 'No keypair found',
          message: 'Please generate a keypair first'
        }, 404);
      }
    }

    // Create manifest
    const manifest = {
      version: '1.0',
      site_cid,
      timestamp: Date.now(),
      publisher: Buffer.from(currentKeypair!.publicKey).toString('hex')
    };

    const manifestJson = JSON.stringify(manifest, null, 2);

    // Sign the manifest
    const signature = sign(
      null,
      Buffer.from(manifestJson),
      {
        key: currentKeypair!.privateKey,
        format: 'pem'
      }
    );

    const signatureHex = signature.toString('hex');

    // Create signed manifest
    const signedManifest = {
      ...manifest,
      signature: signatureHex
    };

    const signedManifestJson = JSON.stringify(signedManifest, null, 2);

    // TODO: Add signed manifest to IPFS
    // For now, we'll just return a mock CID
    const manifestCid = `Qm${Buffer.from(signedManifestJson).toString('hex').substring(0, 44)}`;

    // Get actual onion URL from onionize service
    const onionUrl = await getOnionUrl();

    return c.json({
      success: true,
      manifest,
      signature: signatureHex,
      manifest_cid: manifestCid,
      onion_url: onionUrl,
      message: 'Manifest signed successfully'
    });
  } catch (err: any) {
    console.error('Failed to sign manifest:', err);
    return c.json({
      error: 'Failed to sign manifest',
      message: err.message
    }, 500);
  }
});

// Verify signature (for testing/debugging)
crypto.post('/verify-signature', async (c) => {
  try {
    const body = await c.req.json();
    const { manifest, signature } = body;

    if (!manifest || !signature) {
      return c.json({
        error: 'Missing manifest or signature',
        message: 'Both manifest and signature are required'
      }, 400);
    }

    if (!currentKeypair) {
      const loaded = await loadKeypair();
      if (!loaded) {
        return c.json({
          error: 'No keypair found',
          message: 'Please generate a keypair first'
        }, 404);
      }
    }

    const { verify } = await import('crypto');
    
    const isValid = verify(
      null,
      Buffer.from(JSON.stringify(manifest)),
      {
        key: currentKeypair!.publicKey,
        format: 'pem'
      },
      Buffer.from(signature, 'hex')
    );

    return c.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Signature is valid' : 'Signature is invalid'
    });
  } catch (err: any) {
    console.error('Failed to verify signature:', err);
    return c.json({
      error: 'Failed to verify signature',
      message: err.message
    }, 500);
  }
});

export default crypto;

