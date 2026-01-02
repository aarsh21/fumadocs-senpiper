# V1 to V2 Schema Conversion Algorithm

> Version: 1.0.0  
> Last Updated: December 2024

## Overview

This document describes the algorithm for converting Form Schema V1 to V2 format. The conversion process transforms the monolithic V1 "God Object" structure into V2's layered architecture.

## Architectural Differences

### V1 Architecture: The "God Object"

```
FormSchemaV1
├── name, formId, groupId
├── schema: SchemaPropertyV1          <- EVERYTHING in one place
│   ├── title, type, description
│   ├── properties: Map<String, SchemaPropertyV1>  <- Nested recursively
│   ├── VALIDATION: pattern, min, max, minSize, maxSize
│   ├── UI: hint, placeholder, layout, prefixText, suffixText
│   ├── LOGIC: predicates, formulaKeys, dependentKeys
│   ├── INTEGRATION: masterId, columnName, filterString
│   └── ACCESS: accessMatrix, editable, readOnly, hidden
├── initAccessMatrices
├── updateAccessMatrices
└── formSetting
```

### V2 Architecture: Layered Separation

```
SchemaV2
├── meta                    <- Form identification
├── model                   <- WHAT data exists
│   ├── fields             <- User input fields
│   └── variables          <- Computed/system values
├── ui                      <- HOW it looks
│   ├── pages              <- Multi-page support
│   ├── layout             <- Grid/spacing config
│   ├── fields             <- Field-specific UI
│   └── theme              <- Styling tokens
├── logic                   <- WHY/WHEN behaviors
│   ├── computed           <- Calculated fields
│   ├── validations        <- Cross-field rules
│   ├── effects            <- Side effects
│   ├── visibility         <- Show/hide rules
│   └── cascades           <- Cascading config
├── integrations           <- WHERE data comes from
│   ├── masters            <- Master data refs
│   └── apis               <- API definitions
└── access                  <- WHO can do what
    ├── roles              <- Role definitions
    └── rules              <- Permission rules
```

---

## Conversion Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONVERSION PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   V1 Schema  │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 1: ANALYSIS                                                     │  │
│  │ • Identify field types from 'description'                            │  │
│  │ • Detect hidden fields → potential variables                          │  │
│  │ • Find sections with pageBreak → pages                               │  │
│  │ • Analyze predicate dependencies                                      │  │
│  │ • Identify master data usage                                          │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 2: MODEL EXTRACTION                                             │  │
│  │ • Convert SchemaPropertyV1 → FieldDefinition                         │  │
│  │ • Extract validation from field properties                            │  │
│  │ • Convert hidden computed fields → variables                          │  │
│  │ • Map V1 type+description → V2 field type                            │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 3: UI EXTRACTION                                                │  │
│  │ • Extract pages from sections                                         │  │
│  │ • Convert UI properties → FieldUIConfig                              │  │
│  │ • Generate layout configuration                                       │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 4: LOGIC EXTRACTION                                             │  │
│  │ • Convert CALC predicates → computed fields                          │  │
│  │ • Convert VALIDATE predicates → validations                          │  │
│  │ • Convert SHOW/HIDE predicates → visibility rules                    │  │
│  │ • Convert OPTION_FILTER → cascades                                   │  │
│  │ • Convert SET predicates → effects                                   │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 5: INTEGRATION EXTRACTION                                       │  │
│  │ • Extract unique master data references                               │  │
│  │ • Build master definitions with caching config                        │  │
│  │ • Convert API predicates → API definitions                           │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 6: ACCESS EXTRACTION                                            │  │
│  │ • Convert initAccessMatrices → init rules                            │  │
│  │ • Convert updateAccessMatrices → update rules                        │  │
│  │ • Extract unique roles                                                │  │
│  │ • Generate field-level access rules                                   │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 7: ASSEMBLY                                                     │  │
│  │ • Combine all layers into SchemaV2                                   │  │
│  │ • Generate metadata                                                   │  │
│  │ • Validate output                                                     │  │
│  │ • Return with warnings                                                │  │
│  └──────┬───────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │   V2 Schema  │                                                           │
│  └──────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Analysis

### Input Analysis Structure

```kotlin
data class SchemaAnalysis(
    val fieldKeys: Set<String>,
    val hiddenFieldKeys: Set<String>,
    val computedFieldKeys: Set<String>,
    val masterFields: Map<String, MasterFieldInfo>,
    val predicatesByTarget: Map<String, List<PredicateV1>>,
    val hasMultiplePages: Boolean,
    val pageBreakSections: List<String>,
    val dependencies: Map<String, Set<String>>
)
```

### Analysis Algorithm

```
FUNCTION analyzeSchema(v1: FormSchemaV1) -> SchemaAnalysis:
    fieldKeys = SET()
    hiddenFieldKeys = SET()
    computedFieldKeys = SET()
    masterFields = MAP()
    predicatesByTarget = MAP()
    pageBreakSections = LIST()
    dependencies = MAP()
    
    FOR EACH (key, prop) IN v1.schema.properties:
        fieldKeys.add(key)
        
        // Check if hidden
        IF prop.accessMatrix?.visibility == "INVISIBLE":
            hiddenFieldKeys.add(key)
        
        // Check if computed
        IF prop.formulaKeys != NULL OR hasCalcPredicate(prop):
            computedFieldKeys.add(key)
        
        // Check for master data
        IF prop.masterId != NULL:
            masterFields[key] = MasterFieldInfo(
                masterId = prop.masterId,
                masterName = prop.masterName,
                columnName = prop.columnName,
                type = determineMasterType(prop)
            )
        
        // Index predicates by target
        IF prop.predicates != NULL:
            FOR EACH predicate IN prop.predicates:
                targets = predicate.targetKeys ?: [key]
                FOR EACH target IN targets:
                    predicatesByTarget[target].add(predicate)
        
        // Check for page breaks (sections)
        IF prop.description == "section" AND prop.pageBreak:
            pageBreakSections.add(key)
        
        // Build dependency graph
        IF prop.dependentKeys != NULL:
            dependencies[key] = prop.dependentKeys.toSet()
    
    RETURN SchemaAnalysis(
        fieldKeys = fieldKeys,
        hiddenFieldKeys = hiddenFieldKeys,
        computedFieldKeys = computedFieldKeys,
        masterFields = masterFields,
        predicatesByTarget = predicatesByTarget,
        hasMultiplePages = pageBreakSections.isNotEmpty(),
        pageBreakSections = pageBreakSections,
        dependencies = dependencies
    )
```

---

## Phase 2: Model Extraction

### Field Type Mapping

| V1 description | V1 type | V2 type |
|----------------|---------|---------|
| `textfield` | string | `text` |
| `email` | string | `email` |
| `phone` | string | `phone` |
| `richtext` | string | `richtext` |
| `number` | number | `number` |
| `rating` | number | `rating` |
| `string_list` | string | `select` |
| `timestamp` | string | `timestamp` |
| `date` | string | `date` |
| `time` | string | `time` |
| `multimedia` | string | `file` |
| `location` | object | `location` |
| `barcode` | string | `barcode` |
| `qrcode` | string | `qrcode` |
| `label` | string | `label` |
| `section` (type=object) | object | `group` |
| `section` (type=array) | array | `repeater` |

### Field Conversion Algorithm

```
FUNCTION convertField(key: String, prop: SchemaPropertyV1, analysis: SchemaAnalysis) -> FieldDefinition:
    
    fieldType = prop.description ?: "textfield"
    
    SWITCH fieldType:
        CASE "textfield", "email", "phone":
            RETURN TextField(
                type = mapTextType(fieldType),
                validation = extractTextValidation(prop)
            )
        
        CASE "number":
            RETURN NumberField(
                type = "number",
                decimals = extractDecimals(prop),
                validation = extractNumberValidation(prop)
            )
        
        CASE "string_list":
            RETURN SelectField(
                type = "select",
                options = extractOptions(prop, analysis),
                multi = prop.layout == "checkbox",
                validation = extractSelectValidation(prop)
            )
        
        CASE "timestamp", "date", "time":
            RETURN DateTimeField(
                type = fieldType,
                format = prop.format,
                systemTime = prop.systemTime ?: false,
                validation = extractDateValidation(prop)
            )
        
        CASE "section":
            IF prop.type == "array":
                RETURN RepeaterField(
                    type = "repeater",
                    fields = convertNestedFields(prop.items?.properties, analysis),
                    min = prop.minRows ?: 0,
                    max = prop.maxRows,
                    validation = extractRepeaterValidation(prop)
                )
            ELSE:
                RETURN GroupField(
                    type = "group",
                    fields = convertNestedFields(prop.properties, analysis)
                )
        
        CASE "multimedia":
            RETURN FileField(
                type = "file",
                accept = mapMultimediaType(prop.multimediaType),
                maxSize = prop.maxSize,
                validation = extractFileValidation(prop)
            )
        
        DEFAULT:
            RETURN TextField(
                type = "text",
                validation = extractTextValidation(prop)
            )
```

### Validation Extraction

```
FUNCTION extractTextValidation(prop: SchemaPropertyV1) -> TextValidation?:
    IF noValidationNeeded(prop):
        RETURN NULL
    
    RETURN TextValidation(
        required = prop.accessMatrix?.mandatory ?: false,
        minLength = prop.minSize,
        maxLength = prop.maxSize,
        pattern = prop.pattern,
        message = prop.validationMessage
    )

FUNCTION extractNumberValidation(prop: SchemaPropertyV1) -> NumberValidation?:
    IF noValidationNeeded(prop):
        RETURN NULL
    
    RETURN NumberValidation(
        required = prop.accessMatrix?.mandatory ?: false,
        min = prop.minimum,
        max = prop.maximum,
        message = prop.validationMessage
    )
```

### Variable Detection Algorithm

```
FUNCTION shouldBeVariable(key: String, prop: SchemaPropertyV1, analysis: SchemaAnalysis) -> Boolean:
    // Hidden + Computed = Variable
    IF key IN analysis.hiddenFieldKeys AND key IN analysis.computedFieldKeys:
        RETURN true
    
    // Hidden + System Generated = Variable
    IF key IN analysis.hiddenFieldKeys AND prop.autoGenerate:
        RETURN true
    
    // Hidden + Read-only + Has Formula = Variable
    IF key IN analysis.hiddenFieldKeys AND prop.accessMatrix?.readOnly AND prop.formulaKeys != NULL:
        RETURN true
    
    RETURN false

FUNCTION extractVariables(v1: FormSchemaV1, analysis: SchemaAnalysis) -> Map<String, VariableDefinition>:
    variables = MAP()
    
    FOR EACH (key, prop) IN v1.schema.properties:
        IF shouldBeVariable(key, prop, analysis):
            variables[key] = VariableDefinition(
                type = mapVariableType(prop),
                scope = "form",
                defaultValue = prop.defaultValue
            )
    
    RETURN variables
```

---

## Phase 3: UI Extraction

### Page Extraction Algorithm

```
FUNCTION extractPages(v1: FormSchemaV1, analysis: SchemaAnalysis) -> List<PageDefinition>:
    IF NOT analysis.hasMultiplePages:
        // Single page form
        RETURN [
            PageDefinition(
                id = "main",
                title = v1.name,
                fields = analysis.fieldKeys.toList()
            )
        ]
    
    pages = LIST()
    currentPageFields = LIST()
    currentPageIndex = 0
    
    FOR EACH key IN v1.schema.order ?: v1.schema.properties.keys:
        IF key IN analysis.pageBreakSections:
            // Save current page
            IF currentPageFields.isNotEmpty():
                pages.add(createPage(currentPageIndex, currentPageFields))
                currentPageIndex++
            
            // Start new page with section as header
            currentPageFields = LIST()
            currentPageFields.add(key)
        ELSE:
            currentPageFields.add(key)
    
    // Add final page
    IF currentPageFields.isNotEmpty():
        pages.add(createPage(currentPageIndex, currentPageFields))
    
    RETURN pages
```

### Field UI Config Extraction

```
FUNCTION extractFieldUIConfig(key: String, prop: SchemaPropertyV1) -> FieldUIConfig:
    RETURN FieldUIConfig(
        label = prop.title,
        placeholder = prop.placeholder,
        hint = prop.hint,
        prefix = prop.prefixText,
        suffix = prop.suffixText,
        layout = mapLayout(prop.layout, prop.description),
        stepper = prop.layout == "counter",
        keyboard = mapKeyboard(prop.description),
        multiline = prop.description == "richtext" OR prop.maxRows > 1
    )

FUNCTION mapLayout(v1Layout: String?, fieldType: String?) -> String?:
    IF v1Layout != NULL:
        RETURN v1Layout  // radio, checkbox, etc.
    
    IF fieldType == "string_list":
        RETURN "dropdown"  // default
    
    RETURN NULL
```

---

## Phase 4: Logic Extraction

### Predicate to Logic Mapping

| V1 Predicate Action | V2 Logic Type |
|---------------------|---------------|
| `CALC` | `computed` |
| `VALIDATE` | `validations` |
| `SHOW` | `visibility` (show) |
| `HIDE` | `visibility` (hide) |
| `SET` | `effects` (setValue) |
| `RESET` | `effects` (resetValue) |
| `OPTION_FILTER` | `cascades` |
| `APPEND` | `effects` (appendValue) |
| `API_CALL` | `effects` (apiCall) |

### Computed Field Extraction

```
FUNCTION extractComputedFields(v1: FormSchemaV1, analysis: SchemaAnalysis) -> Map<String, ComputedField>:
    computed = MAP()
    
    FOR EACH (key, predicates) IN analysis.predicatesByTarget:
        calcPredicates = predicates.filter { it.action == "CALC" }
        
        FOR EACH predicate IN calcPredicates:
            formula = predicate.actionConfig?.formula
            IF formula != NULL:
                computed[key] = ComputedField(
                    expression = convertFormula(formula),
                    dependsOn = extractDependencies(formula)
                )
    
    RETURN computed

FUNCTION convertFormula(v1Formula: String) -> String:
    // V1 uses "this.fieldName" which is compatible with V2
    // But we may need to handle some edge cases
    
    formula = v1Formula
    
    // Replace old function names with new ones
    formula = formula.replace("SUM(", "sum(")
    formula = formula.replace("AVG(", "avg(")
    formula = formula.replace("COUNT(", "count(")
    
    RETURN formula
```

### Visibility Rules Extraction

```
FUNCTION extractVisibilityRules(v1: FormSchemaV1, analysis: SchemaAnalysis) -> VisibilityRules:
    rules = MAP()
    
    FOR EACH (key, predicates) IN analysis.predicatesByTarget:
        showPredicates = predicates.filter { it.action == "SHOW" }
        hidePredicates = predicates.filter { it.action == "HIDE" }
        
        IF showPredicates.isNotEmpty():
            // Combine SHOW conditions with OR
            expression = showPredicates
                .map { convertCondition(it.condition) }
                .joinToString(" || ")
            
            rules[key] = VisibilityRule(
                expression = expression,
                defaultVisible = false
            )
        
        IF hidePredicates.isNotEmpty():
            // Combine HIDE conditions with OR, then negate
            expression = hidePredicates
                .map { convertCondition(it.condition) }
                .joinToString(" || ")
            
            rules[key] = VisibilityRule(
                expression = "!($expression)",
                defaultVisible = true
            )
    
    RETURN VisibilityRules(rules = rules)

FUNCTION convertCondition(cond: ConditionV1?) -> String:
    IF cond == NULL:
        RETURN "true"
    
    IF cond.conditions != NULL:
        // Compound condition
        logic = cond.logic ?: "AND"
        joiner = IF logic == "AND" THEN " && " ELSE " || "
        
        RETURN "(" + cond.conditions
            .map { convertCondition(it) }
            .joinToString(joiner) + ")"
    
    // Simple condition
    field = "this.${cond.sourceKey}"
    value = formatValue(cond.value)
    
    SWITCH cond.operator:
        CASE "eq", "==":    RETURN "$field === $value"
        CASE "ne", "!=":    RETURN "$field !== $value"
        CASE "gt", ">":     RETURN "$field > $value"
        CASE "gte", ">=":   RETURN "$field >= $value"
        CASE "lt", "<":     RETURN "$field < $value"
        CASE "lte", "<=":   RETURN "$field <= $value"
        CASE "contains":    RETURN "$field.includes($value)"
        CASE "empty":       RETURN "$field == null || $field === ''"
        CASE "notEmpty":    RETURN "$field != null && $field !== ''"
        DEFAULT:            RETURN "$field === $value"
```

### Cascade Extraction

```
FUNCTION extractCascades(v1: FormSchemaV1, analysis: SchemaAnalysis) -> Map<String, CascadeConfig>:
    cascades = MAP()
    
    // Group fields by master
    masterGroups = analysis.masterFields.groupBy { it.value.masterId }
    
    FOR EACH (masterId, fields) IN masterGroups:
        // Find OPTION_FILTER relationships
        chain = buildCascadeChain(fields, analysis)
        
        IF chain.size > 1:
            cascades["cascade_$masterId"] = CascadeConfig(
                chain = chain,
                masterRef = masterId,
                mappings = buildMappings(chain, fields, analysis)
            )
    
    RETURN cascades

FUNCTION buildCascadeChain(fields: List<MasterFieldInfo>, analysis: SchemaAnalysis) -> List<String>:
    // Build dependency graph and find order
    graph = MAP()
    
    FOR EACH field IN fields:
        predicates = analysis.predicatesByTarget[field.key]
        optionFilterPreds = predicates.filter { it.action == "OPTION_FILTER" }
        
        FOR EACH pred IN optionFilterPreds:
            parentField = pred.actionConfig?.field
            IF parentField != NULL:
                graph[field.key] = parentField
    
    // Topological sort to get chain order
    RETURN topologicalSort(graph)
```

---

## Phase 5: Integration Extraction

### Master Data Extraction

```
FUNCTION extractMasters(v1: FormSchemaV1, analysis: SchemaAnalysis) -> Map<String, MasterDefinition>:
    masters = MAP()
    
    FOR EACH (key, info) IN analysis.masterFields:
        masterId = info.masterId
        
        IF masterId NOT IN masters:
            masters[masterId] = MasterDefinition(
                id = masterId,
                name = info.masterName,
                type = info.type,
                searchableKeys = collectSearchableKeys(masterId, analysis),
                caching = extractCachingConfig(masterId, v1)
            )
    
    RETURN masters

FUNCTION extractCachingConfig(masterId: String, v1: FormSchemaV1) -> CachingConfig:
    // Find any field that uses this master
    FOR EACH (key, prop) IN v1.schema.properties:
        IF prop.masterId == masterId:
            RETURN CachingConfig(
                enabled = NOT (prop.enableOnlineSearchableMaster ?: false),
                incremental = TRUE,  // Default to incremental sync
                ttl = 86400  // 24 hours default
            )
    
    RETURN CachingConfig(enabled = TRUE)
```

---

## Phase 6: Access Extraction

### Access Matrix Conversion

```
FUNCTION extractAccessRules(v1: FormSchemaV1, analysis: SchemaAnalysis) -> List<AccessRule>:
    rules = LIST()
    
    // Convert initAccessMatrices
    IF v1.initAccessMatrices != NULL:
        FOR EACH matrix IN v1.initAccessMatrices:
            rules.add(convertAccessMatrix(matrix, "init"))
    
    // Convert updateAccessMatrices
    IF v1.updateAccessMatrices != NULL:
        FOR EACH matrix IN v1.updateAccessMatrices:
            rules.add(convertAccessMatrix(matrix, "update"))
    
    // Convert field-level accessMatrix
    FOR EACH (key, prop) IN v1.schema.properties:
        IF prop.accessMatrix != NULL:
            rules.add(AccessRule(
                id = "field_$key",
                fields = [key],
                permissions = Permissions(
                    visible = prop.accessMatrix.visibility != "INVISIBLE",
                    editable = NOT (prop.accessMatrix.readOnly ?: false),
                    required = prop.accessMatrix.mandatory ?: false
                )
            ))
    
    RETURN rules

FUNCTION convertAccessMatrix(matrix: AccessMatrixV1, phase: String) -> AccessRule:
    RETURN AccessRule(
        id = "${phase}_${matrix.key}",
        roles = matrix.roles,
        stages = matrix.stages,
        fields = [matrix.key],
        permissions = Permissions(
            visible = matrix.visible ?: true,
            editable = matrix.editable ?: true,
            required = matrix.mandatory ?: false
        )
    )
```

---

## Phase 7: Assembly

```
FUNCTION assembleSchema(
    v1: FormSchemaV1,
    analysis: SchemaAnalysis,
    model: ModelDefinition,
    ui: UIDefinition,
    logic: LogicDefinition,
    integrations: IntegrationsDefinition,
    access: AccessDefinition
) -> SchemaV2:
    
    RETURN SchemaV2(
        version = "2.0.0",
        type = IF analysis.hasMultiplePages THEN WIZARD ELSE FORM,
        meta = SchemaMeta(
            id = v1.formId ?: generateId(),
            name = v1.name,
            description = v1.schema.description,
            created = v1.createdOn,
            updated = v1.updatedOn
        ),
        model = model,
        ui = ui,
        logic = IF logic.hasContent() THEN logic ELSE NULL,
        integrations = IF integrations.hasContent() THEN integrations ELSE NULL,
        access = IF access.hasContent() THEN access ELSE NULL
    )
```

---

## Conversion Warnings

The conversion process may generate warnings for:

| Warning | Description |
|---------|-------------|
| `UNSUPPORTED_PREDICATE` | Predicate type not yet supported |
| `COMPLEX_FORMULA` | Formula may need manual review |
| `MISSING_MASTER` | Master data reference not found |
| `AMBIGUOUS_VISIBILITY` | Multiple conflicting visibility rules |
| `DEPRECATED_PROPERTY` | V1 property is deprecated in V2 |

---

## Example Conversion

### V1 Input

```json
{
  "formId": "employee-form",
  "name": "Employee Registration",
  "schema": {
    "type": "object",
    "properties": {
      "fullName": {
        "title": "Full Name",
        "type": "string",
        "description": "textfield",
        "hint": "As per ID",
        "accessMatrix": { "mandatory": true }
      },
      "department": {
        "title": "Department",
        "type": "string",
        "description": "string_list",
        "layout": "radio",
        "enum": ["HR", "IT", "Finance"]
      },
      "salary": {
        "title": "Salary",
        "type": "number",
        "description": "number",
        "prefixText": "₹",
        "accessMatrix": { "readOnly": true },
        "predicates": [{
          "action": "CALC",
          "actionConfig": { "formula": "this.basePay + this.bonus" }
        }]
      }
    }
  }
}
```

### V2 Output

```json
{
  "version": "2.0.0",
  "type": "form",
  "meta": {
    "id": "employee-form",
    "name": "Employee Registration"
  },
  "model": {
    "fields": {
      "fullName": {
        "type": "text",
        "validation": { "required": true }
      },
      "department": {
        "type": "select",
        "options": { "values": ["HR", "IT", "Finance"] }
      },
      "basePay": { "type": "number" },
      "bonus": { "type": "number" }
    },
    "variables": {
      "salary": { "type": "number", "scope": "form" }
    }
  },
  "ui": {
    "fields": {
      "fullName": {
        "label": "Full Name",
        "hint": "As per ID"
      },
      "department": {
        "label": "Department",
        "layout": "radio"
      },
      "salary": {
        "label": "Salary",
        "prefix": "₹"
      }
    }
  },
  "logic": {
    "computed": {
      "salary": {
        "expression": "this.basePay + this.bonus",
        "dependsOn": ["basePay", "bonus"]
      }
    }
  }
}
```

---

## Implementation Reference

See the Kotlin implementation in:
- `runtime-core/src/commonMain/kotlin/com/lowcode/runtime/core/converter/SchemaConverter.kt`
- `runtime-core/src/commonMain/kotlin/com/lowcode/runtime/core/converter/FieldConverter.kt`
- `runtime-core/src/commonMain/kotlin/com/lowcode/runtime/core/converter/UIConverter.kt`
- `runtime-core/src/commonMain/kotlin/com/lowcode/runtime/core/converter/LogicConverter.kt`

