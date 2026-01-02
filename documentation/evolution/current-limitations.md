# Current Schema Limitations

This document identifies architectural limitations in the current Form Schema that impact scalability, maintainability, and feature expansion.

---

## 1. Fat SchemaProperty Problem

### The Issue

`SchemaProperty` has grown into a "god object" with 100+ properties. Most properties are only relevant to specific field types.

```json
{
  "fieldKey": {
    "title": "...",
    "type": "string",
    "description": "textfield",
    
    // Text-specific
    "pattern": "...",
    "maxSize": 100,
    
    // Location-specific (unused for textfield!)
    "pickManually": false,
    "enableGeoTagging": false,
    "locationMandatory": false,
    
    // Multimedia-specific (unused!)
    "multimediaType": null,
    "disableFilepicker": false,
    "enforceCameraFlash": false,
    
    // Date-specific (unused!)
    "dateOnly": false,
    "timeOnly": false,
    "systemTime": false,
    
    // ... 80+ more properties
  }
}
```

### Problems

| Problem | Impact |
|---------|--------|
| **Cognitive overload** | Hard to know which properties apply to which field |
| **No compile-time safety** | Invalid property combinations silently ignored |
| **Bloated payloads** | Every field carries all possible properties |
| **Maintenance burden** | Adding new field type requires touching central class |
| **Documentation complexity** | Hard to document what's relevant where |

### Ideal Solution

Type-specific schemas where each field type only declares its relevant properties.

---

## 2. No Native Paging Support

### The Issue

Forms are defined as flat property maps. Multi-page wizards require:
- Manual page grouping via sections
- Custom navigation logic
- No built-in page state management

### Current Workaround

```json
{
  "page1": {
    "type": "object",
    "description": "section",
    "properties": { ... }
  },
  "page2": {
    "type": "object", 
    "description": "section",
    "properties": { ... }
  }
}
```

Problems:
- No native "next/previous" navigation
- No page validation before proceeding
- No progress indicator support
- No conditional page skipping
- Answer structure includes page wrappers (data pollution)

### Ideal Solution

First-class page support:
```
pages:
  - id: "personal"
    title: "Personal Info"
    fields: [...]
    nextCondition: "..."
  - id: "contact"
    title: "Contact Details"
    fields: [...]
```

---

## 3. Shadow Fields for Page Variables

### The Issue

No way to store temporary/computed values without creating visible form fields.

### Current Workaround

Create hidden fields:
```json
{
  "_tempTotal": {
    "title": "temp",
    "type": "number",
    "accessMatrix": { "visibility": "GONE" }
  }
}
```

Problems:
- Pollutes the answer object with non-user data
- No distinction between user input and computed values
- Fields need unique keys even for temporary storage
- Shadow fields sent to server unnecessarily

### Ideal Solution

Separate page/form variables:
```
variables:
  tempTotal: { type: "number", scope: "page" }
  sessionId: { type: "string", scope: "form" }
```

---

## 4. No Generic API Integration

### The Issue

Cannot define API calls within schema to:
- Fetch data for calculations
- Validate against external systems
- Pre-populate from external sources
- Submit to external endpoints

### Current Workaround

- Use master data (limited to internal forms)
- Use `remoteValidations` (validation only, not data fetching)
- Custom app code outside schema

### Ideal Solution

Generic API definitions:
```
apis:
  - id: "fetchPrice"
    endpoint: "${env.PRICING_API}/products/{productId}"
    method: "GET"
    trigger: "onFieldChange:productId"
    responseMapping:
      price: "$.data.price"
      stock: "$.data.inventory"
```

---

## 5. Limited to Forms Only

### The Issue

Schema is tightly coupled to form filling. Cannot create:
- Static information pages
- Dashboards
- Lists/grids
- Custom layouts
- Read-only views with rich formatting

### Current State

- `label` field for static text (limited)
- No component composition
- No grid/flex layouts
- No cards, tabs outside sections

### Ideal Solution

Support page types beyond forms:
```
type: "static_page" | "form" | "dashboard" | "list"
```

---

## 6. String-Based Expressions

### The Issue

All expressions are JavaScript strings evaluated at runtime:

```json
{
  "predicates": [{
    "condition": "this.qty > 0 && this.price > 0",
    "actionConfig": {
      "formula": "this.qty * this.price * (1 - this.discount/100)"
    }
  }]
}
```

Problems:
- No syntax validation at design time
- No autocomplete in tooling
- No type checking (multiplying string and number)
- Runtime errors hard to debug
- Security concerns with eval

### Ideal Solution

Structured expression language or typed DSL:
```
formula:
  multiply:
    - ref: "qty"
    - subtract:
        - literal: 1
        - divide:
            - ref: "discount"
            - literal: 100
```

Or validated expression syntax with schema-aware tooling.

---

## 7. No Component Composition

### The Issue

Cannot define reusable field groups or custom components.

### Current Workaround

Copy-paste similar field definitions.

### Example Need

Address block used in 50 forms:
```json
{
  "street": { ... },
  "city": { ... },
  "state": { ... },
  "pincode": { ... }
}
```

Currently: Duplicate in every form.
Ideal: Define once, reference everywhere.

### Ideal Solution

```
components:
  AddressBlock:
    type: "composite"
    fields:
      street: { ... }
      city: { ... }
      state: { ... }
      pincode: { ... }

# Usage
fields:
  homeAddress:
    component: "AddressBlock"
  officeAddress:
    component: "AddressBlock"
```

---

## 8. Limited Layout Control

### The Issue

Layout is implicit or via `layout` property with limited options:
- Radio vs dropdown
- Accordion vs expanded
- Table vs cards

Cannot express:
- Grid layouts (2 fields per row)
- Responsive breakpoints
- Custom spacing
- Side-by-side layouts

### Current State

Web uses `webLayout` and `customWebFormLayouts` (complex, underdocumented).

### Ideal Solution

Explicit layout layer:
```
layout:
  type: "grid"
  columns: 2
  gap: "16px"
  areas:
    - [firstName, lastName]
    - [email, phone]
    - [address, address]  # span 2 columns
```

---

## 9. Action Coupling

### The Issue

Actions (what happens) are coupled with schema (what exists):
- Predicates on individual fields
- CALC, OPTION_FILTER inline
- No global action handlers

Cannot easily:
- Define form-level validations
- Create cross-cutting behaviors
- Implement undo/redo
- Add analytics events

### Ideal Solution

Separate action definitions:
```
actions:
  validateTotal:
    trigger: "onSubmit"
    condition: "form.total > 0"
    onFail:
      message: "Total must be positive"
      
  trackFieldChange:
    trigger: "onFieldChange:*"
    action: "analytics.track"
```

---

## 10. No Versioning/Migration

### The Issue

Schema changes break existing answers:
- Renamed field → lost data
- Changed type → invalid data
- Removed field → orphaned data

No built-in:
- Version numbers
- Migration definitions
- Backward compatibility

### Ideal Solution

```
version: "2.0.0"
migrations:
  "1.0.0 → 2.0.0":
    - rename: { from: "fname", to: "firstName" }
    - transform: { field: "phone", expr: "'+91' + value" }
```

---

## 11. No Theming System

### The Issue

Styling is scattered:
- `titleDisplayConfiguration`
- `viewModeConfiguration`
- `fillModeConfiguration`
- Various `*Style` properties

No centralized theme definition.

### Ideal Solution

```
theme:
  colors:
    primary: "#007AFF"
    error: "#FF3B30"
  typography:
    title: { size: 16, weight: "bold" }
    label: { size: 14, weight: "medium" }
  spacing:
    fieldGap: 16
    sectionGap: 24
```

---

## 12. No State Management

### The Issue

Form state is just answers + visibility. Cannot manage:
- Loading states per field
- Error states beyond validation
- Async operation progress
- Undo history
- Draft/autosave state

### Ideal Solution

First-class state model:
```
state:
  fields:
    email:
      value: "..."
      touched: true
      validating: false
      error: null
  form:
    submitting: false
    dirty: true
    savedAt: "..."
```

---

## 13. AccessMatrix Complexity

### The Issue

AccessMatrix tries to do too much:
- Visibility
- Editability
- Default values
- Role-based rules
- All in one object

Results in complex nested structures:
```json
{
  "accessMatrix": {
    "visibility": "VISIBLE",
    "mandatory": true,
    "readOnly": false,
    "roles": ["ADMIN"],
    "answer": "default"
  }
}
```

Plus predicates that apply different AccessMatrix based on conditions.

### Ideal Solution

Separate concerns:
```
visibility: "this.role == 'admin' ? 'visible' : 'hidden'"
editable: "!this.isSubmitted"
required: true
defaultValue: "..."
```

---

## 14. No Offline-First Patterns

### The Issue

Offline support is implicit:
- `enableOfflineMaster`
- `disableOfflineMaster`
- No conflict resolution
- No sync queue visibility

Cannot define:
- What's available offline
- Sync priority
- Conflict resolution strategy

### Ideal Solution

```
offline:
  enabled: true
  syncStrategy: "optimistic"
  conflictResolution: "lastWrite"
  requiredForOffline:
    - "masterId:locations"
    - "masterId:products"
```

---

## 15. No Accessibility Metadata

### The Issue

No explicit accessibility properties:
- Screen reader labels
- Focus order
- Keyboard navigation
- Error announcements

### Ideal Solution

```
accessibility:
  label: "Enter your email address"
  description: "We'll send confirmation here"
  required: true
  errorAnnouncement: "immediate"
```

---

## 16. Master Data Chaos

### The Issue

Master data handling has multiple critical problems:

**Problem A: Duplicate Fetches**
```
Form with 4 location fields (same master)
    │
    ├── State field → Fetch 90,000 records
    ├── District field → Fetch 90,000 records (again!)
    ├── Block field → Fetch 90,000 records (again!)
    └── Village field → Fetch 90,000 records (again!)
```

**Problem B: No Partitioning**
- User needs Maharashtra districts (200 records)
- Must download ALL 90,000 location records
- No lazy loading by region/state

**Problem C: Uncoordinated Caching**
```json
{
  "enableOfflineMaster": true,
  "enableOnlineMaster": true,
  "disableOfflineMaster": false,
  "enableOfflineOptionFilterMaster": true
}
```
- Confusing flags
- No TTL/expiration
- No version tracking
- No delta sync

**Problem D: Memory Exhaustion**
- 90,000 records × 4 fields = loaded 4 times
- Mobile devices crash
- No eviction policy

### Ideal Solution

See [Master Data Strategy](./master-data-strategy.md) for complete solution:
- Centralized master registry
- Single fetch per master
- Partitioning by key column
- Multi-level cache with LRU eviction
- Version-aware delta sync

---

## 17. Undefined Cascade Behavior

### The Issue

OPTION_FILTER has no defined behavior for edge cases:

**Scenario: User clears State**
- What happens to District? Keep? Clear?
- What happens to Block? Village?
- Show all options? Show none? Disable?

**Current:** Different platforms behave differently. No schema control.

### Missing Specifications

| Scenario | V1 Behavior |
|----------|-------------|
| Parent cleared | Undefined |
| Parent changed | Undefined |
| Parent empty | Sometimes all, sometimes none |
| No matching options | No message |
| Loading filter | No indication |
| Race condition | Unhandled |

### Ideal Solution

See [OPTION_FILTER Deep Analysis](./option-filter-analysis.md) for:
- `onParentChange: "clear" | "keep" | "validate"`
- `emptyParentBehavior: "disable" | "showAll" | "showNone"`
- Loading states
- No-match handling
- Race condition debouncing

---

## 18. Backend-Only Properties in Client Schema

### The Issue

The V1 schema is a **single monolithic object** sent to both backend and clients. It contains many properties that are **only consumed by the backend** but are still transmitted to mobile/web clients.

This causes:
- **Payload bloat** - Clients download unnecessary data
- **Security risk** - Backend configuration exposed to clients
- **Confusion** - Unclear which properties matter for rendering
- **Coupling** - Backend changes can inadvertently break clients

### Backend-Only Properties in SchemaProperty

| Property | Purpose | Why Backend-Only |
|----------|---------|------------------|
| `populateMasterDataInServer` | Server-side master data population | Server processing |
| `overwriteMasterDataInServer` | Overwrite existing master values | Server processing |
| `generateSystemTimeAtServer` | Generate timestamp on server | Server-side only |
| `validateAgainstMasters` | Validate field against master | Server validation |
| `masterCombinationKeys` | Combined master validation | Server validation |
| `fontCase` | API/Elasticsearch filter casing | Server API calls |
| `sqlTitle` | SQL column name | External DB integration |
| `primaryKeys` | Hash/document ID generation | Server document creation |
| `formReportConfiguration` | Report configuration | Backend reports |
| `showUrlInExcel` | Excel export behavior | Export only |
| `disableAccessMatrixInBulkUpload` | Bulk upload behavior | Server bulk processing |
| `remoteValidations` | Remote validation configs | Server HTTP calls |
| `externalEntityVerificationConfigs` | Aadhaar/PAN verification | Server external APIs |
| `captureIpAddress` | Capture client IP | Server stores this |
| `scoringConfigs` | Assessment scoring | Backend calculation |
| `sectionArraySchemaPropertyKey` | Internal processing key | Marked @Transient |
| `rootSectionArrayKey` | Internal processing key | Marked @Transient |
| `isInnerSection` | Internal processing flag | Marked @Transient |
| `caseKeyTitle` | Internal processing | Marked @Transient |

### Backend-Only Properties in Predicate

| Property | Purpose | Why Backend-Only |
|----------|---------|------------------|
| `skipPredicateExecutionOnClient` | Skip on client | Tells server to run it |
| `skipPredicateExecutionOnServer` | Skip on server | Could be removed from server response |
| `predicateObj` | Form builder state | Not for runtime |

### Backend-Only Properties in FormSchema

| Property | Purpose | Why Backend-Only |
|----------|---------|------------------|
| `bucketPattern` | Cassandra partitioning | Database internal |
| `webhookIds` | Webhook IDs | Server-side triggers |
| `webhookConfigs` | Webhook configurations | Server HTTP calls |
| `remoteIntegrationConfigs` | Remote integrations | Server APIs |
| `alarmIds` | Alarm configurations | Server notifications |
| `reportIds` | Report IDs | Server reports |
| `processTemplateId` | Process template | Workflow engine |
| `lookupIds` | Lookup configurations | Server lookups |
| `createdBy`, `createdByName`, etc. | Audit metadata | Not for form filling |

### Backend-Only Properties in FormSetting

| Property | Purpose | Why Backend-Only |
|----------|---------|------------------|
| `generateAnswerOnServer` | Server-side answer generation | Server processing |
| `answerGenerationDetailStep` | Server generation steps | Server processing |
| `compileAnswerDetailsStep` | Force server generation | Server processing |
| `sqlExternalDataStoreId` | External SQL data store | Server DB integration |
| `disableAnswerLog` | Disable ES indexing | Server indexing |
| `disableAnswerChangeLogComment` | Comment logging | Server storage |
| `disableNotificationForAnswerSubmission` | Notification control | Server notifications |
| `addSMSInComment` | SMS in comments | Server SMS gateway |
| `runPredicateBeforeWorkflowMove` | Workflow predicates | Server workflow |
| `zipSetting` | Zip download settings | Server export |
| `pdfDownloadConfiguration` | PDF generation | Server export |
| `excelDownloadConfiguration` | Excel export | Server export |
| `htmlConfiguration` | HTML export | Server export |
| `streamingAdjustmentConfigs` | Streaming reports | Server analytics |
| `formAnswerDeletionConfiguration` | Deletion rules | Server data management |
| `bypassDisableDelete` | Delete override | Server access control |
| `ignoreCreatePrimaryKeyConstraint` | Skip uniqueness check | Server validation |
| `ignoreUpdatePrimaryKeyConstraint` | Skip update uniqueness | Server validation |

### Impact

```
Current V1 Schema Payload:
┌────────────────────────────────────────────────────┐
│ SchemaProperty                                      │
│ ├── title, type, description    ← Client needs     │
│ ├── hint, placeholder, layout   ← Client needs     │
│ ├── predicates, accessMatrix    ← Client needs     │
│ ├── ...                                            │
│ ├── sqlTitle                    ← Backend only     │
│ ├── formReportConfiguration     ← Backend only     │
│ ├── populateMasterDataInServer  ← Backend only     │
│ ├── remoteValidations           ← Backend only     │
│ └── ... 20+ more backend props  ← Backend only     │
└────────────────────────────────────────────────────┘
         ↓                              ↓
     Sent to                        Sent to
     Backend                         Client
    (uses all)                   (ignores 30%+)
```

### Ideal Solution (V2 Approach)

**Separate schemas for different consumers:**

```
┌─────────────────────────────────────────────────────┐
│                   V2 Schema (Full)                   │
│                                                      │
│  ├── model          ← Both need                      │
│  ├── ui             ← Client needs                   │
│  ├── logic          ← Both need (partially)          │
│  ├── integrations   ← BACKEND ONLY                   │
│  │   ├── apis       ← Server HTTP calls              │
│  │   ├── webhooks   ← Server triggers                │
│  │   └── exports    ← Server export configs          │
│  └── access         ← Both need (partially)          │
└─────────────────────────────────────────────────────┘
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌─────────────┐             ┌─────────────────┐
│ Client View │             │  Backend View    │
│ (filtered)  │             │    (full)        │
│             │             │                  │
│ - model     │             │ - model          │
│ - ui        │             │ - ui             │
│ - logic*    │             │ - logic          │
│ - access*   │             │ - integrations   │
│             │             │ - access         │
└─────────────┘             └─────────────────┘
  * Client-relevant          Full schema
    parts only
```

### V2 Design Principles

1. **Explicit separation**: `integrations` layer is clearly backend-only
2. **Layer-based filtering**: Server can omit layers when sending to client
3. **No @Transient pollution**: Transient fields stay server-side
4. **Clear boundaries**: Each layer has defined consumers

### Migration Note

When converting V1 to V2:
- Move server-only properties to `integrations` layer
- Mark properties with `serverOnly: true` where appropriate
- Consider a "schema projection" API that returns client-safe subset

---

## Summary of Limitations

| Category | Issue | Impact |
|----------|-------|--------|
| **Structure** | Fat SchemaProperty | Maintainability |
| **Navigation** | No paging support | UX complexity |
| **State** | Shadow fields required | Data pollution |
| **Integration** | No API support | Limited flexibility |
| **Scope** | Forms only | Can't build pages |
| **Safety** | String expressions | Runtime errors |
| **Reuse** | No composition | Duplication |
| **Layout** | Limited control | UI limitations |
| **Logic** | Action coupling | Inflexibility |
| **Evolution** | No versioning | Migration pain |
| **Styling** | No theming | Inconsistency |
| **State** | Basic state model | Limited UX |
| **Access** | Complex AccessMatrix | Confusion |
| **Offline** | Implicit patterns | Uncertainty |
| **A11y** | No metadata | Accessibility issues |
| **Master Data** | Duplicate fetches, no partitioning | Client crashes |
| **Cascades** | Undefined edge case behavior | Inconsistent UX |
| **Separation** | Backend props in client schema | Bloat, security, coupling |

---

## Next Steps

See [Proposed Schema V2](./proposed-schema-v2.md) for a redesigned schema addressing these limitations.

