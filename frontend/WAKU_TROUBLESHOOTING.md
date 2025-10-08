# Waku Network Troubleshooting Guide

## 🎯 Understanding the Two Modes

FreePress frontend can run in **two different modes**:

### 1. Simulation Mode (Current Default) ✅
- **Purpose**: Demo and testing without real network
- **How it works**: Creates fake manifests locally
- **Cross-tab**: Uses BroadcastChannel API
- **Network required**: No
- **Perfect for**: Development, demos, testing UI

### 2. Real Waku Mode 🌐
- **Purpose**: Connect to actual Waku network
- **How it works**: Light node connects to Waku peers
- **Cross-tab**: Real pubsub network propagation
- **Network required**: Yes (internet connection)
- **Perfect for**: Production, real discovery

## 🔍 Current Status

Check your browser console for these messages:

### Simulation Mode Working ✅
```
✓ Simulated manifest #1 created & broadcast: [Title]
📡 Received manifest from another tab: [Title]
```

### Waku Node Status
```
🌐 Waku: Connected to 5 peer(s)           ← Good! 
⚠️ Waku: No peers connected yet...        ← Expected in simulation mode
```

## 🚨 Common Issues

### Issue 1: "No peers connected"

**What it means:**
- Waku light node started but hasn't found peers yet
- In **simulation mode**, this is normal and doesn't affect functionality

**When this matters:**
- Only matters when using real Waku (not simulation)
- Simulation works fine without peers

**How to check if it's a problem:**
Check the status indicator on the page:
- `Waku: connected (5 peers)` ← Working!
- `Waku: no peers` ← Simulation still works
- `Waku: disconnected` ← Node didn't start

**Solutions:**

#### A. You're using simulation mode (default)
✅ **No action needed!** Simulation doesn't require Waku peers.
- Your "Simulate Publish" button works
- Cross-tab sync works
- This is the intended behavior

#### B. You want real Waku network
You need to configure bootstrap peers. See "Enabling Real Waku Network" below.

### Issue 2: Linter Errors

**Error:** `Property 'routingInfo' is missing in type...`

**Explanation:**
- These are TypeScript type mismatches with Waku SDK
- They're in code paths only used for real Waku mode
- Simulation mode bypasses these code paths
- **Not a blocker** for current demo functionality

**Solutions:**
1. **Keep using simulation** - errors don't affect it
2. **To fix for real Waku** - update Waku SDK imports (see below)

### Issue 3: Cross-tab not working

**Symptoms:**
- Click "Simulate Publish" in Tab 1
- Nothing appears in Tab 2

**Debug steps:**
1. Open DevTools (F12) in both tabs
2. Check console for errors
3. Verify both tabs are on same origin (localhost:3000)
4. Hard refresh both tabs (Ctrl+Shift+R)

**Common causes:**
- Browser doesn't support BroadcastChannel (very rare)
- Tabs on different origins (one localhost, one 127.0.0.1)
- Browser extensions blocking it

### Issue 4: "Waku: disconnected"

**Symptoms:**
- Node status shows "disconnected"
- Node never initializes

**Debug:**
1. Check browser console for initialization errors
2. Verify `main.jsx` has `LightNodeProvider`
3. Check network tab for WebSocket connections

**Solution:**
```javascript
// In main.jsx - verify this exists:
const NODE_OPTIONS = { 
  defaultBootstrap: true,
  libp2p: {
    filterMultiaddrs: false,
  },
};
```

## 🌐 Enabling Real Waku Network

If you want to use the actual Waku network instead of simulation:

### Step 1: Disable Simulation

In `LandingPage.tsx` and `ExploreTab.tsx`:
```typescript
// Change from:
const { manifests, ... } = useWakuDiscovery(true);

// To:
const { manifests, ... } = useWakuDiscovery(false);
```

### Step 2: Wait for Peer Discovery

After disabling simulation:
1. Refresh the page
2. Wait 10-30 seconds
3. Watch console: `🌐 Waku: Connected to X peer(s)`
4. Status should show: `Waku: connected (X peers)`

### Step 3: Verify Connection

Check console every 10 seconds for peer count updates:
```
🌐 Waku: Connected to 1 peer(s)
🌐 Waku: Connected to 3 peer(s)
🌐 Waku: Connected to 5 peer(s)
```

### Step 4: Test Real Publishing

Once peers are connected, you can use the real `publishManifest()` function.

**Note:** You'll need to integrate this with your backend's publish flow.

## 🔧 Advanced Configuration

### Custom Bootstrap Peers

If default bootstrap isn't working, specify peers manually:

```javascript
// main.jsx
const NODE_OPTIONS = {
  bootstrapPeers: [
    "/dns4/node-01.do-ams3.waku.test.statusim.net/tcp/8000/wss/p2p/16Uiu2HAm6HZZr7aToTvEBPpiys4UxajCTU97zj5v7RNR2gbniy1D",
    "/dns4/node-01.ac-cn-hongkong-c.waku.test.statusim.net/tcp/8000/wss/p2p/16Uiu2HAmFQCvz9Hw6Z8E5YrRRDtTW6CLHpxd5pqq9UUzCfZ5izL5",
  ],
  libp2p: {
    filterMultiaddrs: false,
  },
};
```

### Monitor Peer Discovery

Add this to see detailed connection logs:

```typescript
useEffect(() => {
  if (!node) return;
  
  node.libp2p.addEventListener('peer:discovery', (evt) => {
    console.log('🔍 Discovered peer:', evt.detail.id.toString());
  });
  
  node.libp2p.addEventListener('peer:connect', (evt) => {
    console.log('🤝 Connected to peer:', evt.detail.toString());
  });
  
  node.libp2p.addEventListener('peer:disconnect', (evt) => {
    console.log('👋 Peer disconnected:', evt.detail.toString());
  });
}, [node]);
```

### DNS Discovery (Advanced)

Install package:
```bash
pnpm add @waku/dns-discovery
```

Configure in main.jsx:
```javascript
import { wakuDnsDiscovery } from "@waku/dns-discovery";

const NODE_OPTIONS = {
  defaultBootstrap: false,  // Disable default
  libp2p: {
    peerDiscovery: [
      wakuDnsDiscovery(['waku.v2.prod']),
    ],
  },
};
```

## 📊 Diagnostic Checklist

Use this to debug issues:

### Check 1: Node Initialization
```javascript
console.log('Node:', node);  // Should be object, not undefined
```
- ✅ Object with properties
- ❌ `undefined` - not initialized

### Check 2: Peer Count
```javascript
console.log('Peers:', peerCount);
```
- ✅ Number > 0 (for real Waku)
- ✅ 0 (for simulation mode - expected)

### Check 3: Simulation Status
```javascript
console.log('Simulation enabled:', enableSimulation);
```
- ✅ `true` - using simulation
- ✅ `false` - using real Waku

### Check 4: BroadcastChannel
```javascript
console.log('Broadcast channel:', broadcastChannelRef.current);
```
- ✅ BroadcastChannel object (in simulation)
- ✅ `null` (real Waku mode)

### Check 5: Network Connectivity
Open DevTools → Network tab:
- Look for WebSocket connections (wss://)
- If using real Waku, you should see connections to bootstrap peers

## 💡 Best Practices

### For Development
1. **Use simulation mode** - faster, no network needed
2. **Test cross-tab** - validates message propagation logic
3. **Console open** - watch for errors and peer updates

### For Testing Real Waku
1. **Disable simulation** first
2. **Wait for peers** (10-30 seconds)
3. **Verify peer count** > 0
4. **Test in multiple browsers** - simulates real users

### For Production
1. **Disable simulation** completely
2. **Configure bootstrap peers** (both default + your own)
3. **Monitor peer count** continuously
4. **Fallback to simulation** if no peers after 60s

## 🐛 Still Having Issues?

### Get Help

1. **Check browser console** - screenshot errors
2. **Check Waku SDK version**: Run `pnpm list @waku/sdk`
3. **Try different browser** - test in Chrome/Firefox/Edge
4. **Test with simulation ON** - verify basic functionality works

### Known Limitations

- **Browser CORS**: Some browsers block WebSocket to certain peers
- **Network firewalls**: Corporate networks may block WebSocket
- **Peer availability**: Bootstrap peers might be temporarily down
- **Initial connection**: First connection can take 30-60 seconds

### Workarounds

If real Waku won't connect:
1. **Use simulation mode** for demos
2. **Run local Waku node** and connect to it
3. **Use VPN** if network is blocking
4. **Contribute bootstrap peers** to help the network

## 📚 References

- [Waku Bootstrap Docs](https://docs.waku.org/guides/nodes-and-peers/)
- [Waku SDK Reference](https://js.waku.org/)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

---

**Summary**: Simulation mode is working perfectly with cross-tab sync! Real Waku mode requires peer discovery which may take time. For demos and development, simulation is recommended. ✨

