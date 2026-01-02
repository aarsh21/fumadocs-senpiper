# Master Data Strategy

This document addresses the critical challenges of master data management and proposes a robust solution.

---

## Current Problems

### Problem 1: Duplicate Fetches

**Scenario:** Form has 4 location fields: State, District, Block, Village.
All use same master data (Location Master with 90,000 records).

**Current behavior:**
```
Form loads
    │
    ├── State field initializes → Fetch Location Master
    ├── District field initializes → Fetch Location Master (again!)
    ├── Block field initializes → Fetch Location Master (again!)
    └── Village field initializes → Fetch Location Master (again!)
```

**Result:** 4 identical requests for 90,000 records.

---

### Problem 2: Large Dataset Size

**Real numbers from production:**
| Master | Records | Size |
|--------|---------|------|
| Location (India) | 90,000+ | ~15 MB |
| Products | 50,000 | ~8 MB |
| Employees | 10,000 | ~2 MB |

**Problems:**
- Memory pressure on mobile devices
- Network bandwidth (especially on slow connections)
- Parsing/processing time
- Storage quota limits

---

### Problem 3: Uncoordinated Caching

**Current flags:**
```json
{
  "enableOfflineMaster": true,
  "enableOnlineMaster": true,
  "disableOfflineMaster": false,
  "enableOfflineOptionFilterMaster": true
}
```

**Issues:**
- No expiration policy
- No partial cache support
- No coordination between fields
- No cache invalidation strategy
- No version tracking

---

### Problem 4: All-or-Nothing Loading

**Scenario:** User only needs districts for "Maharashtra" (200 records).
**Current:** Must download all 90,000 location records.

No support for:
- Lazy loading
- Partial fetches
- On-demand filtering

---

### Problem 5: Offline/Online Sync

**Scenario:** User downloads master offline. Master updates on server.

**Questions:**
- When to check for updates?
- How to handle delta updates?
- What if offline form has values no longer in master?

---

## Proposed Solution: Centralized Master Registry

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEMA DEFINITION                         │
│                                                              │
│  masters:                                                    │
│    locations:                                                │
│      id: "uuid"                                              │
│      strategy: "lazy"                                        │
│                                                              │
│  fields:                                                     │
│    state: { masterRef: "locations", column: "s" }           │
│    district: { masterRef: "locations", column: "d" }        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MASTER REGISTRY                           │
│                    (Singleton per form)                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Master: locations                                        ││
│  │ Status: loaded | loading | error                        ││
│  │ Records: 90,000                                          ││
│  │ Version: "2024-01-15T10:30:00Z"                         ││
│  │ Subscribers: [state, district, block, village]          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIELD COMPONENTS                          │
│                                                              │
│  State ───────┬──── Read from registry ────┬───── District  │
│               │                            │                 │
│  Block ───────┴────────────────────────────┴───── Village   │
│                                                              │
│  (All share same data, one fetch)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Schema Definition

### V2 Master Declaration

```yaml
schema:
  integrations:
    masters:
      # Declare masters at form level, not per field
      locations:
        id: "70311147-2fcc-489c-9981-8f374361a229"
        name: "India Locations"
        
        # Loading strategy
        strategy: "eager" | "lazy" | "onDemand"
        
        # Caching configuration
        cache:
          storage: "memory" | "indexedDB" | "sqlite"
          ttl: 86400  # seconds (24 hours)
          maxRecords: 100000
          compression: true
          
        # Version tracking
        versioning:
          enabled: true
          checkInterval: 3600  # Check for updates every hour
          
        # Partial loading support
        partitioning:
          enabled: true
          partitionBy: "s"  # State column
          maxPartitions: 50
          
        # Columns to fetch
        columns: ["s", "d", "b", "v", "pincode"]
        
        # Indexed columns for fast filtering
        indexes: ["s", "d", "b"]
        
      products:
        id: "product-master-uuid"
        strategy: "onDemand"
        cache:
          storage: "memory"
          ttl: 300
        searchable: true
        searchFields: ["name", "sku", "category"]
```

### Field Reference

```yaml
model:
  fields:
    state:
      type: "select"
      options:
        masterRef: "locations"  # Reference to master declaration
        column: "s"
        distinct: true
        
    district:
      type: "select"
      options:
        masterRef: "locations"
        column: "d"
        distinct: true
        filter:
          - field: "state"
            column: "s"
```

---

## Loading Strategies

### Strategy 1: Eager Loading

**When to use:** Small masters (<1000 records), critical for form

```yaml
strategy: "eager"
```

**Behavior:**
```
Form schema loads
         │
         ▼
Identify all eager masters
         │
         ▼
Parallel fetch all
         │
         ▼
Cache in memory
         │
         ▼
Form ready to render
```

**Pros:** No loading delays during form fill
**Cons:** Slower initial load, more memory

---

### Strategy 2: Lazy Loading

**When to use:** Medium masters, may not be needed

```yaml
strategy: "lazy"
```

**Behavior:**
```
Form loads (no master fetch)
         │
         ▼
User clicks State dropdown
         │
         ▼
First field using master triggers load
         │
         ▼
All fields sharing master wait
         │
         ▼
Data loaded, all fields ready
```

**Pros:** Only loads if needed
**Cons:** Delay on first use

---

### Strategy 3: On-Demand Loading

**When to use:** Large masters, searchable fields

```yaml
strategy: "onDemand"
partitioning:
  enabled: true
  partitionBy: "s"
```

**Behavior:**
```
User types in State field
         │
         ▼
API call: GET /master/{id}/search?column=s&query=Maha
         │
         ▼
Returns matching states only
         │
         ▼
User selects "Maharashtra"
         │
         ▼
API call: GET /master/{id}/partition?s=Maharashtra
         │
         ▼
Returns all records where s="Maharashtra"
         │
         ▼
Cache partition locally
         │
         ▼
District, Block, Village filter from cached partition
```

**Pros:** Minimal data transfer
**Cons:** Requires server support, more API calls

---

## Caching Architecture

### Multi-Level Cache

```
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL 1: MEMORY CACHE                     │
│                    (Current session)                         │
│                                                              │
│  Fast access, lost on app close                              │
│  Limit: ~50MB                                                │
└─────────────────────────────────────────────────────────────┘
                           │
                      Cache miss
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL 2: PERSISTENT CACHE                 │
│                    (IndexedDB / SQLite)                      │
│                                                              │
│  Survives app restart, limited by storage quota              │
│  Limit: ~500MB                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                      Cache miss
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL 3: SERVER                           │
│                                                              │
│  Always fresh, requires network                              │
└─────────────────────────────────────────────────────────────┘
```

### Cache Entry Structure

```typescript
interface MasterCacheEntry {
  masterId: string;
  version: string;
  fetchedAt: Date;
  expiresAt: Date;
  
  // Metadata
  totalRecords: number;
  sizeBytes: number;
  compressed: boolean;
  
  // Partitioning
  partition?: {
    key: string;
    value: string;
  };
  
  // Data
  records: Record[];
  
  // Indexes for fast lookup
  indexes: {
    [column: string]: Map<value, recordIndex[]>
  };
}
```

---

## Partitioning Strategy

### Why Partition?

**90,000 location records:**
- 36 states/UTs
- Average 2,500 records per state
- Most forms work within one state

**Partition by state:**
- Load only ~2,500 records
- 97% reduction in data transfer

### Schema Configuration

```yaml
partitioning:
  enabled: true
  partitionBy: "s"  # State column
  
  # Load strategy
  preloadPartitions: ["MH", "KA", "TN"]  # Common states
  maxCachedPartitions: 5
  
  # Eviction policy
  eviction: "LRU"  # Least Recently Used
```

### Runtime Behavior

```
User selects State = "Maharashtra"
         │
         ▼
Check: Is partition "MH" cached?
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   YES        NO
    │         │
    ▼         ▼
Use cached   Fetch partition
    │         │
    │         ▼
    │     Cache partition
    │         │
    │         ▼
    │     Evict if > maxCachedPartitions
    │         │
    └────┬────┘
         │
         ▼
Filter district/block/village from partition
```

---

## Version Management

### Server-Side Versioning

```
Master data changes
         │
         ▼
Server increments version
         │
         ▼
Version stored as: "2024-01-15T10:30:00Z"
```

### Client Version Check

```yaml
versioning:
  enabled: true
  checkInterval: 3600  # seconds
  checkOn: ["formLoad", "appResume"]
```

### Version Check Flow

```
Client opens form
         │
         ▼
Check: When was version last checked?
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Recent      Stale
    │         │
    ▼         ▼
Use cache   HEAD /master/{id}/version
    │         │
    │         ▼
    │     Server version != cached version?
    │         │
    │    ┌────┴────┐
    │    │         │
    │    ▼         ▼
    │   YES        NO
    │    │         │
    │    ▼         ▼
    │  Invalidate  Use cache
    │  cache
    │    │
    │    ▼
    │  Re-fetch on next use
    │    │
    └────┴────┘
```

---

## Offline Support

### Offline Requirement Declaration

```yaml
offline:
  enabled: true
  requiredMasters:
    - ref: "locations"
      partitions: ["MH", "KA"]  # Pre-cache these
      required: true  # Form can't work without
      
    - ref: "products"
      required: false  # Nice to have
      fallback: "showEmpty"
```

### Sync Strategy

```yaml
sync:
  strategy: "wifi" | "any" | "manual"
  
  # Background sync
  background:
    enabled: true
    interval: 86400  # Daily
    wifiOnly: true
    
  # Delta sync (only changed records)
  delta:
    enabled: true
    trackChanges: true
```

### Delta Sync Flow

```
Background sync triggers
         │
         ▼
GET /master/{id}/changes?since={lastSync}
         │
         ▼
Server returns:
{
  "added": [...],
  "modified": [...],
  "deleted": [...]
}
         │
         ▼
Apply changes to local cache
         │
         ▼
Update lastSync timestamp
```

---

## API Endpoints (Server Requirements)

### Required Endpoints

```
# Full master data
GET /masters/{id}
GET /masters/{id}?columns=s,d,b

# Version check
HEAD /masters/{id}
Response: X-Version: "2024-01-15T10:30:00Z"

# Partitioned data
GET /masters/{id}/partition?{column}={value}
GET /masters/{id}/partition?s=Maharashtra

# Search
GET /masters/{id}/search?q={query}&columns={columns}
GET /masters/{id}/search?q=Mum&columns=d,b

# Changes since
GET /masters/{id}/changes?since={timestamp}

# Metadata
GET /masters/{id}/meta
Response: {
  totalRecords: 90000,
  lastUpdated: "...",
  columns: ["s", "d", "b", "v"],
  partitionColumn: "s",
  partitionCounts: { "MH": 5000, "KA": 4500, ... }
}
```

---

## Client Implementation

### Master Manager (Singleton)

```typescript
class MasterManager {
  private registry: Map<string, MasterEntry>;
  private memoryCache: LRUCache<string, MasterData>;
  private persistentCache: IndexedDBCache;
  
  // Prevent duplicate fetches
  private inflightRequests: Map<string, Promise<MasterData>>;
  
  async getMaster(config: MasterConfig): Promise<MasterData> {
    const cacheKey = this.buildCacheKey(config);
    
    // Check memory cache
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }
    
    // Check persistent cache
    const cached = await this.persistentCache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      this.memoryCache.set(cacheKey, cached);
      return cached;
    }
    
    // Check inflight request (prevent duplicate)
    if (this.inflightRequests.has(cacheKey)) {
      return this.inflightRequests.get(cacheKey);
    }
    
    // Fetch from server
    const fetchPromise = this.fetchMaster(config);
    this.inflightRequests.set(cacheKey, fetchPromise);
    
    try {
      const data = await fetchPromise;
      this.memoryCache.set(cacheKey, data);
      await this.persistentCache.set(cacheKey, data);
      return data;
    } finally {
      this.inflightRequests.delete(cacheKey);
    }
  }
  
  // Called by multiple fields, returns same promise
  getSharedMaster(masterId: string): Promise<MasterData> {
    // All fields using same master share one request
  }
}
```

### Field Component Integration

```typescript
function SelectField({ config }) {
  const masterManager = useMasterManager();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (config.options.masterRef) {
      setLoading(true);
      
      // All fields with same masterRef share this call
      masterManager
        .getSharedMaster(config.options.masterRef)
        .then(data => {
          const filtered = applyFilters(data, config.options.filter);
          const distinct = getDistinct(filtered, config.options.column);
          setOptions(distinct);
        })
        .finally(() => setLoading(false));
    }
  }, [config, parentValues]);
  
  return <Dropdown options={options} loading={loading} />;
}
```

---

## Complete Example

### Schema

```yaml
schema:
  integrations:
    masters:
      locations:
        id: "70311147-2fcc-489c-9981-8f374361a229"
        name: "India Locations"
        strategy: "lazy"
        
        cache:
          storage: "indexedDB"
          ttl: 86400
          compression: true
          
        partitioning:
          enabled: true
          partitionBy: "s"
          maxCachedPartitions: 5
          
        versioning:
          enabled: true
          checkInterval: 3600
          
        columns: ["s", "d", "b", "v"]
        indexes: ["s", "d", "b"]
        
  model:
    fields:
      state:
        type: "select"
        options:
          masterRef: "locations"
          column: "s"
          distinct: true
          
      district:
        type: "select"
        options:
          masterRef: "locations"
          column: "d"
          distinct: true
          filter:
            - field: "state"
              column: "s"
              
      block:
        type: "select"
        options:
          masterRef: "locations"
          column: "b"
          distinct: true
          filter:
            - field: "state"
              column: "s"
            - field: "district"
              column: "d"
```

### Runtime Flow

```
1. Form loads
   └── Master "locations" registered (not fetched yet)

2. User clicks "State" dropdown
   └── Lazy load triggers
   └── Fetch: GET /masters/{id}?columns=s&distinct=true
   └── Returns: ["Maharashtra", "Karnataka", ...]
   └── Cache: states list

3. User selects "Maharashtra"
   └── Fetch partition: GET /masters/{id}/partition?s=Maharashtra
   └── Returns: 5,000 records for Maharashtra
   └── Cache partition
   └── District/Block/Village filter from cached partition

4. User selects "Mumbai" district
   └── Block filters from cached partition (no API call)

5. User selects "Andheri" block
   └── Village filters from cached partition (no API call)

6. User changes State to "Karnataka"
   └── Check: partition "KA" cached?
   └── No: Fetch partition
   └── Evict oldest partition if > maxCachedPartitions
   └── Clear District/Block/Village (cascade policy)
```

---

## Summary

| Problem | Solution |
|---------|----------|
| Duplicate fetches | Centralized MasterManager with request deduplication |
| Large datasets | Partitioning by key column |
| Uncoordinated caching | Unified cache with TTL and versioning |
| All-or-nothing loading | Lazy + on-demand strategies |
| Offline sync | Delta sync with background refresh |
| Memory pressure | Multi-level cache with LRU eviction |

