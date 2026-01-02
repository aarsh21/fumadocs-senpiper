# Localization

## Multi-Language Support

Forms can display in multiple languages. The system supports:
- Field titles/labels
- Hint text
- Dropdown option labels
- Validation messages
- Button text

All without changing the underlying schema structure or stored data.

---

## How Localization Works

Each field can have a `localisationMap` that provides translations:

```json
{
  "title": "State",
  "type": "string",
  "description": "string_list",
  "localisationMap": {
    "Hindi": {
      "title": "राज्य"
    },
    "Odia": {
      "title": "ରାଜ୍ୟ"
    }
  }
}
```

**The pattern:**
1. Default values are in the main properties (`title`, `hint`, etc.)
2. `localisationMap` overrides those for specific languages
3. Runtime selects the appropriate language based on user preference

---

## Localization Structure

### Field Title

```json
{
  "title": "Customer Name",
  "localisationMap": {
    "Hindi": {
      "title": "ग्राहक का नाम"
    },
    "Tamil": {
      "title": "வாடிக்கையாளர் பெயர்"
    }
  }
}
```

### Field Hint

```json
{
  "title": "Phone Number",
  "hint": "Enter your 10-digit mobile number",
  "localisationMap": {
    "Hindi": {
      "title": "फ़ोन नंबर",
      "hint": "अपना 10 अंकों का मोबाइल नंबर दर्ज करें"
    }
  }
}
```

### Enum/Option Labels

For dropdowns and selection fields, translate the option labels separately:

```json
{
  "title": "Gender",
  "type": "string",
  "description": "string_list",
  "enum": ["Male", "Female", "Other"],
  "localisationMap": {
    "Hindi": {
      "title": "लिंग",
      "enum": ["पुरुष", "महिला", "अन्य"]
    }
  },
  "enumListLocalisationMap": {
    "Male": {
      "Hindi": "पुरुष",
      "Odia": "ପୁରୁଷ"
    },
    "Female": {
      "Hindi": "महिला",
      "Odia": "ମହିଳା"
    },
    "Other": {
      "Hindi": "अन्य",
      "Odia": "ଅନ୍ୟ"
    }
  }
}
```

**Note:** Two approaches exist:
1. `localisationMap.{lang}.enum` - Array of translated options
2. `enumListLocalisationMap.{value}.{lang}` - Map from value to translations

The `enumListLocalisationMap` is more flexible for maintaining consistency.

---

## Complete Field Example

Here's a fully localized field from your codebase:

```json
{
  "title": "Household coverage with Electricity 100%",
  "type": "string",
  "description": "string_list",
  "layout": "radio",
  "enum": ["Yes", "No"],
  "localisationMap": {
    "Odia": {
      "title": "କେତେ ଘରେ ବିଦ୍ୟୁତ ସଂଯୋଗ ହୋଇଛି %",
      "enum": ["ହଁ", "ନା"]
    }
  },
  "enumListLocalisationMap": {
    "Yes": {
      "Odia": "ହଁ"
    },
    "No": {
      "Odia": "ନା"
    }
  }
}
```

**What happens:**
- English user sees: "Household coverage with Electricity 100%" with "Yes"/"No"
- Odia user sees: "କେତେ ଘରେ ବିଦ୍ୟୁତ ସଂଯୋଗ ହୋଇଛି %" with "ହଁ"/"ନା"

**But the stored answer is always the base value:**
```json
{
  "r1": "Yes"
}
```

Not the translated version. This keeps data consistent regardless of display language.

---

## Form-Level Language Setting

Forms can have a default language:

```json
{
  "formSetting": {
    "customLanguage": "Hindi"
  }
}
```

**Supported values:** `"Hindi"`, `"Spanish"`, `"English"`, or any language you've defined translations for.

---

## Supported Languages

The system supports any language you provide translations for. Common ones:

| Language | Code (used in maps) |
|----------|---------------------|
| English | (default, no code) |
| Hindi | `"Hindi"` |
| Odia | `"Odia"` |
| Tamil | `"Tamil"` |
| Spanish | `"Spanish"` |

Add any language by including its key in `localisationMap`.

---

## Predicate Action Config Localization

Validation messages and other predicate outputs can also be localized:

```json
{
  "predicates": [{
    "action": "VALIDATE",
    "actionConfig": {
      "errorMessage": "End date must be after start date",
      "localisationMap": {
        "Hindi": {
          "errorMessage": "समाप्ति तिथि प्रारंभ तिथि के बाद होनी चाहिए"
        }
      }
    }
  }]
}
```

---

## Button and Display Configuration

Field display configurations can also be localized:

```json
{
  "titleDisplayConfiguration": {
    "buttonConfiguration": {
      "localisationMap": {
        "Hindi": {
          "text": "सबमिट करें"
        }
      }
    }
  }
}
```

---

## How Language Selection Works

The runtime determines which language to use:

1. **User preference** - User's selected language in their profile
2. **Form setting** - `formSetting.customLanguage`
3. **Default** - Fall back to English (base values)

**Resolution order:**
```
User preference → Form setting → Default
```

If a translation is missing for the selected language, it falls back to the default (unlocalised) value.

---

## Best Practices

### 1. Always Have a Default

Never rely solely on localisationMap. The base properties are the fallback:

```json
{
  "title": "Name",  // Always have this
  "localisationMap": {
    "Hindi": { "title": "नाम" }
  }
}
```

### 2. Use Consistent Language Keys

Pick language keys and use them consistently:

```
✓ "Hindi" everywhere
✗ "Hindi" in one place, "hindi" in another, "HI" in a third
```

### 3. Keep Translations with the Field

Don't split translations into separate files. Keep them in the schema for:
- Single source of truth
- Easier maintenance
- No sync issues

### 4. Test with Real Languages

Translated text may be longer or shorter:
- German: Often longer than English
- Chinese: Often shorter

Test that your UI handles varying text lengths.

### 5. Store Values in Base Language

Always store the **base value**, not the translated value:

```json
// Correct - stores base value
{ "gender": "Male" }

// Wrong - stores translated value (will break filters, reports)
{ "gender": "पुरुष" }
```

### 6. Handle RTL Languages

For right-to-left languages (Arabic, Hebrew):
- UI layout may need to flip
- This is typically handled by the runtime, not the schema

---

## Localization in Master Data

When using master data with localization:

1. **Master data has base values**
2. **Form field has translations for column display names**
3. **Selected value is always base value**

```json
{
  "title": "State",
  "masterId": "location-master",
  "columnKey": "state",
  "localisationMap": {
    "Hindi": {
      "title": "राज्य"
    }
  }
}
```

The master data values themselves ("Maharashtra", "Gujarat") remain as stored. To display localized state names, you'd need the master data itself to have translations.

---

## Complete Localized Form Example

```json
{
  "title": "Customer Survey",
  "type": "object",
  "properties": {
    "name": {
      "title": "Full Name",
      "type": "string",
      "description": "textfield",
      "hint": "Enter your full name",
      "localisationMap": {
        "Hindi": {
          "title": "पूरा नाम",
          "hint": "अपना पूरा नाम दर्ज करें"
        }
      }
    },
    "satisfaction": {
      "title": "How satisfied are you?",
      "type": "string",
      "description": "string_list",
      "enum": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      "localisationMap": {
        "Hindi": {
          "title": "आप कितने संतुष्ट हैं?",
          "enum": ["बहुत संतुष्ट", "संतुष्ट", "तटस्थ", "असंतुष्ट"]
        }
      },
      "enumListLocalisationMap": {
        "Very Satisfied": { "Hindi": "बहुत संतुष्ट" },
        "Satisfied": { "Hindi": "संतुष्ट" },
        "Neutral": { "Hindi": "तटस्थ" },
        "Dissatisfied": { "Hindi": "असंतुष्ट" }
      }
    },
    "comments": {
      "title": "Additional Comments",
      "type": "string",
      "description": "richtext",
      "localisationMap": {
        "Hindi": {
          "title": "अतिरिक्त टिप्पणियाँ"
        }
      }
    }
  }
}
```

---

## Quick Reference

```json
{
  "title": "English Title",
  "hint": "English hint text",
  "enum": ["Option A", "Option B"],
  
  "localisationMap": {
    "LanguageName": {
      "title": "Translated Title",
      "hint": "Translated hint",
      "enum": ["Translated A", "Translated B"]
    }
  },
  
  "enumListLocalisationMap": {
    "Option A": {
      "LanguageName": "Translated A"
    },
    "Option B": {
      "LanguageName": "Translated B"
    }
  }
}
```

---

## Next Steps

- **[Field Types](field-types.md)** - Fields that support localization
- **[Visibility & Access](visibility-access.md)** - Access control per language
- **[Form Structure](form-structure.md)** - Where localization fits

