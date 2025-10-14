import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

const mirror = new Hono();

interface MirrorJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  error?: string;
  outputPath?: string;
  size?: number;
}

interface MirroredSite {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  size: number;
  fileCount?: number;
  ipfsCid?: string;
  isPinned?: boolean;
}

// In-memory job tracking (in production, use a database)
const jobs = new Map<string, MirrorJob>();
const mirrors = new Map<string, MirroredSite>();

// Trigger a new WordPress mirror
mirror.post('/start', async (c) => {
  const jobId = `mirror-${Date.now()}`;
  
  const job: MirrorJob = {
    id: jobId,
    status: 'pending',
    startedAt: Date.now()
  };
  
  jobs.set(jobId, job);

  // Start the mirror process asynchronously
  startMirrorProcess(jobId).catch(err => {
    console.error('Mirror process failed:', err);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err.message;
      job.completedAt = Date.now();
    }
  });

  return c.json({
    success: true,
    jobId,
    message: 'Mirror job started'
  });
});

// Get job status
mirror.get('/status/:jobId', (c) => {
  const jobId = c.req.param('jobId');
  const job = jobs.get(jobId);

  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }

  return c.json(job);
});

// List all mirror jobs
mirror.get('/jobs', (c) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => b.startedAt - a.startedAt);
  return c.json({ jobs: allJobs });
});

// List all mirrored sites
mirror.get('/sites', async (c) => {
  try {
    // Scan the static_site directory for mirrored sites
    const staticSiteDir = '/tmp/static_site';
    await scanMirroredSites(staticSiteDir);
    
    const allSites = Array.from(mirrors.values()).sort((a, b) => b.createdAt - a.createdAt);
    return c.json({ sites: allSites });
  } catch (err: any) {
    console.error('Failed to list sites:', err);
    return c.json({ 
      error: 'Failed to list mirrored sites',
      message: err.message 
    }, 500);
  }
});

// Publish a mirrored site to IPFS
mirror.post('/publish/:siteId', async (c) => {
  const siteId = c.req.param('siteId');
  const site = mirrors.get(siteId);

  if (!site) {
    return c.json({ error: 'Site not found' }, 404);
  }

  try {
    // Add the site directory to IPFS
    const ipfsApiUrl = process.env.IPFS_API_URL || 'http://localhost:5001';

    // Use IPFS API to add the directory
    const { stdout } = await execAsync(`find ${site.path} -type f`);
    const files = stdout.trim().split('\n').filter(f => f);

    if (files.length === 0) {
      return c.json({ error: 'No files found in site directory' }, 400);
    }

    console.log('Adding directory to IPFS:', site.path);
    // For simplicity, we'll add the entire directory
    // In a real implementation, you'd use the IPFS HTTP API multipart upload
    const addResponse = await addDirectoryToIPFS(site.path, ipfsApiUrl);
    
    // Update the site with IPFS CID
    site.ipfsCid = addResponse.cid;
    site.isPinned = true;
    mirrors.set(siteId, site);

    return c.json({
      success: true,
      cid: addResponse.cid,
      message: 'Site published to IPFS'
    });
  } catch (err: any) {
    console.error('Failed to publish to IPFS:', err);
    return c.json({ 
      error: 'Failed to publish to IPFS',
      message: err.message 
    }, 500);
  }
});

// Delete a mirrored site
mirror.delete('/sites/:siteId', async (c) => {
  const siteId = c.req.param('siteId');
  const site = mirrors.get(siteId);

  if (!site) {
    return c.json({ error: 'Site not found' }, 404);
  }

  try {
    // Remove from filesystem
    await fs.rm(site.path, { recursive: true, force: true });
    
    // Remove from tracking
    mirrors.delete(siteId);

    return c.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (err: any) {
    console.error('Failed to delete site:', err);
    return c.json({ 
      error: 'Failed to delete site',
      message: err.message 
    }, 500);
  }
});

// Helper: Start the mirror process
async function startMirrorProcess(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';

  try {
    const staticSiteDir = '/tmp/static_site';
    const outputDir = `${staticSiteDir}/wordpress`;
    
    // Ensure static site directory exists with proper error handling
    try {
      await fs.access(staticSiteDir);
    } catch {
      // Directory doesn't exist, try to create it
      await fs.mkdir(staticSiteDir, { recursive: true, mode: 0o777 });
    }
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true, mode: 0o777 });
    
    // Wait for WordPress to be ready
    console.log('Checking if WordPress is ready...');
    await waitForWordPress('http://localhost:80/', 30);
    
    console.log('WordPress is ready, starting mirror...');
    
    // Run wget to mirror the WordPress site
    // Using wget directly to create a static mirror
    const wgetCommand = `wget --mirror --convert-links --adjust-extension --page-requisites --no-parent --directory-prefix=${outputDir} http://localhost:80/`;
    
    const { stdout, stderr } = await execAsync(wgetCommand, {
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large sites
    });

    console.log('Mirror stdout:', stdout);
    if (stderr) console.log('Mirror stderr:', stderr);

    // After successful mirror, scan for the new site
    await scanMirroredSites(staticSiteDir);

    job.status = 'completed';
    job.completedAt = Date.now();
    job.outputPath = outputDir;
  } catch (err: any) {
    console.error('Mirror command failed:', err);
    job.status = 'failed';
    job.error = err.message;
    job.completedAt = Date.now();
    throw err;
  }
}

// Helper: Wait for WordPress to be ready
async function waitForWordPress(url: string, maxRetries: number = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url, { timeout: 5000 });
      return; // WordPress is ready
    } catch (err) {
      console.log(`WordPress not ready yet, attempt ${i + 1}/${maxRetries}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }
  }
  throw new Error('WordPress did not become ready in time');
}

// Helper: Scan the static site directory for mirrored sites
async function scanMirroredSites(baseDir: string) {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sitePath = path.join(baseDir, entry.name);
        const stats = await fs.stat(sitePath);
        
        // Count files in the directory
        const fileCount = await countFiles(sitePath);
        
        // Calculate total size
        const size = await getDirectorySize(sitePath);
        
        const siteId = `site-${entry.name}-${stats.birthtimeMs}`;
        
        if (!mirrors.has(siteId)) {
          const site: MirroredSite = {
            id: siteId,
            name: entry.name,
            path: sitePath,
            createdAt: stats.birthtimeMs,
            size,
            fileCount
          };
          
          mirrors.set(siteId, site);
        }
      }
    }
  } catch (err: any) {
    // Directory might not exist yet
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

// Helper: Count files in a directory
async function countFiles(dir: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`find ${dir} -type f | wc -l`);
    return parseInt(stdout.trim(), 10);
  } catch {
    return 0;
  }
}

// Helper: Get directory size
async function getDirectorySize(dir: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`du -sb ${dir}`);
    const size = parseInt(stdout.split('\t')[0], 10);
    return size;
  } catch {
    return 0;
  }
}

async function addDirectoryToIPFS(dirPath: string, ipfsApiUrl: string): Promise<{ cid: string }> {
    try {
        // POST /api/v0/add?recursive=true&to-files=/site2
        const addUrl = `${ipfsApiUrl}/api/v0/add?recursive=true&quieter=true&pin=true&to-files=${encodeURIComponent(
          '/site2'
        )}&arg=${encodeURIComponent('/site')}`;

        console.log('Adding directory to IPFS:', addUrl);
    
        const response = await axios.post(addUrl);
    
        // Response is newline-delimited JSON, last line is root CID
        const lines = response.data.trim().split("\n");
        const lastLine = JSON.parse(lines[lines.length - 1]);
        const cid = lastLine.Hash;
    
        return { cid };
      } catch (err: any) {
        console.error("Failed to add directory to IPFS:", err.message);
        throw new Error(`Failed to add to IPFS: ${err.message}`);
      }
  }     

export default mirror;

