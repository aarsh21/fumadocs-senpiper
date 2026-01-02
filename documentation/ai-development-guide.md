# AI-Driven Development Guide

This document outlines the documentation-first approach for enabling AI-driven development of the V2 runtime engine with minimal human developers.

---

## Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION AS SOURCE OF TRUTH              │
│                                                                  │
│  Schema Spec → Behavior Spec → Visual Spec → Test Spec → Code  │
│       ↓             ↓              ↓            ↓          ↓    │
│   (exists)      (partial)       (missing)   (missing)   (AI)    │
└─────────────────────────────────────────────────────────────────┘
```

**Principle:** If it's not documented, AI can't build it correctly.

---

## Required Documentation Layers

### Layer 1: Schema Specification ✅ COMPLETE

**Location:** `documentation/evolution/proposed-schema-v2.md`

**What it defines:**
- Data structures (fields, pages, logic)
- Type definitions
- Relationships between entities

**AI can use this to:**
- Generate Kotlin data classes ✅ (done)
- Generate parsers ✅ (done)
- Generate TypeScript types
- Generate validation logic

---

### Layer 2: Behavior Specification ⚠️ PARTIAL

**Location:** `documentation/behavior/` (to be created)

**What it needs:**

#### 2.1 State Machines

Every interactive component needs a state machine definition:

```yaml
# documentation/behavior/components/text-field.state.yaml
name: TextField
states:
  - empty
  - focused
  - filled
  - validating
  - valid
  - invalid
  - disabled
  - readOnly

transitions:
  - from: empty
    to: focused
    trigger: onFocus
    
  - from: focused
    to: filled
    trigger: onInput
    condition: "value.length > 0"
    
  - from: filled
    to: validating
    trigger: onBlur
    action: runValidation()
    
  - from: validating
    to: valid
    trigger: validationComplete
    condition: "errors.length == 0"
    
  - from: validating
    to: invalid
    trigger: validationComplete
    condition: "errors.length > 0"
```

#### 2.2 Behavior Rules

```yaml
# documentation/behavior/rules/visibility-cascade.yaml
name: VisibilityCascade
description: When parent becomes invisible, all children become invisible

rules:
  - when: parent.visibility == "GONE"
    then:
      - set: children.*.visibility = "GONE"
      - set: children.*.value = null  # Clear values
      
  - when: parent.visibility == "INVISIBLE"
    then:
      - set: children.*.visibility = "INVISIBLE"
      - keep: children.*.value  # Preserve values

edge_cases:
  - scenario: Parent toggles visible → invisible → visible
    expectation: Children values restored if not cleared
    
  - scenario: Child has explicit visibility rule
    expectation: Child rule takes precedence? Or parent? (NEEDS DECISION)
```

#### 2.3 Event Flows

```yaml
# documentation/behavior/flows/cascading-dropdown.yaml
name: CascadingDropdown
description: State → District → Block selection flow

flow:
  1_initial:
    state: {state: null, district: null, block: null}
    district_options: []
    block_options: []
    
  2_select_state:
    trigger: user selects "Maharashtra"
    state: {state: "Maharashtra", district: null, block: null}
    actions:
      - clear: district, block
      - fetch: districts WHERE state = "Maharashtra"
    district_options: ["Mumbai", "Pune", "Nagpur", ...]
    block_options: []
    
  3_select_district:
    trigger: user selects "Pune"
    state: {state: "Maharashtra", district: "Pune", block: null}
    actions:
      - clear: block
      - fetch: blocks WHERE district = "Pune"
    block_options: ["Haveli", "Mulshi", ...]
    
  4_change_state:
    trigger: user changes state to "Gujarat"
    state: {state: "Gujarat", district: null, block: null}
    actions:
      - clear: district, block
      - fetch: districts WHERE state = "Gujarat"
    expectation: Previous district/block selections cleared
```

**AI can use this to:**
- Generate state management code
- Generate event handlers
- Write comprehensive tests
- Handle edge cases correctly

---

### Layer 3: Visual Design Specification ❌ MISSING

**Location:** `documentation/design/` (to be created)

#### 3.1 Design Tokens

```yaml
# documentation/design/tokens.yaml
colors:
  primary:
    default: "#0066FF"
    light: "#E6F0FF"
    dark: "#0052CC"
  
  semantic:
    error: "#DC3545"
    warning: "#FFC107"
    success: "#28A745"
    info: "#17A2B8"
  
  neutral:
    background: "#FFFFFF"
    surface: "#F8F9FA"
    border: "#DEE2E6"
    text:
      primary: "#212529"
      secondary: "#6C757D"
      disabled: "#ADB5BD"

spacing:
  unit: 4  # Base unit in pixels
  scale:
    xs: 4
    sm: 8
    md: 16
    lg: 24
    xl: 32
    xxl: 48

typography:
  fontFamily:
    primary: "Inter, system-ui, sans-serif"
    mono: "JetBrains Mono, monospace"
  
  scale:
    h1: { size: 32, weight: 700, lineHeight: 1.2 }
    h2: { size: 24, weight: 600, lineHeight: 1.3 }
    h3: { size: 20, weight: 600, lineHeight: 1.4 }
    body: { size: 16, weight: 400, lineHeight: 1.5 }
    label: { size: 14, weight: 500, lineHeight: 1.4 }
    caption: { size: 12, weight: 400, lineHeight: 1.4 }

borderRadius:
  sm: 4
  md: 8
  lg: 12
  full: 9999

shadows:
  sm: "0 1px 2px rgba(0,0,0,0.05)"
  md: "0 4px 6px rgba(0,0,0,0.1)"
  lg: "0 10px 15px rgba(0,0,0,0.1)"
```

#### 3.2 Component Visual Specs

```yaml
# documentation/design/components/text-field.visual.yaml
name: TextField
description: Single-line text input

anatomy:
  - container (outer wrapper)
  - label (above input)
  - inputWrapper (border + background)
  - input (actual input element)
  - helperText (below input)
  - errorText (replaces helper when invalid)
  - prefix (optional, left side)
  - suffix (optional, right side)

variants:
  size:
    sm: { height: 32, fontSize: 14, padding: "6px 12px" }
    md: { height: 40, fontSize: 16, padding: "8px 16px" }
    lg: { height: 48, fontSize: 18, padding: "12px 16px" }

states:
  default:
    borderColor: colors.neutral.border
    backgroundColor: colors.neutral.background
    
  focused:
    borderColor: colors.primary.default
    boxShadow: "0 0 0 3px {colors.primary.light}"
    
  filled:
    borderColor: colors.neutral.border
    backgroundColor: colors.neutral.background
    
  error:
    borderColor: colors.semantic.error
    helperTextColor: colors.semantic.error
    
  disabled:
    backgroundColor: colors.neutral.surface
    textColor: colors.neutral.text.disabled
    cursor: not-allowed

spacing:
  labelToInput: spacing.xs  # 4px
  inputToHelper: spacing.xs  # 4px
  containerMargin: spacing.md  # 16px bottom

animation:
  focusTransition: "border-color 150ms ease, box-shadow 150ms ease"
  errorShake: "shake 300ms ease"
```

#### 3.3 Component Gallery (Visual Reference)

**Option A: Figma Export**
- Export Figma frames as PNG/SVG
- Store in `documentation/design/screenshots/`
- Reference in component specs

**Option B: Storybook-style Docs**
- Create HTML/Markdown visual examples
- AI can reference these for pixel-matching

**Option C: Design-to-Code Tool**
- Use Figma plugins to export design tokens
- Tools: Figma Tokens, Style Dictionary

---

### Layer 4: Test Specification ❌ MISSING

**Location:** `documentation/tests/` (to be created)

#### 4.1 Component Test Cases

```yaml
# documentation/tests/components/text-field.test.yaml
name: TextField
description: Test cases for text input component

unit_tests:
  - name: renders with label
    input:
      label: "Email"
      placeholder: "Enter email"
    expect:
      - label text is "Email"
      - input has placeholder "Enter email"
      - input is empty
      
  - name: shows error state
    input:
      label: "Email"
      value: "invalid"
      error: "Invalid email format"
    expect:
      - input has error border color
      - error message is visible
      - error message text is "Invalid email format"
      
  - name: handles maxLength
    input:
      maxLength: 10
      value: "12345678901234"
    expect:
      - input value is truncated to "1234567890"
      
  - name: respects readOnly
    input:
      readOnly: true
      value: "Fixed value"
    actions:
      - type: "new text"
    expect:
      - value remains "Fixed value"

integration_tests:
  - name: validation on blur
    input:
      validation: { pattern: "^[a-z]+$" }
    actions:
      - focus input
      - type "abc123"
      - blur input
    expect:
      - error state is shown
      - error message contains "pattern"
```

#### 4.2 Golden Tests (Visual Regression)

```yaml
# documentation/tests/golden/text-field.golden.yaml
name: TextField Golden Tests
description: Visual regression test cases

snapshots:
  - name: default-empty
    props: { label: "Name" }
    viewport: { width: 375, height: 100 }
    screenshot: "golden/text-field/default-empty.png"
    
  - name: focused
    props: { label: "Name" }
    state: focused
    screenshot: "golden/text-field/focused.png"
    
  - name: error
    props: { label: "Email", error: "Invalid" }
    screenshot: "golden/text-field/error.png"
    
  - name: disabled
    props: { label: "Locked", disabled: true }
    screenshot: "golden/text-field/disabled.png"
```

#### 4.3 Scenario Tests

```yaml
# documentation/tests/scenarios/form-submission.test.yaml
name: Form Submission Flow
description: End-to-end form filling and submission

scenario:
  given:
    schema:
      fields:
        name: { type: text, required: true }
        email: { type: email, required: true }
        age: { type: number, min: 18 }
        
  steps:
    - action: render form
      expect: 3 empty fields visible
      
    - action: click submit
      expect: 
        - validation errors on name, email
        - form not submitted
        
    - action: fill name with "John"
      expect: name field shows "John", no error
      
    - action: fill email with "invalid"
      action: blur email
      expect: email shows error "Invalid email"
      
    - action: fill email with "john@example.com"
      expect: email error cleared
      
    - action: fill age with "15"
      expect: age shows error "Must be 18 or older"
      
    - action: fill age with "25"
      expect: age error cleared
      
    - action: click submit
      expect:
        - form submitted successfully
        - payload: { name: "John", email: "john@example.com", age: 25 }
```

**AI can use this to:**
- Generate unit tests
- Generate integration tests
- Validate implementations
- Catch regressions

---

### Layer 5: API Contracts ❌ MISSING

**Location:** `documentation/api/` (to be created)

```yaml
# documentation/api/schema-api.yaml
name: Schema API
description: API for fetching and parsing schemas

endpoints:
  getSchema:
    method: GET
    path: /api/v2/forms/{formId}/schema
    response:
      success:
        status: 200
        body:
          example: |
            {
              "version": "2.0.0",
              "type": "form",
              "meta": { "id": "...", "name": "..." },
              "model": { ... },
              "ui": { ... },
              "logic": { ... }
            }
      errors:
        - status: 404
          body: { "error": "Form not found" }
        - status: 403
          body: { "error": "Access denied" }

  submitAnswer:
    method: POST
    path: /api/v2/forms/{formId}/answers
    request:
      body:
        example: |
          {
            "values": {
              "name": "John",
              "email": "john@example.com"
            }
          }
    response:
      success:
        status: 201
        body: { "id": "answer-uuid", "status": "submitted" }
      errors:
        - status: 400
          body: { "errors": [{ "field": "email", "message": "..." }] }
```

---

## Documentation Structure

```
documentation/
├── evolution/
│   ├── proposed-schema-v2.md       ✅ EXISTS
│   └── current-limitations.md      ✅ EXISTS
│
├── behavior/                        ❌ CREATE
│   ├── state-machines/
│   │   ├── text-field.state.yaml
│   │   ├── select-field.state.yaml
│   │   └── form.state.yaml
│   ├── rules/
│   │   ├── visibility-cascade.yaml
│   │   ├── validation-rules.yaml
│   │   └── computed-fields.yaml
│   └── flows/
│       ├── cascading-dropdown.yaml
│       ├── form-submission.yaml
│       └── multi-page-navigation.yaml
│
├── design/                          ❌ CREATE
│   ├── tokens.yaml                  # Colors, spacing, typography
│   ├── components/
│   │   ├── text-field.visual.yaml
│   │   ├── select-field.visual.yaml
│   │   └── ...
│   └── screenshots/                 # Golden images
│       ├── text-field/
│       └── ...
│
├── tests/                           ❌ CREATE
│   ├── unit/
│   │   ├── text-field.test.yaml
│   │   └── ...
│   ├── integration/
│   │   └── form-validation.test.yaml
│   ├── scenarios/
│   │   └── form-submission.test.yaml
│   └── golden/
│       └── visual-regression.yaml
│
├── api/                             ❌ CREATE
│   ├── schema-api.yaml
│   ├── submission-api.yaml
│   └── master-data-api.yaml
│
└── ai-development-guide.md          ← THIS FILE
```

---

## AI Development Workflow

### Phase 1: Documentation Sprint (Human + AI)

```
Week 1-2: Complete Behavior Specs
├── Define state machines for all 15+ field types
├── Document visibility/validation cascading rules
├── Document all edge cases with expected behavior
└── AI validates specs for completeness

Week 2-3: Complete Design Specs
├── Export design tokens from Figma
├── Define component visual specs
├── Create golden screenshots
└── AI generates design token code

Week 3-4: Complete Test Specs
├── Write test cases for all components
├── Define integration test scenarios
├── Create golden test images
└── AI generates test files
```

### Phase 2: AI-Driven Implementation

```
For each component:
1. AI reads: behavior spec + visual spec + test spec
2. AI generates: Kotlin/Compose implementation
3. AI generates: Unit tests from test spec
4. Human reviews: Code + test results
5. Iterate until tests pass

Example prompt for AI:
"Implement TextField component based on:
- State machine: documentation/behavior/state-machines/text-field.state.yaml
- Visual spec: documentation/design/components/text-field.visual.yaml
- Test cases: documentation/tests/unit/text-field.test.yaml

Generate:
1. TextField.kt (Compose Multiplatform)
2. TextFieldTest.kt (unit tests)
3. Ensure all test cases pass"
```

### Phase 3: Integration (AI + Human Review)

```
1. AI integrates components into form renderer
2. AI runs scenario tests
3. Human reviews integration points
4. AI fixes based on test failures
```

---

## Tools to Consider

### For Design Documentation

| Tool | Purpose | AI-Friendly? |
|------|---------|--------------|
| **Figma + Tokens Studio** | Design tokens export | ✅ Exports JSON/YAML |
| **Storybook** | Component gallery | ✅ Generates docs |
| **Style Dictionary** | Token transformation | ✅ Generates code |
| **Chromatic** | Visual regression | ✅ Captures snapshots |

### For Behavior Documentation

| Tool | Purpose | AI-Friendly? |
|------|---------|--------------|
| **XState** | State machine visualizer | ✅ JSON/YAML format |
| **Mermaid** | State diagrams | ✅ Text-based |
| **Cucumber/Gherkin** | BDD scenarios | ✅ Structured text |

### For Test Documentation

| Tool | Purpose | AI-Friendly? |
|------|---------|--------------|
| **YAML test specs** | Structured test cases | ✅ Parseable |
| **Screenshot tests** | Golden images | ✅ Comparable |
| **OpenAPI/AsyncAPI** | API contracts | ✅ Standard format |

---

## Minimum Viable Documentation (MVP)

If you want to start AI development ASAP, prioritize:

### Must Have (Week 1)

1. **Design Tokens** - Colors, spacing, typography in YAML
2. **TextField Behavior** - State machine + edge cases
3. **TextField Visual** - Component spec with states
4. **TextField Tests** - 10-15 test cases

This lets AI build the first component end-to-end.

### Should Have (Week 2-3)

5. **SelectField** specs (all 3 layers)
6. **NumberField** specs (all 3 layers)
7. **Form-level** state machine
8. **Validation rules** document

### Nice to Have (Week 4+)

9. All remaining field types
10. Golden screenshots
11. API contracts
12. Integration scenarios

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Documentation Coverage** | 100% of field types | Checklist in docs |
| **AI Success Rate** | 80% first-pass correct | Code review pass rate |
| **Test Coverage** | 90% | Generated tests passing |
| **Human Review Time** | < 30 min per component | Time tracking |
| **Iteration Count** | < 3 per component | Review cycles |

---

## Next Steps

1. **Create `documentation/design/tokens.yaml`** - Start with design tokens
2. **Create `documentation/behavior/state-machines/`** - Start with TextField
3. **Create `documentation/tests/unit/`** - Start with TextField tests
4. **Pilot with AI** - Build TextField using docs, measure success
5. **Iterate on docs** - Fill gaps discovered during pilot
6. **Scale to all components** - Apply learnings

---

## FAQ

**Q: Can AI create Figma designs?**
A: Not directly, but AI can:
- Generate design token files that Figma can import
- Create HTML/CSS prototypes for reference
- Describe component specs that a designer can implement

**Q: Do we need a designer?**
A: Ideally yes, for:
- Initial design system creation
- Visual polish and consistency
- User testing feedback

But you can start with:
- Existing design systems (Material Design, etc.)
- AI-generated specs based on reference apps
- Iterative refinement

**Q: How detailed should test specs be?**
A: Detailed enough that AI can generate passing tests without ambiguity. If AI generates wrong tests, the spec needs more detail.

**Q: What if AI generates wrong code?**
A: The test specs catch it. Fix the spec or the code based on which is wrong.








