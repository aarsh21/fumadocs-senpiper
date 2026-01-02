# Conditional Logic (Predicates)

## What Are Predicates?

Predicates are the heart of dynamic forms. They define rules that say:

> "When **this condition** is true, perform **this action** on this field."

Without predicates, forms are static—fields just sit there waiting for input. With predicates, forms come alive:
- Fields appear and disappear based on previous answers
- Values calculate automatically
- Options filter based on selections
- Validation adapts to context

---

## Anatomy of a Predicate

Every predicate has three parts:

```json
{
  "predicates": [{
    "condition": "this.country == 'India'",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": {
      "accessMatrix": {
        "visibility": "VISIBLE",
        "mandatory": true
      }
    }
  }]
}
```

| Part | Purpose | Required? |
|------|---------|-----------|
| `condition` | When should this run? (JavaScript expression) | Optional* |
| `action` | What action to perform | Required |
| `actionConfig` | Parameters for the action | Depends on action |

*If no condition is specified, the predicate always runs when triggered.

---

## The Predicate Lifecycle

Understanding when predicates run is crucial:

```
┌─────────────────────────────────────────────────────────────┐
│                    FORM LOADS                                │
│                        │                                     │
│                        ▼                                     │
│            All predicates evaluate                           │
│            (with current/empty answers)                      │
│                        │                                     │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    USER EDITS FIELD                          │
│                        │                                     │
│                        ▼                                     │
│    Check: Is this field in any dependentKeys?                │
│                        │                                     │
│              ┌─────────┴─────────┐                          │
│              │                   │                           │
│              ▼                   ▼                           │
│             YES                  NO                          │
│              │                   │                           │
│              ▼                   ▼                           │
│    Run predicates of            Done                         │
│    dependent fields                                          │
│              │                                               │
│              ▼                                               │
│    For each predicate:                                       │
│    1. Evaluate condition                                     │
│    2. If true, execute action                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Dependency Chain

```json
{
  "state": {
    "title": "State",
    "dependentKeys": ["district", "fullAddress"]
  },
  "district": {
    "title": "District",
    "predicates": [{
      "action": "OPTION_FILTER",
      "actionConfig": { "field": "state" }
    }],
    "dependentKeys": ["fullAddress"]
  },
  "fullAddress": {
    "title": "Full Address",
    "predicates": [{
      "action": "CALC",
      "actionConfig": {
        "formula": "this.state + ', ' + this.district"
      }
    }]
  }
}
```

When user selects a State:
1. State's `dependentKeys` triggers: District, FullAddress
2. District's OPTION_FILTER runs → options update
3. FullAddress's CALC runs → value updates
4. If District changes due to filtering, its `dependentKeys` trigger again

### Dependent Keys Format

The `dependentKeys` array uses **dot-separated notation** for nested field references:

```json
{
  "dependentKeys": [
    "simpleField",           // Top-level field
    "section.nestedField",   // Nested field inside a section
    "array.0.fieldInRow"     // Field in specific array row
  ]
}
```

### Behavior When Dependent Keys Are Missing

When a field listed in `dependentKeys` does not exist in the schema:

**Current Client Behavior:**
- Clients run **all predicates** regardless of whether dependent keys exist
- Missing fields are silently ignored
- No error is thrown

**Alternative Approaches (Not Currently Implemented):**
1. **Strict Mode**: Throw an error if a dependent key references a non-existent field
2. **Warning Mode**: Log a warning but continue execution
3. **Lazy Evaluation**: Only run predicates when all dependent fields exist and have values

> **Note:** Clients should implement defensive checks when referencing dependent keys to avoid runtime errors.

---

## Action Types

### CALC - Calculate Value

**Purpose:** Compute a value and store it in this field.

**When to use:** Auto-calculated totals, concatenated strings, derived values.

```json
{
  "title": "Total Amount",
  "type": "number",
  "formulaKeys": ["quantity", "unitPrice", "discount"],
  "predicates": [{
    "action": "CALC",
    "actionConfig": {
      "formula": "this.quantity * this.unitPrice * (1 - this.discount/100)"
    }
  }]
}
```

**Important:** The formula's return value **replaces** the field's current value.

**Null Value Handling:**
When the formula returns `null`, the field's value is **removed/cleared**. This allows formulas to conditionally clear values:

```json
{
  "formula": "this.condition ? this.someValue : null"  // Clears field when condition is false
}
```

**Real example from your codebase:**
```json
{
  "title": "Location Key",
  "predicates": [{
    "action": "CALC",
    "actionConfig": {
      "formula": "this.s+'/'+this.di+'/'+this.bl+'/'+this.villa"
    }
  }]
}
```

---

### OPTION_FILTER - Filter Dropdown Options

**Purpose:** Filter the available options in a dropdown based on another field's value.

**When to use:** Cascading dropdowns (State → District → City).

> **Note:** This action only works with fields of type `string_list`. See [Schema Properties - String List](schema-properties.md#string-list) for details.

```json
{
  "title": "District",
  "masterId": "location-master-uuid",
  "columnKey": "district",
  "predicates": [{
    "action": "OPTION_FILTER",
    "actionConfig": {
      "field": "state"
    }
  }]
}
```

**How it works:**
1. User selects "Maharashtra" in State field
2. OPTION_FILTER predicate triggers on District
3. System filters master data where State column = "Maharashtra"
4. District dropdown shows only matching districts

**Data Sources for Options:**
Options can come from three sources:
1. **Enum List** - Static list defined in schema via `enum` property. See [Schema Properties - Enum](schema-properties.md#enum)
2. **Offline Master** - Pre-synced master data stored locally. See [Master Data - Offline](master-data.md#offline-master)
3. **Online Master** - Real-time API fetch. See [Master Data - Online](master-data.md#online-master) and [Master Data API Spec](../api/master-data-api.md)

**Clearing Parent Values:**
When a parent field's value is cleared:
- **All child field values should be removed** - cascading clear down the hierarchy
- Clients must ensure the value cascade is maintained

**Multi-Selection Behavior:**
- Clients **must disable multi-selection** on child fields when the parent value is not selected
- Child field UI should not allow value selection or inference without a valid parent value
- This ensures data integrity in cascading dropdown hierarchies

**Real example from your codebase:**
```json
{
  "title": "District",
  "masterId": "70311147-2fcc-489c-9981-8f374361a229",
  "masterName": "Location master",
  "columnKey": "d",
  "predicates": [{
    "action": "OPTION_FILTER",
    "actionConfig": {
      "field": "s"
    }
  }]
}
```

---

### APPLY_ACCESS_MATRIX - Change Field Access

**Purpose:** Dynamically change a field's visibility, mandatory status, or editability.

**When to use:** Show/hide fields based on conditions, make fields required conditionally.

> **Reference:** See [Schema Properties - Access Matrix](schema-properties.md#access-matrix) for the full `accessMatrix` object specification.

```json
{
  "title": "Spouse Name",
  "predicates": [{
    "condition": "this.maritalStatus == 'Married'",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": {
      "accessMatrix": {
        "visibility": "VISIBLE",
        "mandatory": true
      }
    }
  }, {
    "condition": "this.maritalStatus != 'Married'",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": {
      "accessMatrix": {
        "visibility": "GONE"
      }
    }
  }]
}
```

**Access Matrix Options:**
| Property | Values | Effect |
|----------|--------|--------|
| `visibility` | `VISIBLE`, `INVISIBLE`, `GONE` | Show, hide (keep space), remove |
| `mandatory` | `true`, `false` | Required for submission |
| `readOnly` | `true`, `false` | View only |

**How Access Matrix is Applied:**

> **⚠️ Open Question:** The exact application strategy needs clarification:
> 
> **Option A - Property-by-Property Replacement:**
> - Only the properties specified in the predicate's `accessMatrix` are updated
> - Existing properties not mentioned are preserved
> - Example: `{ "mandatory": true }` only changes mandatory, visibility stays unchanged
> 
> **Option B - Entire Object Replacement:**
> - The entire `accessMatrix` object is replaced
> - Properties not specified reset to defaults
> - Example: `{ "mandatory": true }` replaces everything, visibility becomes default
> 
> **Current Behavior:** Clients should implement **Option A** (property-by-property) for backward compatibility.

**Access Matrix Levels in Schema:**
The `accessMatrix` can be defined at multiple levels:
1. **Field Level** - On individual [schema properties](schema-properties.md)
2. **Section Level** - On section/object containers
3. **Form Level** - Global defaults for the form

**Reverting Access Matrix Changes:**
When a predicate condition evaluates to `false`:
- The access matrix changes from that predicate are **not automatically reverted**
- Clients must define explicit predicates for both `true` and `false` conditions
- See [Best Practices - Always Define Both States](#1-always-define-both-states)

**Note:** You often need **two predicates**—one for "when condition is true" and one for "when condition is false".

---

### VALIDATE - Custom Validation

**Purpose:** Run custom validation and show error messages.

**When to use:** Complex validation rules beyond simple required/pattern.

```json
{
  "title": "End Date",
  "predicates": [{
    "condition": "this.endDate <= this.startDate",
    "action": "VALIDATE",
    "actionConfig": {
      "errorMessage": "End date must be after start date"
    }
  }]
}
```

**Validation Logic:**
- When condition evaluates to `true`: The field is **INVALID** and the error message is displayed
- When condition evaluates to `false`: The field is **VALID**
- The `errorMessage` is displayed **below the field**

**Action Config Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `errorMessage` | `string` | Error message displayed when validation fails |

**With Popup Configuration:**

The `validatePredicateConfig` allows displaying validation results as popups:

```json
{
  "predicates": [{
    "condition": "this.quantity > this.maxStock",
    "action": "VALIDATE",
    "actionConfig": {
      "useValidatePredicateConfig": true,
      "validatePredicateConfig": {
        "errorMessage": "Quantity exceeds available stock",
        "resultLayout": "POPUP",
        "allowSubmissionOnConditionFailure": false,
        "popupConfiguration": {
          "title": "Validation Error",
          "imageUrl": "https://example.com/warning-icon.png",
          "imageType": "URL",
          "dismissButtonText": "OK"
        }
      }
    }
  }]
}
```

**Popup Configuration Options:**
| Property | Type | Description |
|----------|------|-------------|
| `resultLayout` | `INLINE` \| `POPUP` | Where to show the message |
| `allowSubmissionOnConditionFailure` | `boolean` | Allow form submission despite error |
| `popupConfiguration.title` | `string` | Popup title |
| `popupConfiguration.imageUrl` | `string` | Image URL for popup |
| `popupConfiguration.imageType` | `URL` \| `BASE64` | Type of image source |
| `popupConfiguration.dismissButtonText` | `string` | Button text to dismiss popup |

---

### COPY - Copy Value from Another Field

**Purpose:** Copy a value from one field to another.

**When to use:** Default values, carrying forward answers.

```json
{
  "title": "Billing Address",
  "predicates": [{
    "condition": "this.sameAsShipping == true",
    "action": "COPY",
    "actionConfig": {
      "field": "shippingAddress"
    }
  }]
}
```

---

### ASYNC_CALC - Aggregation from Other Forms

**Purpose:** Calculate aggregates (sum, count, average) from another form's answers.

**When to use:** Dashboards, rollup calculations, cross-form totals.

> **📝 TODO:** Mihir to add detailed documentation for ASYNC_CALC including:
> - Full API specification
> - Filter condition syntax
> - Error handling
> - Performance considerations

```json
{
  "title": "Total Orders",
  "predicates": [{
    "action": "ASYNC_CALC",
    "actionConfig": {
      "formSchemaIdentifier": {
        "groupId": "...",
        "formSchemaId": "orders-form-id"
      },
      "filterCondition": "this.customerId == formAnswer.customerId",
      "key": "amount",
      "operation": "SUM"
    }
  }]
}
```

**Operations:**
- `SUM` - Add up all values
- `COUNT` - Count matching records
- `AVERAGE` - Calculate mean
- `MIN` - Find minimum
- `MAX` - Find maximum

---

### CONDITIONAL_FORMAT - Change Field Appearance

> **⚠️ Deprecation Notice:** 
> This action type may be deprecated in future versions. Garima to verify current usage across clients.
> - If no clients are actively using this, it will be marked as deprecated
> - Future styling should use [Field Display Configuration](schema-properties.md#field-display-configuration) instead

**Purpose:** Change how a field looks based on conditions.

**When to use:** Highlighting values, status indicators.

```json
{
  "predicates": [{
    "action": "CONDITIONAL_FORMAT",
    "actionConfig": {
      "conditionalFormatPredicateConfig": {
        "conditionalFormats": [
          {
            "condition": "this.status == 'Overdue'",
            "fieldDisplayConfiguration": {
              "backgroundColor": "#ffcccc",
              "textColor": "#cc0000"
            }
          }
        ]
      }
    }
  }]
}
```

---

### APPEND - Add to Array

**Purpose:** Append a value to an array field.

**When to use:** Building up a list based on actions.

```json
{
  "predicates": [{
    "condition": "this.addItem == true",
    "action": "APPEND",
    "actionConfig": {
      "appendPredicateConfig": {
        "appendExpression": "this.newItem"
      }
    }
  }]
}
```

---

### GEO_FENCE - Location Validation

**Purpose:** Validate that a location is within a defined boundary.

**When to use:** Ensuring field workers are at correct locations.

```json
{
  "predicates": [{
    "action": "GEO_FENCE",
    "actionConfig": {
      "geoFencePredicateConfig": {
        "centerLat": 19.0760,
        "centerLng": 72.8777,
        "radiusInMeters": 500
      }
    }
  }]
}
```

---

### FACE_MATCH - Biometric Validation

**Purpose:** Verify that captured photo matches a reference image.

**When to use:** Identity verification, attendance systems.

---

### CUSTOM_FUNCTION - Run Custom Code

**Purpose:** Execute custom JavaScript functions for complex logic.

**When to use:** Logic that doesn't fit other action types.

---

### JSON_CALC - JSON Manipulation

**Purpose:** Perform calculations on JSON structures.

**When to use:** Complex data transformations.

---

## Deprecated Action Types

The following action types are **deprecated** and should not be used in new implementations:

```
///// START DEPRECATED //////
```

| Action | Replacement |
|--------|-------------|
| `FILTER` | Use `OPTION_FILTER` instead |
| `DATE_CALC` | Use `CALC` with date functions |
| `SHOW` | Use `APPLY_ACCESS_MATRIX` with visibility |
| `MAKE_MANDATORY` | Use `APPLY_ACCESS_MATRIX` with mandatory |
| `RESTRICT_ROWS` | Use array validation constraints |

```
///// END DEPRECATED //////
```

---

## Execution Control

### skipPredicateExecutionOnClient

```json
{
  "predicates": [{
    "action": "ASYNC_CALC",
    "skipPredicateExecutionOnClient": true,
    "actionConfig": { ... }
  }]
}
```

When `true`, this predicate only runs on the server. Useful for:
- Heavy calculations that would slow the UI
- Server-side validations
- Aggregations that need database access

### skipPredicateExecutionOnServer

```json
{
  "predicates": [{
    "action": "CALC",
    "skipPredicateExecutionOnServer": true,
    "actionConfig": { ... }
  }]
}
```

When `true`, this predicate only runs on the client. Useful for:
- UI-only calculations
- Temporary display values

---

## Best Practices

### 1. Always Define Both States

For visibility predicates, handle both conditions:

```json
// Bad - field stays in last state if condition becomes false
{
  "predicates": [{
    "condition": "this.showExtra == true",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": { "accessMatrix": { "visibility": "VISIBLE" } }
  }]
}

// Good - explicitly handle both states
{
  "predicates": [{
    "condition": "this.showExtra == true",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": { "accessMatrix": { "visibility": "VISIBLE" } }
  }, {
    "condition": "this.showExtra != true",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": { "accessMatrix": { "visibility": "GONE" } }
  }]
}
```

### 2. Use formulaKeys for CALC

Always declare which fields your formula uses:

```json
{
  "title": "Total",
  "formulaKeys": ["price", "quantity", "tax"],
  "predicates": [{
    "action": "CALC",
    "actionConfig": {
      "formula": "(this.price * this.quantity) + this.tax"
    }
  }]
}
```

This ensures the formula recalculates when any input changes.

### 3. Order Predicates Logically

When a field has multiple predicates, they run in order. Put critical validations first:

```json
{
  "predicates": [
    { "action": "VALIDATE", ... },  // Validate first
    { "action": "CALC", ... },       // Then calculate
    { "action": "APPLY_ACCESS_MATRIX", ... }  // Then adjust visibility
  ]
}
```

### 4. Handle Null Values

Formulas fail on null values. Add protection:

```json
{
  "formula": "(this.price || 0) * (this.quantity || 0)"
}
```

### 5. Keep Conditions Simple

Complex conditions are hard to debug. Split into multiple predicates if needed:

```json
// Hard to debug
{
  "condition": "(this.type == 'A' && this.status == 'Active') || (this.type == 'B' && this.level > 5)"
}

// Easier to understand
{
  "predicates": [
    {
      "condition": "this.type == 'A' && this.status == 'Active'",
      "action": "..."
    },
    {
      "condition": "this.type == 'B' && this.level > 5",
      "action": "..."
    }
  ]
}
```

---

## Debugging Predicates

### Predicate Not Running?

1. **Check dependentKeys** - Is this field listed in another field's `dependentKeys`?
2. **Check formulaKeys** - For CALC, are the source fields in `formulaKeys`?
3. **Check condition syntax** - Any typos or JavaScript errors?
4. **Check execution flags** - Is `skipPredicateExecutionOnClient` set?

### Wrong Result?

1. **Log intermediate values** - Temporarily add a CALC that outputs the condition result
2. **Simplify** - Reduce to minimal condition, add back complexity
3. **Check data types** - `"5"` (string) vs `5` (number)
4. **Check null handling** - Is any field null when you expect a value?

### Infinite Loop?

If Field A's predicate affects Field B, and Field B's predicate affects Field A, you can create a loop:

```
A changes → B's predicate runs → B changes → A's predicate runs → A changes → ...
```

The system usually has loop detection, but avoid circular dependencies in design.

---

## Quick Reference

| Action | Purpose | Key Config |
|--------|---------|------------|
| `CALC` | Compute value | `formula` |
| `OPTION_FILTER` | Filter dropdown | `field` |
| `APPLY_ACCESS_MATRIX` | Change visibility/access | `accessMatrix` |
| `VALIDATE` | Show error | `errorMessage` |
| `COPY` | Copy from field | `field` |
| `ASYNC_CALC` | Aggregate from form | `formSchemaIdentifier`, `operation` |
| `CONDITIONAL_FORMAT` | Change appearance | `conditionalFormats` |
| `APPEND` | Add to array | `appendExpression` |
| `GEO_FENCE` | Location validation | `geoFencePredicateConfig` |

---

## Related Documentation

- **[Schema Properties](schema-properties.md)** - Field definitions and access matrix details
- **[Master Data](master-data.md)** - How OPTION_FILTER works with external data
- **[Visibility & Access](visibility-access.md)** - Deep dive into access control
- **[Recipes: Cascading Dropdowns](../recipes/cascading-dropdown.md)** - Practical example

