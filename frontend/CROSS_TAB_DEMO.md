# Cross-Tab Discovery Demo

## 🎯 What This Demonstrates

This simulates how **Waku's pubsub network** works in real life:
- One publisher announces a manifest
- All nodes on the network receive it instantly
- No central server required
- Pure peer-to-peer propagation

## 🚀 Try It Yourself

### Step 1: Open Multiple Tabs

Open these URLs in separate tabs/windows:

```
Tab 1: http://localhost:3000/           (Landing Page)
Tab 2: http://localhost:3000/           (Another Landing Page)
Tab 3: http://localhost:3000/dashboard  (Dashboard → Explore tab)
```

### Step 2: Arrange Windows

Arrange your browser windows side-by-side so you can see all tabs at once.

```
┌─────────────────────┐  ┌─────────────────────┐
│   Tab 1: Landing    │  │   Tab 2: Landing    │
│                     │  │                     │
│  [Simulate Publish] │  │  [Simulate Publish] │
│                     │  │                     │
│  Manifests: 0       │  │  Manifests: 0       │
└─────────────────────┘  └─────────────────────┘
         ┌─────────────────────┐
         │ Tab 3: Dashboard    │
         │    (Explore Tab)    │
         │  [Simulate Publish] │
         │                     │
         │  Manifests: 0       │
         └─────────────────────┘
```

### Step 3: Publish from Tab 1

1. Click "📢 Simulate Publish" in **Tab 1**
2. Watch what happens:
   - ✅ Tab 1: New card appears immediately
   - ✅ Tab 2: Same card appears instantly!
   - ✅ Tab 3: Same card appears instantly!

### Step 4: Publish from Tab 2

1. Click "📢 Simulate Publish" in **Tab 2**
2. Watch the second publication appear in ALL tabs simultaneously

### Step 5: Check the Console

Open browser DevTools (F12) in each tab and check console logs:

**Tab 1 (published):**
```
✓ Simulated manifest #1 created & broadcast: Breaking News: Censorship Resistance Works
```

**Tab 2 (received):**
```
📡 Received manifest from another tab: Breaking News: Censorship Resistance Works
```

**Tab 3 (received):**
```
📡 Received manifest from another tab: Breaking News: Censorship Resistance Works
```

## 🔬 What's Happening Under the Hood

```
Tab 1 Publishes
       │
       │ simulatePublish()
       │
       ▼
  Creates Manifest
       │
       ├──► Adds to local state (Tab 1 sees it)
       │
       └──► BroadcastChannel.postMessage()
              │
              ├──► Tab 2 receives via channel.onmessage
              │      └──► Adds to local state (Tab 2 sees it)
              │
              └──► Tab 3 receives via channel.onmessage
                     └──► Adds to local state (Tab 3 sees it)
```

## 📊 Expected Behavior

### All Tabs Stay in Sync
- Manifest count is the same across all tabs
- Same publications appear in the same order
- No duplicates (CID-based deduplication)

### Console Logs Show Communication
- Publisher tab: `created & broadcast`
- Receiver tabs: `Received from another tab`

### Instant Propagation
- No delay between tabs
- Feels like real-time network

## 🎮 Advanced Testing

### Test 1: Multiple Publishers
1. Rapidly click publish in different tabs
2. All messages should appear in all tabs
3. No race conditions or duplicates

### Test 2: New Tab Joins Late
1. Publish 5 messages in Tab 1
2. Open a new Tab 4
3. Tab 4 starts empty (no historical messages)
4. Publish from Tab 1 again
5. Tab 4 receives only new messages

**Note**: This matches real Waku behavior - new nodes only see messages after they join, unless they query the Store protocol.

### Test 3: Close and Reopen
1. Have 3 tabs with 5 messages each
2. Close Tab 2
3. Publish from Tab 1
4. Only Tab 1 and Tab 3 get the message
5. Reopen a tab → starts fresh (no persistence yet)

## 🔧 Technical Details

### BroadcastChannel API
- Browser-native cross-tab communication
- No server or WebSocket needed
- Same-origin only (security)
- Automatic cleanup when tabs close

### Channel Name
```typescript
const channel = new BroadcastChannel('freepress-discovery');
```

All tabs using the same channel name can communicate.

### Message Format
```typescript
interface Manifest {
  cid: string;
  site_cid: string;
  pubkey: string;
  signature: string;
  timestamp: number;
  title: string;
  description: string;
  tags: string[];
  onion_url?: string;
  mirror_count?: number;
}
```

## 🎯 Why This Matters

This demo shows how FreePress will work in production:

1. **Publisher announces** → `publishManifest()` sends to Waku
2. **Waku propagates** → Message reaches all subscribed peers
3. **Discovery nodes receive** → Filter subscription catches it
4. **Indexers pin content** → IPFS stores it for resilience
5. **Readers discover** → Browse content from any mirror

The cross-tab demo **simulates steps 1-3** without needing a real Waku network!

## 🐛 Troubleshooting

### Messages not appearing in other tabs
- Hard refresh all tabs (Ctrl+Shift+R)
- Check browser console for errors
- Verify all tabs are on same origin (localhost:3000)

### Duplicates appearing
- Check console for "already exists" messages
- CID-based dedup should prevent this
- If it happens, it's a bug - please report

### One tab not receiving
- Close and reopen that tab
- Check if BroadcastChannel is supported (all modern browsers)
- Try incognito mode to rule out extension interference

## 📚 Related Docs

- `WAKU_IMPLEMENTATION.md` - Full technical documentation
- `WAKU_QUICK_START.md` - Quick reference guide
- [BroadcastChannel MDN](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

---

**Happy Testing!** 🎉

This cross-tab feature shows how powerful decentralized discovery can be. In production, this will work across different computers, networks, and even countries - all without any central server.

