# Field Addressing

## Why This Matters

Field addressing is the system for referring to fields by their location in the form. You'll use it constantly:
- In predicate conditions: `"this.state == 'Maharashtra'"`
- In formulas: `"this.price * this.quantity"`
- In option filters: `"actionConfig": { "field": "state" }`
- In dependent keys: `"dependentKeys": ["district", "city"]`

Getting addressing wrong is one of the most common sources of bugs. This chapter will make you confident with every addressing pattern.

---

## The Basics: Field Keys

Every field has a **key** - the property name in the `properties` map:

```json
{
  "properties": {
    "customerName": { "title": "Customer Name", ... },
    "customerAge": { "title": "Age", ... }
  }
}
```

Here, `customerName` and `customerAge` are the keys. These same keys appear in the answer:

```json
{
  "customerName": "John Doe",
  "customerAge": 35
}
```

**Best practices for keys:**
- Use short, meaningful names
- Use camelCase or snake_case consistently
- Avoid special characters (spaces, dots, brackets)
- Keep them stable (changing keys breaks existing answers)

---

## The `this` Keyword

In expressions, `this` refers to the current form answer object:

```javascript
// If answer is: { "price": 100, "quantity": 5 }
this.price      // → 100
this.quantity   // → 5
this.price * this.quantity  // → 500
```

**Think of `this` as the root of your answer object.** Any field key you've defined is accessible via `this.keyName`.

---

## Nested Objects: Dot Notation

When fields are nested inside sections (objects), use dots to traverse:

**Schema:**
```json
{
  "properties": {
    "customer": {
      "type": "object",
      "description": "section",
      "properties": {
        "name": { "type": "string" },
        "contact": {
          "type": "object",
          "properties": {
            "email": { "type": "string" },
            "phone": { "type": "string" }
          }
        }
      }
    }
  }
}
```

**Answer:**
```json
{
  "customer": {
    "name": "John Doe",
    "contact": {
      "email": "john@example.com",
      "phone": "+919876543210"
    }
  }
}
```

**Addressing:**
```javascript
this.customer.name           // → "John Doe"
this.customer.contact.email  // → "john@example.com"
this.customer.contact.phone  // → "+919876543210"
```

---

## Arrays: The Index System

Arrays (repeating sections) are where addressing gets interesting. Consider this schema:

```json
{
  "properties": {
    "items": {
      "type": "array",
      "description": "section",
      "items": {
        "type": "object",
        "properties": {
          "productName": { "type": "string" },
          "quantity": { "type": "number" },
          "price": { "type": "number" }
        }
      }
    }
  }
}
```

**Answer:**
```json
{
  "items": [
    { "productName": "Widget", "quantity": 2, "price": 100 },
    { "productName": "Gadget", "quantity": 1, "price": 250 },
    { "productName": "Gizmo", "quantity": 3, "price": 75 }
  ]
}
```

### Absolute Indexing

You can reference specific rows by number (0-based):

```javascript
this.items[0].productName  // → "Widget"
this.items[1].price        // → 250
this.items[2].quantity     // → 3
```

But absolute indexing is rarely useful in predicates—you usually don't know which row the user is editing.

### The `$i` Variable: Current Row Index

When a predicate runs inside an array row, `$i` represents the current row's index.

**Example: Calculate line total for each row**

```json
{
  "productName": { ... },
  "quantity": { ... },
  "price": { ... },
  "lineTotal": {
    "title": "Line Total",
    "type": "number",
    "predicates": [{
      "action": "CALC",
      "actionConfig": {
        "formula": "this.items[$i].quantity * this.items[$i].price"
      }
    }]
  }
}
```

When the user edits row 0:
- `$i` = 0
- Formula becomes: `this.items[0].quantity * this.items[0].price`
- Result: `2 * 100 = 200`

When the user edits row 1:
- `$i` = 1
- Formula becomes: `this.items[1].quantity * this.items[1].price`
- Result: `1 * 250 = 250`

**Key insight:** `$i` is replaced with the actual index at runtime. The formula is the same, but it operates on different rows depending on context.

---

## Nested Arrays: `$i`, `$j`, `$k`

When you have arrays inside arrays, use additional index variables:

```
Form
└── orders (array) ← $i
    └── items (array) ← $j
        └── variants (array) ← $k
```

**Schema example:**
```json
{
  "orders": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "orderNumber": { "type": "string" },
        "lineItems": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product": { "type": "string" },
              "sizes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "size": { "type": "string" },
                    "qty": { "type": "number" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Addressing at each level:**

```javascript
// From inside the sizes array:
this.orders[$i].orderNumber                    // Order number of current order
this.orders[$i].lineItems[$j].product          // Product of current line item
this.orders[$i].lineItems[$j].sizes[$k].size   // Size of current size entry
this.orders[$i].lineItems[$j].sizes[$k].qty    // Quantity of current size entry
```

**The pattern:**
- `$i` = Index of first-level array
- `$j` = Index of second-level array (nested inside first)
- `$k` = Index of third-level array (nested inside second)

---

## Referencing Parent Fields from Inside Arrays

A common need: inside an array, reference a field from outside the array.

**Schema:**
```json
{
  "properties": {
    "taxRate": {
      "title": "Tax Rate (%)",
      "type": "number"
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "price": { "type": "number" },
          "tax": {
            "type": "number",
            "predicates": [{
              "action": "CALC",
              "actionConfig": {
                "formula": "this.items[$i].price * (this.taxRate / 100)"
              }
            }]
          }
        }
      }
    }
  }
}
```

Notice:
- `this.items[$i].price` - References the current row's price
- `this.taxRate` - References the form-level tax rate (no index needed)

The `this` keyword always refers to the **root** answer object, so you can reach any field from anywhere.

---

## Cross-Row References

Sometimes you need to reference a different row, not the current one.

**Example: Compare current value to previous row**

```javascript
// Reference previous row
this.items[$i - 1].value

// Reference first row
this.items[0].value

// Reference last row (requires knowing length)
this.items[this.items.length - 1].value
```

**Example: Running total**

To calculate a running total where each row shows sum of all previous rows:

```javascript
// This is complex - usually done with ASYNC_CALC or custom functions
// Simple predicates can't easily loop through arrays
```

For complex cross-row calculations, consider using `ASYNC_CALC` or server-side computation.

---

## The Addressing in Different Contexts

### In Predicate Conditions

```json
{
  "predicates": [{
    "condition": "this.country == 'India' && this.amount > 10000",
    "action": "APPLY_ACCESS_MATRIX",
    "actionConfig": { ... }
  }]
}
```

The condition is a JavaScript expression. `this.country` and `this.amount` are resolved from the answer.

### In CALC Formulas

```json
{
  "predicates": [{
    "action": "CALC",
    "actionConfig": {
      "formula": "this.quantity * this.unitPrice * (1 - this.discount/100)"
    }
  }]
}
```

The formula is evaluated as JavaScript. The result is stored in the field.

### In Dependent Keys

```json
{
  "title": "State",
  "dependentKeys": ["district", "city", "pincode"]
}
```

Dependent keys are **just field keys**, not full paths. The system resolves them relative to the same level.

**For nested fields:**
```json
{
  "title": "State",
  "dependentKeys": ["address.district", "address.city"]
}
```

### In OPTION_FILTER

```json
{
  "predicates": [{
    "action": "OPTION_FILTER",
    "actionConfig": {
      "field": "state"
    }
  }]
}
```

The `field` property is a key, not a full `this.` path. The system knows to look for that field's value.

---

## Common Patterns

### Pattern 1: Cascading Location Fields

```
State → District → Block → Village
```

Each level filters based on the previous:

```json
{
  "state": {
    "dependentKeys": ["district"]
  },
  "district": {
    "predicates": [{
      "action": "OPTION_FILTER",
      "actionConfig": { "field": "state" }
    }],
    "dependentKeys": ["block"]
  },
  "block": {
    "predicates": [{
      "action": "OPTION_FILTER",
      "actionConfig": { "field": "district" }
    }],
    "dependentKeys": ["village"]
  },
  "village": {
    "predicates": [{
      "action": "OPTION_FILTER",
      "actionConfig": { "field": "block" }
    }]
  }
}
```

### Pattern 2: Calculated Composite Key

Creating a unique key from multiple fields:

```json
{
  "compositeKey": {
    "formulaKeys": ["state", "district", "block", "village"],
    "predicates": [{
      "action": "CALC",
      "actionConfig": {
        "formula": "this.state + '/' + this.district + '/' + this.block + '/' + this.village"
      }
    }]
  }
}
```

### Pattern 3: Array Row Totals

```json
{
  "items": {
    "type": "array",
    "items": {
      "properties": {
        "qty": { "type": "number" },
        "rate": { "type": "number" },
        "amount": {
          "type": "number",
          "formulaKeys": ["qty", "rate"],
          "predicates": [{
            "action": "CALC",
            "actionConfig": {
              "formula": "this.items[$i].qty * this.items[$i].rate"
            }
          }]
        }
      }
    }
  }
}
```

---

## Debugging Address Issues

When a predicate doesn't work, check:

1. **Typos in field keys** - `this.distirct` vs `this.district`

2. **Missing `$i` in arrays** - `this.items.price` should be `this.items[$i].price`

3. **Wrong nesting level** - Make sure your path matches the actual schema structure

4. **Null values** - If `this.state` is null, `this.state.toLowerCase()` will fail

5. **Array bounds** - `this.items[$i - 1]` fails when `$i` is 0

**Pro tip:** When debugging, mentally substitute actual values:
- If `$i = 2` and the answer is `{"items": [{...}, {...}, {"price": 100}]}`
- Then `this.items[$i].price` = `this.items[2].price` = `100`

---

## Quick Reference

| Pattern | Example | Use Case |
|---------|---------|----------|
| Simple field | `this.name` | Root-level field |
| Nested field | `this.address.city` | Field inside section |
| Array element | `this.items[0].name` | First row of array |
| Current row | `this.items[$i].name` | Inside array predicate |
| Nested array | `this.orders[$i].items[$j].price` | Array inside array |
| Previous row | `this.items[$i-1].value` | Compare with previous |
| Parent from child | `this.taxRate` | Form field from inside array |

---

## Next Steps

Now that you can address any field:
- **[Expressions](expressions.md)** - Full guide to JavaScript expressions
- **[Conditional Logic](conditional-logic.md)** - Using addresses in predicates
- **[Master Data](master-data.md)** - How addressing works with external data

