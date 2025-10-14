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

// Get onion URL
mirror.get('/onion-url', async (c) => {
  try {
    const onionUrl = await getOnionUrl();
    return c.json({ 
      success: true,
      onionUrl: `http://${onionUrl}`
    });
  } catch (err: any) {
    console.error('Failed to get onion URL:', err);
    return c.json({ 
      error: 'Failed to get onion URL',
      message: err.message 
    }, 500);
  }
});

// List all mirrored sites
mirror.get('/sites', async (c) => {
  try {
    // Scan the static_site directory for mirrored sites
    const staticSiteDir = '/static_site';
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
    const staticSiteDir = '/static_site';
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
    
    // Get the onion URL
    const onionUrl = await getOnionUrl();
    console.log('Using onion URL:', onionUrl);
    
    // Start Tor service
    console.log('Starting Tor service...');
    try {
      execAsync('tor &').catch(() => {}); // Start tor in background, ignore errors if already running
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for Tor to start
    } catch (torErr) {
      console.log('Tor may already be running, continuing...');
    }
    
    // Wait for WordPress to be ready via localhost (for health check)
    console.log('Checking if WordPress is ready...');
    await waitForWordPress('http://localhost:80/', 30);
    
    console.log('WordPress is ready, starting mirror via Tor...');
    
    // Run wget through Tor to mirror the WordPress site via .onion URL
    // Using torsocks to route through Tor
    const wgetCommand = `torsocks wget --mirror --convert-links --adjust-extension --page-requisites --no-parent --directory-prefix=${outputDir} http://${onionUrl}/`;
    
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

// Helper: Get onion URL from onionize service
async function getOnionUrl(): Promise<string> {
  const hostnameFile = '/var/lib/tor/onion_services/wordpress/hostname';
  
  try {
    const hostname = await fs.readFile(hostnameFile, 'utf-8');
    return hostname.trim();
  } catch (err: any) {
    console.error('Failed to read onion hostname:', err);
    throw new Error('Could not read onion hostname. Make sure onionize service is running.');
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


export default mirror;

