# Form Schema DSL

> A comprehensive guide to understanding and working with the Form Schema Domain Specific Language (DSL) for building dynamic, server-driven forms.

## What is Form Schema?

Form Schema is a declarative JSON-based language that defines:
- **What fields** appear in a form
- **How fields behave** (validation, visibility, calculations)
- **How fields interact** with each other (cascading dropdowns, conditional logic)
- **Who can access** what (role-based permissions)
- **Where data comes** from (master data integration)

A single schema definition renders consistently across **mobile** (Android/iOS) and **web** platforms.

---

## Quick Example

```json
{
  "title": "Customer Registration",
  "type": "object",
  "properties": {
    "name": {
      "title": "Customer Name",
      "type": "string",
      "description": "textfield",
      "accessMatrix": {
        "mandatory": true,
        "visibility": "VISIBLE"
      }
    },
    "state": {
      "title": "State",
      "type": "string",
      "description": "string_list",
      "masterId": "location-master-uuid",
      "columnKey": "state",
      "dependentKeys": ["district"]
    },
    "district": {
      "title": "District",
      "type": "string",
      "description": "string_list",
      "masterId": "location-master-uuid",
      "columnKey": "district",
      "predicates": [{
        "action": "OPTION_FILTER",
        "actionConfig": { "field": "state" }
      }]
    }
  },
  "order": ["name", "state", "district"]
}
```

This schema creates:
1. A mandatory text field for name
2. A state dropdown populated from master data
3. A district dropdown that **filters based on selected state**

---

## Documentation Structure

### Getting Started
- [Introduction](overview/introduction.md) - What, why, and core concepts

### Core Concepts
| Concept | Description |
|---------|-------------|
| [Form Structure](concepts/form-structure.md) | How FormSchema and SchemaProperty fit together |
| [Field Types](concepts/field-types.md) | 30+ field types (text, dropdown, media, sections...) |
| [Data Binding](concepts/data-binding.md) | How schema maps to answers |
| [Field Addressing](concepts/field-addressing.md) | Keys, paths, and array indexing (`$i`, `$j`, `$k`) |
| [Expressions](concepts/expressions.md) | JavaScript expressions for formulas and conditions |
| [Conditional Logic](concepts/conditional-logic.md) | Predicates that control field behavior |
| [Master Data](concepts/master-data.md) | External data sources for dropdowns |
| [Access Control](concepts/visibility-access.md) | Role-based visibility and permissions |
| [Localization](concepts/localization.md) | Multi-language support |

### Practical Recipes
- [Cascading Dropdowns](recipes/cascading-dropdown.md) - State → District → Block
- [Calculated Fields](recipes/calculated-field.md) - Auto-compute values
- [Conditional Visibility](recipes/conditional-visibility.md) - Show/hide fields
- [Repeating Sections](recipes/repeating-sections.md) - Dynamic arrays
- [Auto-Generated IDs](recipes/auto-generated-ids.md) - Sequence numbers

### Reference
- [Schema Properties](schema-properties.md) - All SchemaProperty fields
- [Field Types](reference/field-types/) - Detailed field type docs
- [Predicate Actions](reference/predicate-actions/) - All predicate action types

---

## Who Is This For?

- **Form Designers** - Understand what's possible and how to configure forms
- **Developers** - Build renderers, transformers, or extend the schema
- **Product Teams** - Evaluate capabilities for new features

---

## Schema at a Glance

```
FormSchema (root)
├── groupId, formId, name
├── schema: SchemaProperty
│   ├── type: "object"
│   ├── properties: { fieldKey → SchemaProperty }
│   └── order: [fieldKey, ...]
├── formSetting: FormSetting
├── initAccessMatrices, updateAccessMatrices
└── workflowId, linkableFormDetails, ...
```

Each **SchemaProperty** represents a field with:
- `type` → Data type (string, number, object, array, boolean)
- `description` → UI type (textfield, string_list, multimedia, section...)
- `accessMatrix` → Visibility and permissions
- `predicates` → Conditional behavior
- `masterId`, `columnKey` → Master data binding

---

## Next Steps

→ [Start with the Introduction](overview/introduction.md)

