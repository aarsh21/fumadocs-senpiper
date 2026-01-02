# Form Structure

## Understanding the Foundation

Before we dive into specific features like predicates or master data, we need to understand the fundamental structure that everything else builds upon. Think of this as understanding the foundation of a house before discussing the plumbing or electrical systems.

---

## The Two-Level Architecture

Every form in our system has two distinct levels:

```
┌─────────────────────────────────────────────────────────────┐
│                     FormSchema                               │
│  (The Container - metadata, settings, relationships)        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   SchemaProperty                       │  │
│  │  (The Content - actual field definitions)              │  │
│  │                                                        │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│  │   │ Field 1 │  │ Field 2 │  │ Field 3 │  ...         │  │
│  │   └─────────┘  └─────────┘  └─────────┘              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Why two levels?**

The separation exists because forms need two types of information:
1. **Identity & Behavior** - Who owns this form? What workflow does it follow? Can it be deleted?
2. **Content & Structure** - What fields exist? What are their types? How do they validate?

Mixing these would create an unmanageable blob. By separating them, we can:
- Change form settings without touching field definitions
- Reuse field patterns across forms
- Apply form-level access rules independently of field-level rules

---

## FormSchema: The Container

Let's examine what FormSchema holds and why each piece matters.

### Identity Fields

```json
{
  "groupId": "3a88d200-5656-420d-a3b4-b4d756ca1729",
  "formId": "bab1ad35-c5c3-47a0-8883-dd73cf981876",
  "companyId": "05cb63b8-73e9-4b32-bf7f-bee1e7730434",
  "name": "Village Infrastructure Profile"
}
```

| Field | Purpose | Why It Matters |
|-------|---------|----------------|
| `groupId` | The workspace/organization this form belongs to | Forms are always scoped to a group. Users only see forms in groups they belong to. |
| `formId` | Unique identifier for this form | Used in URLs, API calls, and linking forms together. |
| `companyId` | The company that owns this form | For multi-tenant systems where companies share infrastructure. |
| `name` | Human-readable form name | Displayed in lists, search results, and navigation. |

**Important:** The combination of `groupId` + `formId` uniquely identifies a form. You'll see this pattern throughout the system - forms are always referenced by this pair.

### Behavior Flags

These boolean flags control fundamental form behaviors:

```json
{
  "adminOnly": false,
  "isPublic": false,
  "master": false,
  "linkableOnly": false,
  "disableDelete": true,
  "updatable": true,
  "chatDisabled": false,
  "hidden": false
}
```

Let me explain each with real scenarios:

#### `adminOnly`
When `true`, only admins can fill this form. Regular users can view submitted answers but cannot create new ones.

**Use case:** A "Project Configuration" form that should only be filled by project managers, but team members need to see the configuration.

#### `master`
When `true`, this form serves as a data source for other forms. Its answers become dropdown options elsewhere.

**Use case:** A "Location Master" form containing State/District/Block data. Other forms reference this for location dropdowns instead of hardcoding values.

#### `linkableOnly`
When `true`, this form cannot be filled standalone - it must be linked to another form.

**Use case:** A "Follow-up Visit" form that only makes sense in context of an initial "Patient Registration" form.

#### `disableDelete`
When `true`, users cannot delete submitted answers. This is critical for audit trails.

**Use case:** Financial transaction forms, compliance records, or any form where historical data must be preserved.

#### `updatable`
When `true`, users can edit their submitted answers. When `false`, submissions are final.

**Use case:** A survey form might be `updatable: true` (users can correct mistakes), while an exam form might be `updatable: false` (no changes after submission).

### Access Matrices

Forms have two separate access configurations:

```json
{
  "initAccessMatrices": [
    {
      "roles": ["USER", "ADMIN"],
      "visibility": "VISIBLE",
      "mandatory": true
    }
  ],
  "updateAccessMatrices": [
    {
      "roles": ["ADMIN"],
      "visibility": "VISIBLE",
      "readOnly": false
    }
  ]
}
```

**Why two?**

Because access requirements often differ between creating and editing:
- **Creation:** A field might be mandatory (user must fill it)
- **Editing:** The same field might become read-only (can't change after submission)

Think of a "Customer ID" field:
- During creation: Auto-generated, read-only
- During editing: Still read-only (you can never change a customer ID)

Or an "Approval Status" field:
- During creation: Hidden (status doesn't exist yet)
- During editing: Visible but read-only for users, editable for admins

### Form Relationships

Forms don't exist in isolation. They connect to each other:

```json
{
  "parentSchemaIdentifier": {
    "groupId": "...",
    "formSchemaId": "...",
    "formName": "Parent Registration"
  },
  "childSchemaIdentifiers": [
    {
      "groupId": "...",
      "formSchemaId": "...",
      "formName": "Follow-up Visit"
    }
  ],
  "linkableFormDetails": [
    {
      "groupId": "...",
      "formId": "...",
      "numberOfLinksAllowed": "MULTIPLE",
      "linkingBy": "ALL"
    }
  ]
}
```

**Parent-Child Relationships:**
- A "Household Survey" (parent) might have multiple "Individual Member" forms (children)
- Children inherit context from parents
- Deleting a parent might cascade to children (depending on configuration)

**Linkable Forms:**
- `numberOfLinksAllowed`: `"SINGLE"` or `"MULTIPLE"` - can one answer link to many, or just one?
- `linkingBy`: `"ALL"`, `"SELF"`, `"ADMIN"`, `"ASSIGNEE"` - who can create links?

### Form Settings

The `formSetting` object contains dozens of configuration options. Here are the most important:

```json
{
  "formSetting": {
    "useAsPrefilledData": false,
    "showUnansweredFields": true,
    "generateAnswerOnServer": false,
    "disableNotificationForAnswerSubmission": false,
    "renderLayoutConfigOnWeb": true,
    "customLanguage": "Hindi"
  }
}
```

| Setting | What It Does |
|---------|--------------|
| `useAsPrefilledData` | Use this form's answers to prefill other forms |
| `showUnansweredFields` | Show empty fields in view mode (vs hiding them) |
| `generateAnswerOnServer` | Run answer generation logic server-side |
| `customLanguage` | Default language for this form |

---

## SchemaProperty: The Field Definition

Now we reach the heart of the system - the `schema` property inside FormSchema is itself a SchemaProperty.

### The Recursive Nature

Here's the key insight: **SchemaProperty is recursive**. A SchemaProperty can contain other SchemaProperties.

```
SchemaProperty (root - type: "object")
├── properties:
│   ├── "name": SchemaProperty (type: "string")
│   ├── "age": SchemaProperty (type: "number")
│   └── "address": SchemaProperty (type: "object")    ← Another object!
│       └── properties:
│           ├── "street": SchemaProperty (type: "string")
│           └── "city": SchemaProperty (type: "string")
```

This recursion is what allows us to build complex, nested forms.

### The Type System

Every SchemaProperty has a `type` that determines the data structure:

| Type | What It Stores | JSON Example |
|------|---------------|--------------|
| `string` | Text value | `"John Doe"` |
| `number` | Numeric value | `42` or `3.14` |
| `boolean` | True/false | `true` |
| `object` | Nested key-value pairs | `{"city": "Mumbai", "zip": "400001"}` |
| `array` | List of items | `[{"name": "Item 1"}, {"name": "Item 2"}]` |

**Critical Understanding:** The `type` determines how the **answer** is stored, not how it's displayed. Display is controlled by `description`.

### The Description System

The `description` property tells the runtime what UI component to render:

```json
{
  "title": "Customer Name",
  "type": "string",
  "description": "textfield"
}
```

Same `type: "string"` can have different descriptions:

| Description | UI Component | Use Case |
|-------------|--------------|----------|
| `textfield` | Single-line text input | Names, IDs |
| `email` | Email input with validation | Email addresses |
| `phone` | Phone input with formatting | Phone numbers |
| `string_list` | Dropdown/radio/checkbox | Selection from options |
| `richtext` | Rich text editor | Formatted content |
| `label` | Display-only text | Instructions, headings |

**Why separate `type` and `description`?**

Because storage and display are independent concerns:
- A phone number is stored as a `string` but displayed with a `phone` input
- A rating is stored as a `number` but displayed as stars
- A list selection is stored as a `string` but displayed as radio buttons

### The Properties Map

For `object` type fields, the `properties` map defines nested fields:

```json
{
  "title": "Address",
  "type": "object",
  "description": "section",
  "properties": {
    "street": {
      "title": "Street Address",
      "type": "string",
      "description": "textfield"
    },
    "city": {
      "title": "City",
      "type": "string",
      "description": "string_list",
      "enum": ["Mumbai", "Delhi", "Bangalore"]
    },
    "zip": {
      "title": "ZIP Code",
      "type": "string",
      "description": "textfield",
      "pattern": "^[0-9]{6}$"
    }
  },
  "order": ["street", "city", "zip"]
}
```

**Key points:**
- `properties` is a map from **field key** to **SchemaProperty**
- The key (e.g., `"street"`) is used in the answer object
- The `order` array controls display sequence

### The Items Property (Arrays)

For `array` type fields, `items` defines what each array element contains:

```json
{
  "title": "Family Members",
  "type": "array",
  "description": "section",
  "items": {
    "type": "object",
    "properties": {
      "name": {
        "title": "Member Name",
        "type": "string",
        "description": "textfield"
      },
      "relation": {
        "title": "Relation",
        "type": "string",
        "description": "string_list",
        "enum": ["Spouse", "Child", "Parent", "Sibling"]
      }
    }
  },
  "minRows": 1,
  "maxRows": 10
}
```

This creates a repeating section where users can add/remove family members.

**Answer structure:**
```json
{
  "familyMembers": [
    { "name": "Jane Doe", "relation": "Spouse" },
    { "name": "John Jr", "relation": "Child" }
  ]
}
```

### The Order Property

The `order` array is crucial - it determines field display sequence:

```json
{
  "properties": {
    "email": { ... },
    "name": { ... },
    "phone": { ... }
  },
  "order": ["name", "email", "phone"]
}
```

Without `order`, fields might display in any sequence (JSON objects are unordered). With `order`, we guarantee: Name → Email → Phone.

**Note:** `order` only needs to contain keys that should be displayed. Keys not in `order` are typically hidden or system-generated.

---

## Putting It All Together

Here's a complete, realistic example showing how FormSchema and SchemaProperty work together:

```json
{
  "groupId": "3a88d200-5656-420d-a3b4-b4d756ca1729",
  "formId": "bab1ad35-c5c3-47a0-8883-dd73cf981876",
  "name": "Customer Registration",
  "adminOnly": false,
  "disableDelete": false,
  "updatable": true,
  
  "schema": {
    "title": "Customer Registration",
    "type": "object",
    "description": "form",
    
    "properties": {
      "customerId": {
        "title": "Customer ID",
        "type": "string",
        "description": "textfield",
        "autoGenerate": true,
        "accessMatrix": {
          "readOnly": true,
          "visibility": "VISIBLE"
        }
      },
      
      "name": {
        "title": "Full Name",
        "type": "string",
        "description": "textfield",
        "accessMatrix": {
          "mandatory": true,
          "visibility": "VISIBLE"
        }
      },
      
      "contactInfo": {
        "title": "Contact Information",
        "type": "object",
        "description": "section",
        "properties": {
          "email": {
            "title": "Email",
            "type": "string",
            "description": "email",
            "accessMatrix": { "mandatory": true }
          },
          "phone": {
            "title": "Phone",
            "type": "string",
            "description": "phone",
            "accessMatrix": { "mandatory": true }
          }
        },
        "order": ["email", "phone"]
      },
      
      "addresses": {
        "title": "Addresses",
        "type": "array",
        "description": "section",
        "items": {
          "type": "object",
          "properties": {
            "type": {
              "title": "Address Type",
              "type": "string",
              "description": "string_list",
              "enum": ["Home", "Work", "Other"]
            },
            "line1": {
              "title": "Address Line 1",
              "type": "string",
              "description": "textfield"
            },
            "city": {
              "title": "City",
              "type": "string",
              "description": "textfield"
            }
          },
          "order": ["type", "line1", "city"]
        },
        "minRows": 1,
        "maxRows": 3
      }
    },
    
    "order": ["customerId", "name", "contactInfo", "addresses"]
  },
  
  "formSetting": {
    "showUnansweredFields": false
  }
}
```

**Resulting answer structure:**
```json
{
  "customerId": "CUST-2024-00001",
  "name": "Rajesh Kumar",
  "contactInfo": {
    "email": "rajesh@example.com",
    "phone": "+919876543210"
  },
  "addresses": [
    {
      "type": "Home",
      "line1": "123 Main Street",
      "city": "Mumbai"
    },
    {
      "type": "Work",
      "line1": "456 Office Complex",
      "city": "Mumbai"
    }
  ]
}
```

---

## Common Mistakes to Avoid

### 1. Forgetting the `order` array
Without `order`, fields display in unpredictable sequence. Always define `order` for object types.

### 2. Mismatching `type` and `description`
A `string_list` should have `type: "string"` (single select) or `type: "array"` (multi-select). Mismatches cause runtime errors.

### 3. Using keys with special characters
Field keys should be simple alphanumeric strings. Avoid spaces, dots, or brackets in keys—these conflict with the addressing system.

### 4. Deep nesting without reason
While the schema supports arbitrary nesting, deep hierarchies make forms confusing. Keep nesting to 2-3 levels maximum.

---

## Next Steps

Now that you understand the structure:
- **[Field Addressing](field-addressing.md)** - How to reference fields in predicates and formulas
- **[Field Types](field-types.md)** - Detailed guide to all 30+ field types
- **[Data Binding](data-binding.md)** - How schema maps to answers

