# email

## Purpose

Email input field with built-in email format validation.

---

## Configuration

**Data Type:** `type: "string"`

**Description:** `description: "email"`

---

## Consumed Properties

Same as [textfield](textfield.md), plus:

| Property | Type | Purpose |
|----------|------|---------|
| (inherits all textfield properties) | | |

> **Team: Please document** - Are there email-specific properties?

---

## Answer Structure

```json
{
  "email": "user@example.com"
}
```

---

## Example

```json
{
  "email": {
    "title": "Email Address",
    "type": "string",
    "description": "email",
    "hint": "We'll send confirmation to this email",
    "accessMatrix": {
      "mandatory": true
    }
  }
}
```

---

## Behavior Notes

1. **Validation** - Automatic email format validation
2. **Keyboard** - Shows email keyboard on mobile (with @ symbol)
3. **Pattern** - Can add custom pattern for stricter validation

---

## Platform Differences

> **Team: Please document any platform-specific behaviors**

