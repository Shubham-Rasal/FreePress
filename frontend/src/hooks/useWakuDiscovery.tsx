import { useState, useEffect, useRef } from 'react';
import { createLightNode, ReliableChannel, HealthStatus } from "@waku/sdk";
import protobuf from 'protobufjs';

// Define the content topic and channel name
const CONTENT_TOPIC = "/freepress/1/discovery/proto";
const CHANNEL_NAME = "freepress-discovery";

// Create Protobuf message structure for manifest announcements
const ManifestMessage = new protobuf.Type("ManifestMessage")
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

// Generate a random sender ID for this instance
const generateSenderId = () => {
  return `sender-${Math.random().toString(36).substring(2, 15)}`;
};

export function useWakuDiscovery(enableSimulation = false) {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('disconnected');
  
  const simulationCountRef = useRef(0);
  const reliableChannelRef = useRef<any>(null); // ReliableChannel type
  const nodeRef = useRef<any>(null);
  const senderIdRef = useRef(generateSenderId());

  // Initialize Waku ReliableChannel
  useEffect(() => {
    if (enableSimulation) {
      setIsLoading(false);
      return;
    }

    let channel: any = null; // ReliableChannel
    let wakuNode: any = null;

    const initWaku = async () => {
      try {
        console.log('🚀 Initializing Waku Light Node...');
        
        // Create a Light Node
        wakuNode = await createLightNode({ 
          defaultBootstrap: true,
          libp2p: {
            filterMultiaddrs: false,
          },
        });
        nodeRef.current = wakuNode;

        // Listen for health status
        wakuNode.events.addEventListener('waku:health', (event: any) => {
          const health = event.detail;
          
          if (health === HealthStatus.SufficientlyHealthy) {
            setHealthStatus('healthy');
            console.log('🌐 Waku: Connected and healthy');
          } else if (health === HealthStatus.MinimallyHealthy) {
            setHealthStatus('minimal');
            console.log('⚠️ Waku: Connected but may have issues');
          } else {
            setHealthStatus('unhealthy');
            console.log('❌ Waku: Disconnected or unhealthy');
          }
        });

        // Create encoder and decoder
        const encoder = wakuNode.createEncoder({ contentTopic: CONTENT_TOPIC });
        const decoder = wakuNode.createDecoder({ contentTopic: CONTENT_TOPIC });

        // Create reliable channel
        console.log('📡 Creating Reliable Channel...');
        channel = await ReliableChannel.create(
          wakuNode,
          CHANNEL_NAME,
          senderIdRef.current,
          encoder,
          decoder
        );
        reliableChannelRef.current = channel;

        // Listen for incoming messages
        channel.addEventListener('message-received', (event: any) => {
          const wakuMessage = event.detail;
          
          try {
            const decoded: any = ManifestMessage.decode(wakuMessage.payload);
            const manifest: Manifest = {
              cid: decoded.manifest_cid || '',
              site_cid: decoded.site_cid || '',
              pubkey: decoded.pubkey || '',
              signature: decoded.signature || '',
              timestamp: Number(decoded.timestamp) || Date.now(),
              title: decoded.title || 'Untitled Publication',
              description: decoded.description || '',
              tags: decoded.tags ? decoded.tags.split(',').filter(Boolean) : [],
              onion_url: decoded.onion_url || undefined,
              mirror_count: decoded.mirror_count || 0,
            };

            console.log('📨 Received manifest via Waku:', manifest.title);

            // Add to manifests (with deduplication)
            setManifests(prev => {
              const exists = prev.find(m => m.cid === manifest.cid);
              if (exists) return prev;
              return [...prev, manifest];
            });
          } catch (err) {
            console.error('Failed to decode Waku message:', err);
          }
        });

        setIsLoading(false);
        setError(null);
        console.log('✅ Waku ReliableChannel ready!');
      } catch (err: any) {
        console.error('❌ Failed to initialize Waku:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    initWaku();

    return () => {
      if (channel) {
        console.log('🔌 Closing Waku channel...');
        // Cleanup if needed
      }
      if (wakuNode) {
        wakuNode.stop?.();
      }
    };
  }, [enableSimulation]);


  // Function to simulate/publish a message
  const simulatePublish = async () => {
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

    // Create a manifest
    const manifest: Manifest = {
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

    if (enableSimulation) {
      // Simulation mode: Add directly to local state
      setManifests(prev => {
        const exists = prev.find(m => m.cid === manifest.cid);
        if (exists) return prev;
        return [...prev, manifest];
      });
      console.log(`✓ Simulated manifest #${count} created:`, manifest.title);
    } else {
      // Real Waku mode: Publish via ReliableChannel
      try {
        await publishManifest(manifest);
        console.log(`📢 Publishing manifest #${count} via Waku:`, manifest.title);
      } catch (err) {
        console.error('Failed to publish manifest:', err);
      }
    }
  };

  // Function to publish a manifest announcement via Waku
  const publishManifest = async (manifest: Omit<Manifest, 'timestamp'>) => {
    const channel = reliableChannelRef.current;
    
    if (!channel) {
      throw new Error('Waku ReliableChannel not ready');
    }

    const timestamp = Date.now();
    
    // Create a new message object
    const protoMessage = ManifestMessage.create({
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

    // Serialise the message using Protobuf
    const serialisedMessage = ManifestMessage.encode(protoMessage).finish();

    // Send the message, and get the id to track events
    const messageId = channel.send(serialisedMessage);

    // Track when message has encountered an error
    channel.addEventListener('sending-message-irrecoverable-error', (event: any) => {
      if (messageId === event.detail.messageId) {
        console.error('❌ Failed to send message:', event.detail.error);
        // Show an error to the user
      }
    });

    // Track when message has been sent
    channel.addEventListener('message-sent', (event: any) => {
      if (messageId === event.detail) {
        // Message sent, show '✔' to the user
        console.log('✓ Message sent via Waku');
      }
    });

    // Track when message has been acknowledged by other participants
    channel.addEventListener('message-acknowledged', (event: any) => {
      if (messageId === event.detail) {
        // Message acknowledged by other participants, show '✔✔' to the user
        console.log('✓✓ Message acknowledged by peers');
      }
    });

    return { messageId, timestamp };
  };

  return {
    manifests,
    isLoading,
    error,
    publishManifest,
    simulatePublish,
    nodeStatus: enableSimulation ? 'simulation' : healthStatus,
  };
}

