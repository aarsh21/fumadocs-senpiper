# rating

## Purpose

Star rating input for satisfaction scores, reviews, and ratings.

---

## Configuration

**Data Type:** `type: "number"`

**Description:** `description: "rating"`

---

## Consumed Properties

| Property | Type | Purpose |
|----------|------|---------|
| `title` | string | Field label |
| `hint` | string | Help text |
| `accessMatrix` | object | Visibility, mandatory, readOnly |
| `predicates` | array | Conditional logic |
| `localisationMap` | object | Translations |
| `maximum` | integer | Max rating (e.g., 5 for 5 stars) |

> **Team: Please document** - What other properties affect rating display?

---

## Answer Structure

```json
{
  "satisfaction": 4
}
```

Value is a number from 1 to `maximum`.

---

## Example

### 5-Star Rating
```json
{
  "satisfaction": {
    "title": "How satisfied are you?",
    "type": "number",
    "description": "rating",
    "maximum": 5,
    "accessMatrix": {
      "mandatory": true
    }
  }
}
```

### 10-Point Rating
```json
{
  "nps": {
    "title": "How likely are you to recommend us?",
    "type": "number",
    "description": "rating",
    "maximum": 10
  }
}
```

---

## Behavior Notes

1. **Interactive stars** - User taps/clicks to rate
2. **Default max** - Typically 5 if not specified
3. **Partial ratings** - Usually whole numbers only

---

## Platform Differences

> **Team: Please document any platform-specific behaviors**

