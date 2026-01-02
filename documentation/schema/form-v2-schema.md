# Form Schema V2 Specification

> Version: 2.0.0  
> Status: Draft  
> Last Updated: December 2024

## Overview

Form Schema V2 is a layered architecture for defining dynamic forms. It separates concerns into distinct layers, making schemas more maintainable, testable, and reusable.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SchemaV2                                  │
├─────────────────────────────────────────────────────────────────┤
│  meta: SchemaMeta        - Form identification & metadata       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌──────────────┐ ┌────────┐│
│  │  MODEL  │ │   UI   │ │  LOGIC  │ │ INTEGRATIONS │ │ ACCESS ││
│  │         │ │        │ │         │ │              │ │        ││
│  │ fields  │ │ pages  │ │computed │ │    apis      │ │ roles  ││
│  │variables│ │ layout │ │validate │ │   masters    │ │ rules  ││
│  │         │ │ theme  │ │ effects │ │              │ │        ││
│  │         │ │ fields │ │visibility│ │             │ │        ││
│  └─────────┘ └────────┘ └─────────┘ └──────────────┘ └────────┘│
│     WHAT       HOW         WHY         WHERE           WHO      │
│   (Data)    (Display)   (Behavior)  (External)    (Permissions)│
└─────────────────────────────────────────────────────────────────┘
```

## Root Schema

```json
{
  "version": "2.0.0",
  "type": "form",
  "meta": { ... },
  "model": { ... },
  "ui": { ... },
  "logic": { ... },
  "integrations": { ... },
  "access": { ... }
}
```

### Schema Types

| Type | Description |
|------|-------------|
| `form` | Standard form with fields |
| `wizard` | Multi-step form with navigation |
| `page` | Static content page |
| `dashboard` | Widget-based dashboard |

---

## 1. META Layer

Defines form identification and metadata.

```json
{
  "meta": {
    "id": "form-uuid-1234",
    "name": "Employee Registration",
    "description": "Form for registering new employees",
    "author": "admin@company.com",
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-12-07T14:22:00Z",
    "tags": ["hr", "onboarding", "employee"]
  }
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique form identifier |
| `name` | string | ✅ | Human-readable name |
| `description` | string | | Form description |
| `author` | string | | Creator identifier |
| `created` | string | | ISO 8601 creation timestamp |
| `updated` | string | | ISO 8601 update timestamp |
| `tags` | string[] | | Categorization tags |

---

## 2. MODEL Layer

Defines **WHAT** data exists in the form. Separates user input (fields) from system values (variables).

```json
{
  "model": {
    "fields": {
      "fullName": { "type": "text", "validation": { "required": true } },
      "email": { "type": "email" },
      "age": { "type": "number", "validation": { "min": 0, "max": 120 } },
      "department": { 
        "type": "select",
        "options": { "source": "static", "values": ["HR", "IT", "Finance"] },
        "multi": false
      }
    },
    "variables": {
      "formStartTime": { "type": "timestamp", "scope": "form" },
      "calculatedTotal": { "type": "number", "scope": "form" }
    }
  }
}
```

### Field Types

#### Text Fields

| Type | Description | Properties |
|------|-------------|------------|
| `text` | Single-line text | `validation` |
| `email` | Email with format validation | `validation` |
| `phone` | Phone number | `validation`, `countryCode` |
| `richtext` | Formatted text | `validation`, `format` |

```json
{
  "fullName": {
    "type": "text",
    "validation": {
      "required": true,
      "minLength": 2,
      "maxLength": 100,
      "pattern": "^[A-Za-z ]+$",
      "message": "Name must contain only letters"
    }
  }
}
```

#### Number Fields

| Type | Description | Properties |
|------|-------------|------------|
| `number` | Numeric input | `validation`, `decimals` |
| `currency` | Currency amount | `validation`, `currency`, `decimals` |
| `rating` | Star rating | `validation`, `max`, `half` |

```json
{
  "salary": {
    "type": "currency",
    "currency": "INR",
    "decimals": 2,
    "validation": { "min": 0 }
  }
}
```

#### Select Fields

| Type | Description | Properties |
|------|-------------|------------|
| `select` | Single/multi select | `options`, `multi`, `validation` |

```json
{
  "skills": {
    "type": "select",
    "multi": true,
    "options": {
      "source": "static",
      "values": ["Kotlin", "Java", "Swift", "Flutter"]
    }
  }
}
```

#### Options Configuration

| Source | Description |
|--------|-------------|
| `static` | Hardcoded values in schema |
| `master` | From master data |
| `api` | From external API |

```json
{
  "options": {
    "source": "master",
    "masterRef": "location-master",
    "column": "city",
    "filter": [
      { "field": "state", "column": "state" }
    ]
  }
}
```

#### DateTime Fields

| Type | Description | Properties |
|------|-------------|------------|
| `date` | Date only | `validation`, `format` |
| `time` | Time only | `validation`, `format` |
| `timestamp` | Date + Time | `validation`, `format`, `systemTime` |

```json
{
  "birthDate": {
    "type": "date",
    "validation": { "required": true }
  },
  "createdAt": {
    "type": "timestamp",
    "systemTime": true
  }
}
```

#### Media Fields

| Type | Description | Properties |
|------|-------------|------------|
| `file` | File upload | `accept`, `maxSize`, `multiple` |
| `location` | GPS coordinates | `validation` |
| `signature` | Digital signature | `validation` |

#### Structure Fields

| Type | Description | Properties |
|------|-------------|------------|
| `group` | Field grouping | `fields` |
| `repeater` | Repeating rows | `fields`, `min`, `max` |

```json
{
  "address": {
    "type": "group",
    "fields": {
      "street": { "type": "text" },
      "city": { "type": "text", "validation": { "required": true } },
      "pincode": { "type": "text" }
    }
  },
  "familyMembers": {
    "type": "repeater",
    "min": 0,
    "max": 5,
    "fields": {
      "name": { "type": "text", "validation": { "required": true } },
      "relation": { "type": "select", "options": { "values": ["Spouse", "Child"] } }
    }
  }
}
```

### Variables

Variables are system-managed values not submitted with the form.

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Data type |
| `scope` | string | `form` or `session` |
| `defaultValue` | any | Initial value |

```json
{
  "variables": {
    "formStartTime": {
      "type": "timestamp",
      "scope": "form"
    },
    "totalAmount": {
      "type": "number",
      "scope": "form",
      "defaultValue": 0
    }
  }
}
```

---

## 3. UI Layer

Defines **HOW** the form looks. Separates presentation from data.

```json
{
  "ui": {
    "pages": [...],
    "layout": {...},
    "theme": {...},
    "fields": {...}
  }
}
```

### Pages

Multi-page/wizard support.

```json
{
  "pages": [
    {
      "id": "personal",
      "title": "Personal Information",
      "description": "Enter your basic details",
      "fields": ["fullName", "email", "phone", "birthDate"],
      "navigation": {
        "next": { "label": "Continue" }
      }
    },
    {
      "id": "employment",
      "title": "Employment Details",
      "fields": ["department", "designation", "salary"],
      "navigation": {
        "back": { "label": "Previous" },
        "next": { "label": "Continue" }
      }
    },
    {
      "id": "review",
      "title": "Review & Submit",
      "type": "summary",
      "submit": {
        "label": "Submit Application",
        "confirm": "Are you sure you want to submit?"
      }
    }
  ]
}
```

### Field UI Configuration

```json
{
  "fields": {
    "fullName": {
      "label": "Full Name",
      "placeholder": "e.g., John Doe",
      "hint": "As it appears on your ID",
      "icon": "person"
    },
    "salary": {
      "label": "Monthly Salary",
      "prefix": "₹",
      "hint": "Before tax deductions"
    },
    "department": {
      "label": "Department",
      "layout": "radio",
      "searchable": false
    },
    "skills": {
      "label": "Skills",
      "layout": "chips"
    },
    "quantity": {
      "label": "Quantity",
      "stepper": true
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Display label |
| `placeholder` | string | Input placeholder |
| `hint` | string | Help text below field |
| `icon` | string | Icon name |
| `prefix` | string | Prefix text (e.g., ₹) |
| `suffix` | string | Suffix text (e.g., kg) |
| `layout` | string | Display variant: `dropdown`, `radio`, `checkbox`, `chips` |
| `stepper` | boolean | Show +/- buttons for numbers |
| `searchable` | boolean | Enable search in dropdowns |
| `keyboard` | string | Mobile keyboard: `text`, `email`, `number`, `phone` |
| `multiline` | boolean | Enable multiline text |
| `rows` | number | Default rows for multiline |

### Layout

```json
{
  "layout": {
    "columns": 2,
    "spacing": "comfortable",
    "fieldLayout": {
      "labelPosition": "above"
    }
  }
}
```

### Theme

```json
{
  "theme": {
    "primaryColor": "#1976D2",
    "borderRadius": "8dp",
    "fontFamily": "Inter"
  }
}
```

---

## 4. LOGIC Layer

Defines **WHY** and **WHEN** things happen. Centralizes all business rules.

```json
{
  "logic": {
    "computed": {...},
    "validations": {...},
    "effects": {...},
    "visibility": {...},
    "cascades": {...}
  }
}
```

### Computed Fields

```json
{
  "computed": {
    "totalAmount": {
      "expression": "this.quantity * this.unitPrice",
      "dependsOn": ["quantity", "unitPrice"]
    },
    "fullAddress": {
      "expression": "`${this.address.street}, ${this.address.city} - ${this.address.pincode}`",
      "dependsOn": ["address.street", "address.city", "address.pincode"]
    }
  }
}
```

### Validations

```json
{
  "validations": {
    "ageRestriction": {
      "expression": "this.age >= 18",
      "message": "You must be at least 18 years old",
      "target": "age",
      "trigger": "blur"
    },
    "dateSequence": {
      "expression": "this.endDate > this.startDate",
      "message": "End date must be after start date",
      "target": "endDate"
    }
  }
}
```

### Effects (Side Effects)

```json
{
  "effects": {
    "setDefaultDepartment": {
      "trigger": {
        "type": "change",
        "field": "role"
      },
      "condition": "this.role === 'Manager'",
      "actions": [
        { "type": "setValue", "target": "department", "value": "Management" }
      ]
    },
    "showWarning": {
      "trigger": {
        "type": "change",
        "field": "amount"
      },
      "condition": "this.amount > 100000",
      "actions": [
        { "type": "showMessage", "message": "Amount requires approval", "level": "warning" }
      ]
    }
  }
}
```

### Visibility Rules

```json
{
  "visibility": {
    "rules": {
      "spouseDetails": {
        "expression": "this.maritalStatus === 'Married'",
        "fields": ["spouseName", "spouseOccupation"]
      },
      "vehicleSection": {
        "expression": "this.hasVehicle === true",
        "fields": ["vehicleType", "vehicleNumber"]
      }
    }
  }
}
```

### Cascading Dropdowns

```json
{
  "cascades": {
    "locationCascade": {
      "chain": ["country", "state", "city"],
      "masterRef": "location-master",
      "mappings": {
        "state": { "parentColumn": "country", "valueColumn": "state" },
        "city": { "parentColumn": "state", "valueColumn": "city" }
      }
    }
  }
}
```

---

## 5. INTEGRATIONS Layer

Defines **WHERE** external data comes from.

```json
{
  "integrations": {
    "masters": {...},
    "apis": {...}
  }
}
```

### Master Data

```json
{
  "masters": {
    "location-master": {
      "id": "uuid-1234",
      "name": "Location Master",
      "type": "SEARCHABLE",
      "searchableKeys": ["country", "state", "city"],
      "caching": {
        "enabled": true,
        "ttl": 86400
      }
    },
    "product-master": {
      "id": "uuid-5678",
      "name": "Products",
      "type": "OPTION_FILTER",
      "caching": {
        "enabled": true,
        "incremental": true
      }
    }
  }
}
```

### API Definitions

```json
{
  "apis": {
    "validatePincode": {
      "url": "/api/v1/pincode/{value}",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer ${token}"
      },
      "responseMapping": {
        "city": "$.data.city",
        "state": "$.data.state"
      },
      "caching": {
        "enabled": true,
        "key": "pincode-${value}"
      }
    }
  }
}
```

---

## 6. ACCESS Layer

Defines **WHO** can do what.

```json
{
  "access": {
    "roles": [...],
    "rules": [...]
  }
}
```

### Roles

```json
{
  "roles": [
    { "id": "admin", "name": "Administrator" },
    { "id": "manager", "name": "Manager" },
    { "id": "user", "name": "Standard User" }
  ]
}
```

### Access Rules

```json
{
  "rules": [
    {
      "id": "salary-visibility",
      "roles": ["admin", "manager"],
      "fields": ["salary", "bonus"],
      "permissions": {
        "visible": true,
        "editable": true
      }
    },
    {
      "id": "salary-hidden-users",
      "roles": ["user"],
      "fields": ["salary", "bonus"],
      "permissions": {
        "visible": false
      }
    },
    {
      "id": "readonly-after-submit",
      "stages": [2, 3, 4],
      "fields": "*",
      "permissions": {
        "editable": false
      }
    }
  ]
}
```

---

## Complete Example

```json
{
  "version": "2.0.0",
  "type": "form",
  "meta": {
    "id": "employee-registration",
    "name": "Employee Registration",
    "description": "New employee onboarding form"
  },
  "model": {
    "fields": {
      "fullName": {
        "type": "text",
        "validation": { "required": true, "minLength": 2 }
      },
      "email": {
        "type": "email",
        "validation": { "required": true }
      },
      "department": {
        "type": "select",
        "options": { "values": ["HR", "IT", "Finance", "Operations"] }
      },
      "salary": {
        "type": "currency",
        "currency": "INR",
        "validation": { "min": 0 }
      },
      "joinDate": {
        "type": "date",
        "validation": { "required": true }
      }
    }
  },
  "ui": {
    "fields": {
      "fullName": {
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "hint": "As per official records"
      },
      "email": {
        "label": "Email Address",
        "keyboard": "email"
      },
      "department": {
        "label": "Department",
        "layout": "radio"
      },
      "salary": {
        "label": "Monthly Salary",
        "prefix": "₹"
      },
      "joinDate": {
        "label": "Date of Joining"
      }
    }
  },
  "logic": {
    "validations": {
      "futureJoinDate": {
        "expression": "this.joinDate >= today()",
        "message": "Join date cannot be in the past",
        "target": "joinDate"
      }
    }
  },
  "access": {
    "rules": [
      {
        "roles": ["admin"],
        "fields": ["salary"],
        "permissions": { "visible": true, "editable": true }
      },
      {
        "roles": ["user"],
        "fields": ["salary"],
        "permissions": { "visible": false }
      }
    ]
  }
}
```

---

## JSON Schema Definition

See [form-v2.schema.json](./form-v2.schema.json) for the complete JSON Schema definition.

---

## Migration from V1

See [v1-to-v2-conversion.md](./v1-to-v2-conversion.md) for detailed conversion guide.

