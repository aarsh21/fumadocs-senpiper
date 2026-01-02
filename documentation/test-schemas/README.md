# Test Schemas

Reference schemas for testing the V2 form runtime. These schemas cover the initial 5 field types and serve as the foundation for both Flutter and KMM/CMP implementations.

## Field Types Covered

| Field Type | Description | Test Schema |
|------------|-------------|-------------|
| `textfield` | Single-line text input | 01, 05 |
| `number` | Numeric input | 01, 04, 05 |
| `string_list` | Selection (dropdown, radio, checkbox, pills) | 02, 03 |
| `timestamp` | Date and/or time picker | 04 |
| `section` | Grouping and repeating sections | 05 |

## Schemas

### 01-basic-form.json

**Purpose:** Test basic text and number input with validation

**Features tested:**
- Text field with pattern validation
- Text field with min/max length
- Number field with min/max constraints
- Number field with prefix/suffix
- Number field with counter layout
- Calculated fields (CALC predicate)
- Form-level required validation

---

### 02-selection-form.json

**Purpose:** Test string_list with various layouts and static options

**Features tested:**
- Dropdown (default layout)
- Radio buttons (`layout: "radio"`)
- Checkboxes for multi-select (`type: "array"`)
- Small pills (`layout: "small_pill"`)
- Large pills (`layout: "large_pill"`)
- Option sorting (`sortOptions: true`)
- Multi-select validation (minRows/maxRows)
- Conditional visibility based on selection
- Localization of options
- Select all button (`allowWildcardSelect`)

---

### 03-master-data-form.json

**Purpose:** Test string_list with master data integration

**Features tested:**
- Master data binding (masterId, columnKey)
- Cascading dropdowns (State → District → Block → Village)
- OPTION_FILTER predicate
- Searchable master (`searchableKeys`)
- filterStringExpression for JS-based filtering
- Offline caching (`enableOfflineOptionFilterMaster`)
- Online search (`enableOnlineSearchableMaster`)
- Calculated location key from selections

---

### 04-datetime-form.json

**Purpose:** Test timestamp, date, and time fields

**Features tested:**
- Full timestamp (date + time)
- Date only (`description: "date"`)
- Time only (`description: "time"`)
- Date format patterns
- Date range constraints (minimum/maximum with timeUnit)
- Past-only dates (birth date)
- Future-only dates (visit date)
- System time auto-fill
- Server timestamp generation
- Age calculation from birth date
- Duration calculation from start/end time
- Event scheduling integration

---

### 05-nested-form.json

**Purpose:** Test section field type with nesting and repetition

**Features tested:**
- Simple section (`type: "object"`)
- Accordion layout (`layout: "accordion"`)
- Collapsed by default (`layout: "collapsed"`)
- Repeating section (`type: "array"`)
- Table layout for arrays (`layout: "table"`)
- Row header display (`keysForRowHeader`)
- Min/max rows validation
- Add row button customization (`newRowLabel`)
- Pre-filled rows with immutable count
- Calculations within repeating rows (`$i` index)
- Grand total from array items
- Nested fields within sections

---

## Usage

### For Flutter

```dart
// Load schema
final schemaJson = await rootBundle.loadString('assets/test-schemas/01-basic-form.json');
final schema = SchemaParser.parse(schemaJson);

// Render form
FormRenderer(schema: schema, onSubmit: handleSubmit);
```

### For KMM/CMP

```kotlin
// Load schema
val schemaJson = loadResource("test-schemas/01-basic-form.json")
val schema = SchemaParser.parse(schemaJson)

// Render form
FormRenderer(schema = schema, onSubmit = ::handleSubmit)
```

---

## Mock Master Data

For testing master data forms (03-master-data-form.json), use this sample data structure:

```json
{
  "locationMaster": [
    { "s": "Maharashtra", "d": "Mumbai", "b": "Andheri", "v": "JVPD" },
    { "s": "Maharashtra", "d": "Mumbai", "b": "Andheri", "v": "4 Bungalows" },
    { "s": "Maharashtra", "d": "Mumbai", "b": "Bandra", "v": "Carter Road" },
    { "s": "Maharashtra", "d": "Pune", "b": "Kothrud", "v": "Paud Road" },
    { "s": "Karnataka", "d": "Bangalore", "b": "Koramangala", "v": "5th Block" }
  ],
  "productMaster": [
    { "productCode": "PROD-001", "productName": "Laptop", "category": "Electronics", "isActive": true, "stock": 50 },
    { "productCode": "PROD-002", "productName": "Mouse", "category": "Electronics", "isActive": true, "stock": 100 },
    { "productCode": "PROD-003", "productName": "T-Shirt", "category": "Clothing", "isActive": true, "stock": 200 },
    { "productCode": "PROD-004", "productName": "Discontinued Item", "category": "Electronics", "isActive": false, "stock": 0 }
  ]
}
```

---

## Validation Checklist

For each schema, verify:

- [ ] All fields render correctly
- [ ] Validation messages display on error
- [ ] Required fields enforce submission blocking
- [ ] Conditional visibility works
- [ ] Calculated fields update automatically
- [ ] Selection fields show correct options
- [ ] Date/time pickers work natively
- [ ] Sections expand/collapse correctly
- [ ] Repeating sections add/remove rows
- [ ] Master data loads and filters correctly
- [ ] JS expressions evaluate properly

