# Recipe: Conditional Visibility

## The Problem

You need fields to appear or disappear based on user input:
- Show "Spouse Name" only if "Marital Status" is "Married"
- Show "Other Reason" text field when "Reason" dropdown is "Other"
- Show an entire section based on a checkbox

---

## Basic Show/Hide

### Single Condition

Show a field when a condition is met:

```json
{
  "maritalStatus": {
    "title": "Marital Status",
    "type": "string",
    "description": "string_list",
    "enum": ["Single", "Married", "Divorced", "Widowed"],
    "dependentKeys": ["spouseName"]
  },
  
  "spouseName": {
    "title": "Spouse Name",
    "type": "string",
    "description": "textfield",
    "accessMatrix": {
      "visibility": "GONE"
    },
    "predicates": [
      {
        "condition": "this.maritalStatus == 'Married'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": {
            "visibility": "VISIBLE",
            "mandatory": true
          }
        }
      }
    ]
  }
}
```

**Key points:**
1. Default visibility is `GONE` (hidden)
2. `dependentKeys` on the trigger field
3. Predicate shows field when condition is true

---

## Two-Way Toggle (Important!)

**Problem:** With only one predicate, the field doesn't hide when condition becomes false again.

**Solution:** Add both show AND hide predicates:

```json
{
  "spouseName": {
    "accessMatrix": {
      "visibility": "GONE"
    },
    "predicates": [
      {
        "condition": "this.maritalStatus == 'Married'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": {
            "visibility": "VISIBLE",
            "mandatory": true
          }
        }
      },
      {
        "condition": "this.maritalStatus != 'Married'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": {
            "visibility": "GONE",
            "mandatory": false
          }
        }
      }
    ]
  }
}
```

Now the field hides when marital status changes to anything other than "Married".

---

## Multiple Trigger Values

Show field for multiple selections:

```json
{
  "condition": "this.status == 'Approved' || this.status == 'Conditionally Approved'"
}
```

Or using array method:

```json
{
  "condition": "['Approved', 'Conditionally Approved', 'Under Review'].includes(this.status)"
}
```

---

## "Other" Pattern

The classic "show text field when Other is selected":

```json
{
  "reason": {
    "title": "Reason",
    "type": "string",
    "description": "string_list",
    "enum": ["Quality Issue", "Delivery Delay", "Wrong Product", "Other"],
    "dependentKeys": ["otherReason"]
  },
  
  "otherReason": {
    "title": "Please specify",
    "type": "string",
    "description": "textfield",
    "accessMatrix": {
      "visibility": "GONE"
    },
    "predicates": [
      {
        "condition": "this.reason == 'Other'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": {
            "visibility": "VISIBLE",
            "mandatory": true
          }
        }
      },
      {
        "condition": "this.reason != 'Other'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": {
            "visibility": "GONE",
            "mandatory": false
          }
        }
      }
    ]
  }
}
```

---

## Showing/Hiding Sections

Entire sections can be shown/hidden:

```json
{
  "hasVehicle": {
    "title": "Do you own a vehicle?",
    "type": "string",
    "description": "string_list",
    "layout": "radio",
    "enum": ["Yes", "No"],
    "dependentKeys": ["vehicleDetails"]
  },
  
  "vehicleDetails": {
    "title": "Vehicle Details",
    "type": "object",
    "description": "section",
    "accessMatrix": {
      "visibility": "GONE"
    },
    "predicates": [
      {
        "condition": "this.hasVehicle == 'Yes'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": { "visibility": "VISIBLE" }
        }
      },
      {
        "condition": "this.hasVehicle != 'Yes'",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": { "visibility": "GONE" }
        }
      }
    ],
    "properties": {
      "vehicleType": { ... },
      "registrationNumber": { ... },
      "purchaseYear": { ... }
    }
  }
}
```

When the section is hidden, all its children are also hidden.

---

## Boolean Checkbox Toggle

Using a boolean/checkbox to toggle visibility:

```json
{
  "sameAsBilling": {
    "title": "Shipping address same as billing?",
    "type": "boolean",
    "description": "string_list",
    "layout": "checkbox",
    "dependentKeys": ["shippingAddress"]
  },
  
  "shippingAddress": {
    "title": "Shipping Address",
    "type": "object",
    "description": "section",
    "accessMatrix": {
      "visibility": "VISIBLE"
    },
    "predicates": [
      {
        "condition": "this.sameAsBilling == true",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": { "visibility": "GONE" }
        }
      },
      {
        "condition": "this.sameAsBilling != true",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": { "visibility": "VISIBLE" }
        }
      }
    ],
    "properties": { ... }
  }
}
```

---

## Numeric Conditions

Show/hide based on numeric values:

```json
{
  "orderAmount": {
    "title": "Order Amount",
    "type": "number",
    "dependentKeys": ["approverComments", "largeOrderJustification"]
  },
  
  "largeOrderJustification": {
    "title": "Justification for Large Order",
    "type": "string",
    "description": "richtext",
    "accessMatrix": { "visibility": "GONE" },
    "predicates": [
      {
        "condition": "this.orderAmount > 100000",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": {
            "visibility": "VISIBLE",
            "mandatory": true
          }
        }
      },
      {
        "condition": "this.orderAmount <= 100000",
        "action": "APPLY_ACCESS_MATRIX",
        "actionConfig": {
          "accessMatrix": { "visibility": "GONE" }
        }
      }
    ]
  }
}
```

---

## Compound Conditions

Multiple conditions combined:

```json
{
  "condition": "this.country == 'India' && this.orderAmount > 50000"
}
```

```json
{
  "condition": "(this.role == 'Manager' || this.role == 'Director') && this.department == 'Finance'"
}
```

---

## Progressive Disclosure

Show fields step by step:

```json
{
  "step1Complete": {
    "title": "Basic Info Complete",
    "type": "boolean",
    "dependentKeys": ["step2Section"]
  },
  
  "step2Section": {
    "title": "Step 2: Additional Details",
    "type": "object",
    "description": "section",
    "accessMatrix": { "visibility": "GONE" },
    "predicates": [{
      "condition": "this.step1Complete == true",
      "action": "APPLY_ACCESS_MATRIX",
      "actionConfig": {
        "accessMatrix": { "visibility": "VISIBLE" }
      }
    }],
    "properties": {
      // Step 2 fields...
      "step2Complete": {
        "dependentKeys": ["step3Section"]
      }
    }
  },
  
  "step3Section": {
    "accessMatrix": { "visibility": "GONE" },
    "predicates": [{
      "condition": "this.step2Section.step2Complete == true",
      "action": "APPLY_ACCESS_MATRIX",
      "actionConfig": {
        "accessMatrix": { "visibility": "VISIBLE" }
      }
    }]
  }
}
```

---

## Role-Based Visibility

Different visibility for different users:

```json
{
  "costPrice": {
    "title": "Cost Price",
    "type": "number",
    "accessMatrix": {
      "visibility": "VISIBLE",
      "roles": ["ADMIN", "FINANCE"]
    }
  },
  
  "profit": {
    "title": "Profit Margin",
    "type": "number",
    "accessMatrix": {
      "visibility": "VISIBLE",
      "roles": ["ADMIN"]
    }
  }
}
```

For non-matching roles, the field is hidden by default.

---

## VISIBLE vs INVISIBLE vs GONE

| Value | Behavior |
|-------|----------|
| `VISIBLE` | Field is shown |
| `INVISIBLE` | Field is hidden but **takes up space** |
| `GONE` | Field is hidden and **removed from layout** |

**Use `INVISIBLE` when:**
- You want layout to stay consistent
- Field might flash visible briefly

**Use `GONE` when:**
- Field is irrelevant in this context
- You want to reclaim layout space

---

## Common Mistakes

### Mistake 1: Missing the "hide" predicate

```json
// Wrong - field never hides
"predicates": [{
  "condition": "this.show == true",
  "action": "APPLY_ACCESS_MATRIX",
  "actionConfig": { "accessMatrix": { "visibility": "VISIBLE" } }
}]

// Right - explicit hide condition
"predicates": [
  {
    "condition": "this.show == true",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": { "accessMatrix": { "visibility": "VISIBLE" } }
  },
  {
    "condition": "this.show != true",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": { "accessMatrix": { "visibility": "GONE" } }
  }
]
```

### Mistake 2: Forgetting `dependentKeys`

```json
// Wrong - visibility won't update
"trigger": { "title": "Trigger" },
"target": {
  "predicates": [{ "condition": "this.trigger == 'Yes'" ... }]
}

// Right - add dependentKeys
"trigger": { 
  "title": "Trigger",
  "dependentKeys": ["target"]  // This triggers re-evaluation
}
```

### Mistake 3: Making hidden field mandatory

```json
// Problematic - can't submit if field is hidden but mandatory
"accessMatrix": {
  "visibility": "GONE",
  "mandatory": true
}
```

Always set `mandatory: false` when hiding a field.

---

## Testing Visibility

When debugging:
1. Check `dependentKeys` is set on trigger field
2. Check predicate condition syntax
3. Check both show AND hide predicates exist
4. Verify mandatory is false when hidden
5. Test all possible trigger values

---

## Real Example

From your codebase - showing fields based on infrastructure availability:

```json
{
  "r1": {
    "title": "Household coverage with Electricity 100%",
    "type": "string",
    "description": "string_list",
    "layout": "radio",
    "enum": ["Yes", "No"],
    "dependentKeys": ["to_y", "to"]
  }
}
```

Fields `to_y` and `to` would have predicates that check `this.r1` value.

