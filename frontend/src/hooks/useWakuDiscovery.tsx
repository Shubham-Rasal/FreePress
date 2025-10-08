import { useState, useEffect, useRef } from 'react';
import { useWaku, useLightPush, useFilterMessages, useStoreMessages } from "@waku/react";
import { createEncoder, createDecoder } from "@waku/sdk";
import protobuf from 'protobufjs';

// Define the content topic for discovery announcements
const DISCOVERY_CONTENT_TOPIC = "/freepress/1/discovery/proto";

// Create Protobuf message structure for manifest announcements
const ManifestAnnouncement = new protobuf.Type("ManifestAnnouncement")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("manifest_cid", 2, "string"))
  .add(new protobuf.Field("site_cid", 3, "string"))
  .add(new protobuf.Field("pubkey", 4, "string"))
  .add(new protobuf.Field("signature", 5, "string"))
  .add(new protobuf.Field("title", 6, "string"))
  .add(new protobuf.Field("description", 7, "string"))
  .add(new protobuf.Field("tags", 8, "string"))
  .add(new protobuf.Field("onion_url", 9, "string"))
  .add(new protobuf.Field("mirror_count", 10, "uint32"));

export interface Manifest {
  cid: string;
  pubkey: string;
  site_cid: string;
  onion_url?: string;
  tags?: string[];
  timestamp: number;
  signature: string;
  mirror_count?: number;
  title?: string;
  description?: string;
}

export function useWakuDiscovery(enableSimulation = false) {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const simulationCountRef = useRef(0);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [peerCount, setPeerCount] = useState(0);

  // Create and start a Light Node
  const { node, error: nodeError, isLoading } = useWaku();

  // Create encoder and decoder
  const encoder = createEncoder({ contentTopic: DISCOVERY_CONTENT_TOPIC });
  const decoder = createDecoder(DISCOVERY_CONTENT_TOPIC);

  // Bind push method to node and encoder
  const { push } = useLightPush({ node, encoder });

  // Receive messages from Filter subscription
  const { messages: filterMessages } = useFilterMessages({ node, decoder });

  // Query Store peers for past messages
  const { messages: storeMessages } = useStoreMessages({ node, decoder });

  // Process and decode Waku messages into Manifests
  useEffect(() => {
    const allMessages = storeMessages.concat(filterMessages);
    const decodedManifests: Manifest[] = [];

    allMessages.forEach((wakuMessage) => {
      if (!wakuMessage.payload) return;
      
      try {
        const decoded = ManifestAnnouncement.decode(wakuMessage.payload);
        const manifest: Manifest = {
          cid: decoded.manifest_cid as string,
          site_cid: decoded.site_cid as string,
          pubkey: decoded.pubkey as string,
          signature: decoded.signature as string,
          timestamp: Number(decoded.timestamp),
          title: decoded.title as string || 'Untitled Publication',
          description: decoded.description as string || '',
          tags: decoded.tags ? (decoded.tags as string).split(',').filter(Boolean) : [],
          onion_url: decoded.onion_url as string || undefined,
          mirror_count: decoded.mirror_count as number || 0,
        };
        decodedManifests.push(manifest);
      } catch (err) {
        console.error('Failed to decode message:', err);
      }
    });

    // Remove duplicates based on manifest CID
    const uniqueManifests = decodedManifests.reduce((acc, manifest) => {
      if (!acc.find(m => m.cid === manifest.cid)) {
        acc.push(manifest);
      }
      return acc;
    }, [] as Manifest[]);

    setManifests(uniqueManifests);
  }, [filterMessages, storeMessages]);

  // Monitor Waku node connection and peers
  useEffect(() => {
    if (!node) return;

    const checkPeers = async () => {
      try {
        const connections = await node.libp2p.peerStore.all();
        const count = connections.length;
        setPeerCount(count);
        
        if (count > 0) {
          console.log(`🌐 Waku: Connected to ${count} peer(s)`);
        } else {
          console.log('⚠️ Waku: No peers connected yet, trying to discover...');
        }
      } catch (err) {
        console.error('Failed to check peers:', err);
      }
    };

    // Check immediately
    checkPeers();

    // Check every 10 seconds
    const interval = setInterval(checkPeers, 10000);

    return () => clearInterval(interval);
  }, [node]);

  // Set up BroadcastChannel for cross-tab communication
  useEffect(() => {
    if (!enableSimulation) return;

    // Create a broadcast channel for manifest announcements
    const channel = new BroadcastChannel('freepress-discovery');
    broadcastChannelRef.current = channel;

    // Listen for messages from other tabs/instances
    channel.onmessage = (event) => {
      const receivedManifest = event.data as Manifest;
      console.log('📡 Received manifest from another tab:', receivedManifest.title);
      
      // Add the received manifest to our local state
      setManifests(prev => {
        // Check if this manifest already exists
        const exists = prev.find(m => m.cid === receivedManifest.cid);
        if (exists) return prev;
        return [...prev, receivedManifest];
      });
    };

    return () => {
      channel.close();
    };
  }, [enableSimulation]);

  // Function to simulate a message (for testing)
  const simulatePublish = () => {
    if (!enableSimulation) {
      console.warn('Simulation is not enabled');
      return;
    }

    const timestamp = Date.now();
    simulationCountRef.current += 1;
    const count = simulationCountRef.current;

    const sampleTitles = [
      'Breaking News: Censorship Resistance Works',
      'Guide to Self-Sovereign Publishing',
      'Why Decentralization Matters',
      'IPFS Best Practices for Publishers',
      'Building Resilient Content Networks',
    ];

    const sampleDescriptions = [
      'An in-depth look at how decentralized publishing can resist censorship attempts.',
      'A comprehensive guide for publishers who want to take control of their content.',
      'Exploring the benefits and challenges of decentralized systems.',
      'Learn how to optimize your content for IPFS and ensure long-term availability.',
      'Technical insights into building content networks that survive node failures.',
    ];

    const sampleTags = [
      ['news', 'censorship', 'freedom'],
      ['guide', 'tutorial', 'publishing'],
      ['decentralization', 'web3', 'freedom'],
      ['ipfs', 'technical', 'guide'],
      ['networking', 'resilience', 'technical'],
    ];

    const randomIndex = (count - 1) % 5;

    // Create a simulated manifest directly without using Waku push
    // This avoids the need for Waku node to be ready for demo purposes
    const simulatedManifest: Manifest = {
      cid: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      site_cid: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      pubkey: Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      signature: Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: timestamp,
      title: sampleTitles[randomIndex],
      description: sampleDescriptions[randomIndex],
      tags: sampleTags[randomIndex],
      onion_url: `http://${Math.random().toString(36).substring(2, 18)}.onion`,
      mirror_count: Math.floor(Math.random() * 10),
    };

    // Add simulated manifest directly to the list
    setManifests(prev => {
      // Check if this manifest already exists
      const exists = prev.find(m => m.cid === simulatedManifest.cid);
      if (exists) return prev;
      return [...prev, simulatedManifest];
    });

    // Broadcast to other tabs/instances
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(simulatedManifest);
      console.log(`✓ Simulated manifest #${count} created & broadcast:`, simulatedManifest.title);
    } else {
      console.log(`✓ Simulated manifest #${count} created:`, simulatedManifest.title);
    }
  };

  // Function to publish a manifest announcement
  const publishManifest = async (manifest: Omit<Manifest, 'timestamp'>) => {
    if (!push) {
      throw new Error('Waku node not ready');
    }

    const timestamp = Date.now();
    const protoMessage = ManifestAnnouncement.create({
      timestamp: timestamp,
      manifest_cid: manifest.cid,
      site_cid: manifest.site_cid,
      pubkey: manifest.pubkey,
      signature: manifest.signature,
      title: manifest.title || '',
      description: manifest.description || '',
      tags: manifest.tags ? manifest.tags.join(',') : '',
      onion_url: manifest.onion_url || '',
      mirror_count: manifest.mirror_count || 0,
    });

    const payload = ManifestAnnouncement.encode(protoMessage).finish();
    const { recipients, errors } = await push({ payload, timestamp });

    if (errors.length > 0) {
      throw new Error(`Failed to publish manifest: ${errors.join(', ')}`);
    }

    console.log('✓ Manifest announced to', recipients.length, 'peers');
    return { recipients, timestamp };
  };

  return {
    manifests,
    isLoading,
    error: nodeError,
    publishManifest,
    simulatePublish,
    nodeStatus: node ? (peerCount > 0 ? `connected (${peerCount} peers)` : 'no peers') : 'disconnected',
    peerCount,
  };
}

