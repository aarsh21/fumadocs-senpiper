# Property Cascading in V1

This document describes how field properties cascade from parent containers (sections, repeaters) to their children.

> **⚠️ TEAM REVIEW REQUIRED**
> 
> This document contains assumptions and open questions marked with 🔴. 
> These need to be verified against actual runtime behavior and confirmed by the team.

---

## Key Uncertainty

There are two related questions about property cascading:

### 1. Does Parent Cascade to Child?
When a parent has a property set (e.g., `readOnly: true`), and child has **no explicit setting**, does the child inherit the parent's value?

```
Parent: readOnly = true
Child:  readOnly = (not set)
Result: Is child readOnly? 🔴 UNKNOWN
```

### 2. Can Child Override Parent?
When both parent and child have explicit settings, who wins?

```
Parent: readOnly = true
Child:  readOnly = false
Result: Is child readOnly? 🔴 UNKNOWN
```

### 3. Runtime Processing Implications

If child can override parent, the client must still **evaluate every child** to check for overrides. This affects:
- Processing order (must traverse full tree)
- Performance (can't skip subtree even if parent is hidden/disabled)
- Complexity (merge logic between parent and child properties)

**Team needs to clarify:**
- Current runtime behavior on Android, iOS, Web
- Whether this behavior should be consistent across platforms
- Desired behavior for V2 schema

---

## Overview

In V1, fields can be nested inside containers:
- **Sections** (`type: "object"`, `description: "section"`)
- **Repeaters** (`type: "array"` with section items)

When a parent container has certain properties set, the question is: **do children inherit those properties?**

```
┌─────────────────────────────────────┐
│  Parent Section                     │
│  visibility: GONE                   │
│  readOnly: true                     │
│  roles: ["ADMIN"]                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Child Field                │   │
│  │  visibility: VISIBLE        │   │  ← Does parent override this?
│  │  readOnly: false            │   │  ← Does parent override this?
│  │  roles: ["USER"]            │   │  ← Does parent override this?
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Visibility Cascading

### ✅ Confirmed Behavior

**When parent has `visibility: "GONE"`, all children are hidden regardless of their own visibility settings.**

This is documented and confirmed:

```json
{
  "parentSection": {
    "type": "object",
    "description": "section",
    "accessMatrix": {
      "visibility": "GONE"
    },
    "properties": {
      "childField": {
        "accessMatrix": {
          "visibility": "VISIBLE"  // ← Ignored! Parent wins.
        }
      }
    }
  }
}
```

**Result:** `childField` is NOT visible because parent is `GONE`.

> "Think of it as: Parent visibility is a gate. If the gate is closed (GONE), nothing inside is visible."
> — From `visibility-access.md`

### Visibility Cascade Matrix

| Parent Visibility | Child Visibility | Result |
|-------------------|------------------|--------|
| `VISIBLE` | `VISIBLE` | ✅ Visible |
| `VISIBLE` | `INVISIBLE` | ❌ Hidden (takes space) |
| `VISIBLE` | `GONE` | ❌ Hidden (no space) |
| `INVISIBLE` | `VISIBLE` | 🔴 **UNKNOWN** - see Question 1 |
| `INVISIBLE` | `INVISIBLE` | 🔴 **UNKNOWN** |
| `INVISIBLE` | `GONE` | 🔴 **UNKNOWN** |
| `GONE` | `VISIBLE` | ❌ Hidden (parent gate closed) |
| `GONE` | `INVISIBLE` | ❌ Hidden (parent gate closed) |
| `GONE` | `GONE` | ❌ Hidden |

---

## 🔴 Open Question 1: INVISIBLE vs GONE Cascading

**Question:** When parent has `visibility: "INVISIBLE"` (not GONE), what happens to children?

```json
{
  "parentSection": {
    "accessMatrix": { "visibility": "INVISIBLE" },
    "properties": {
      "childField": {
        "accessMatrix": { "visibility": "VISIBLE" }
      }
    }
  }
}
```

**Possible behaviors:**

| Option | Description |
|--------|-------------|
| **A. Same as GONE** | Parent INVISIBLE → children hidden |
| **B. Children remain visible** | Only the parent container is invisible, children still render |
| **C. Children inherit INVISIBLE** | Children become INVISIBLE (hidden but take space) |

**Current assumption:** Same as GONE (Option A) - but needs verification.

---

## ReadOnly Cascading

### 🔴 Open Question 2: Does readOnly Cascade?

**Question:** When parent section has `readOnly: true`, are all children read-only?

```json
{
  "parentSection": {
    "accessMatrix": { "readOnly": true },
    "properties": {
      "childField1": {
        "accessMatrix": { "readOnly": false }  // Can child override?
      },
      "childField2": {
        // No explicit readOnly - what's the behavior?
      }
    }
  }
}
```

**Possible behaviors:**

| Option | Description |
|--------|-------------|
| **A. Cascade (parent wins)** | All children are readOnly, child can't override |
| **B. Cascade with override** | Children inherit readOnly, but can explicitly override to false |
| **C. No cascade** | Each field evaluated independently |

**Current assumption:** No cascade (Option C) - each field has its own `accessMatrix`.

**Evidence:** 
- Documentation shows `readOnly` set on individual fields, not inherited
- No explicit documentation about readOnly cascading

---

## Mandatory Cascading

### 🔴 Open Question 3: Does Mandatory Cascade?

**Question:** When parent section has `mandatory: true`, are all children mandatory?

```json
{
  "parentSection": {
    "accessMatrix": { "mandatory": true },
    "properties": {
      "childField1": { },  // Is this mandatory too?
      "childField2": {
        "accessMatrix": { "mandatory": false }  // Can child override?
      }
    }
  }
}
```

**Possible behaviors:**

| Option | Description |
|--------|-------------|
| **A. All children mandatory** | Every child field must be filled |
| **B. At least one child required** | Parent is valid if at least one child has value |
| **C. No cascade** | Parent mandatory only affects parent, children independent |

**Current assumption:** No cascade (Option C) - mandatory is per-field.

**Evidence:**
- `required` property at section level lists specific required children
- No documentation about mandatory cascading

**Related:** The `required` array in sections:
```json
{
  "parentSection": {
    "type": "object",
    "required": ["childField1", "childField3"],  // Explicit list
    "properties": { ... }
  }
}
```

---

## Role-Based Access Cascading

### 🔴 Open Question 4: Do Role Restrictions Cascade?

**Question:** When parent section has `roles: ["ADMIN"]`, do children only show for ADMINs?

```json
{
  "parentSection": {
    "accessMatrix": { 
      "visibility": "VISIBLE",
      "roles": ["ADMIN"]
    },
    "properties": {
      "childField": {
        "accessMatrix": { 
          "visibility": "VISIBLE",
          "roles": ["USER"]  // Conflict with parent!
        }
      }
    }
  }
}
```

**Possible behaviors:**

| Option | Description |
|--------|-------------|
| **A. Parent wins** | Only ADMIN sees the section and all children |
| **B. Intersection** | Only roles that match BOTH parent AND child (empty set in this case) |
| **C. Child can expand** | Child with USER would show for USER too |
| **D. Child can restrict only** | Child can only further restrict, not expand |

**Current assumption:** Parent wins (Option A) - if you can't see the parent, you can't see children.

**Reasoning:** This follows the "gate" principle for visibility.

---

## Predicate-Based Property Changes

When predicates change parent properties, how does it affect children?

### Scenario: Dynamic Visibility Change

```json
{
  "parentSection": {
    "accessMatrix": { "visibility": "VISIBLE" },
    "predicates": [{
      "condition": "this.someField == 'hide'",
      "action": "APPLY_ACCESS_MATRIX",
      "actionConfig": {
        "accessMatrix": { "visibility": "GONE" }
      }
    }],
    "properties": {
      "childField": {
        "accessMatrix": { "visibility": "VISIBLE" }
      }
    }
  }
}
```

### ✅ Confirmed Behavior

When predicate changes parent to `GONE`, children become hidden too.

The "gate" principle applies dynamically:
1. Initially: Parent VISIBLE → Child VISIBLE → ✅ Child shows
2. After predicate: Parent GONE → Child VISIBLE → ❌ Child hidden

---

## Repeater (Array) Sections

### 🔴 Open Question 5: How Does Cascading Work in Repeaters?

```json
{
  "familyMembers": {
    "type": "array",
    "accessMatrix": { "visibility": "GONE" },
    "items": {
      "type": "object",
      "properties": {
        "name": { "accessMatrix": { "visibility": "VISIBLE" } }
      }
    }
  }
}
```

**Questions:**
1. If parent array is GONE, are all repeated items hidden?
2. Can individual array items have different visibility?
3. Does readOnly on the array make all items read-only?

**Assumed behavior:**
- If array is GONE → all items hidden
- If array is readOnly → all items read-only (can't add/remove rows)
- Individual item properties follow same cascading rules as regular sections

---

## Summary: Cascading Behavior Matrix

| Property | Cascades? | Parent Wins? | Child Can Override? | Confidence |
|----------|-----------|--------------|---------------------|------------|
| `visibility: GONE` | ✅ Yes | ✅ Yes | ❌ No | **Confirmed** |
| `visibility: INVISIBLE` | 🔴 Unknown | 🔴 Unknown | 🔴 Unknown | **Needs Testing** |
| `readOnly` | 🔴 Unknown | 🔴 Unknown | 🔴 Unknown | **Assumed: No** |
| `mandatory` | 🔴 Unknown | 🔴 Unknown | 🔴 Unknown | **Assumed: No** |
| `roles` | 🔴 Unknown | 🔴 Unknown | 🔴 Unknown | **Assumed: Yes** |

---

## Action Items for Team

### Must Verify

1. **Test INVISIBLE cascading** - Does parent INVISIBLE hide children?
2. **Test readOnly cascading** - Does parent readOnly make children read-only?
3. **Test mandatory cascading** - Does parent mandatory make children mandatory?
4. **Test roles cascading** - How do conflicting role restrictions resolve?
5. **Test repeater cascading** - Same questions for array sections

### Test Cases Needed

```
Test Case 1: Parent INVISIBLE, Child VISIBLE
Expected: ___________ (team to fill)

Test Case 2: Parent readOnly=true, Child readOnly=false
Expected: ___________ (team to fill)

Test Case 3: Parent mandatory=true, Child mandatory not set
Expected: ___________ (team to fill)

Test Case 4: Parent roles=[ADMIN], Child roles=[USER]
Expected: ___________ (team to fill)
```

### Recommendations

Once behaviors are confirmed, consider:

1. **Document clearly** - Update this document with confirmed behaviors
2. **Be consistent** - Ensure Android, iOS, and Web behave the same way
3. **Consider V2 design** - Decide if current behavior is desired or should change in V2

---

## References

- [Visibility & Access Control](./visibility-access.md) - Source of "gate" principle
- [Conditional Visibility](../recipes/conditional-visibility.md) - Section show/hide examples
- [Section Field Type](../reference/field-types/section.md) - Section behaviors

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2024-XX-XX | Initial | Document created with assumptions and open questions |


