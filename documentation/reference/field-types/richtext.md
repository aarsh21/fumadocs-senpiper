# richtext

## Purpose

Multi-line text input with rich formatting support (bold, italic, lists, etc.).

---

## Configuration

**Data Type:** `type: "string"`

**Description:** `description: "richtext"`

---

## Consumed Properties

| Property | Type | Purpose |
|----------|------|---------|
| `title` | string | Field label |
| `hint` | string | Help text |
| `accessMatrix` | object | Visibility, mandatory, readOnly |
| `predicates` | array | Conditional logic |
| `localisationMap` | object | Translations |
| `maxSize` | integer | Maximum characters |
| `minSize` | integer | Minimum characters |

> **Team: Please document** - What rich text formatting options are available?

---

## Answer Structure

```json
{
  "description": "<p>This is <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul>"
}
```

> **Team: Please verify** - What HTML tags are supported?

---

## Example

```json
{
  "description": {
    "title": "Description",
    "type": "string",
    "description": "richtext",
    "hint": "Provide detailed description",
    "accessMatrix": {
      "mandatory": true
    }
  }
}
```

---

## Behavior Notes

1. **Formatting toolbar** - Shows bold, italic, underline, lists, etc.
2. **HTML storage** - Stores as HTML string
3. **Sanitization** - HTML should be sanitized on display

---

## Supported Formatting

> **Team: Please document** - What formatting options are available?

| Format | Available? |
|--------|------------|
| Bold | ? |
| Italic | ? |
| Underline | ? |
| Bullet list | ? |
| Numbered list | ? |
| Links | ? |
| Images | ? |
| Tables | ? |

---

## Platform Differences

> **Team: Please document any platform-specific behaviors**

