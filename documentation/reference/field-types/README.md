# Field Types Reference

This section documents each field type (`description` value), its purpose, and the properties it consumes.

> **Note to Team:** Please verify the properties listed and add any missing ones.

---

## Field Type Categories

### Text Input
| Type | Description |
|------|-------------|
| [textfield](textfield.md) | Single-line text input |
| [email](email.md) | Email input with validation |
| [phone](phone.md) | Phone number input |
| [richtext](richtext.md) | Multi-line formatted text |

### Selection
| Type | Description |
|------|-------------|
| [string_list](string-list.md) | Dropdown, radio, or checkbox selection |

### Numeric
| Type | Description |
|------|-------------|
| [number](number.md) | Numeric input |
| [rating](rating.md) | Star rating |
| [progress](progress.md) | Progress indicator |

### Date & Time
| Type | Description |
|------|-------------|
| [timestamp](timestamp.md) | Date and time picker |
| [date](date.md) | Date only picker |
| [time](time.md) | Time only picker |
| [duration](duration.md) | Duration input |

### Media
| Type | Description |
|------|-------------|
| [multimedia](multimedia.md) | Image, video, audio, document upload |

### Location
| Type | Description |
|------|-------------|
| [location](location.md) | GPS location capture |
| [geofence](geofence.md) | Location with boundary validation |

### Scanning
| Type | Description |
|------|-------------|
| [qrcode](qrcode.md) | QR code scanner |
| [barcode](barcode.md) | Barcode scanner |

### Structure
| Type | Description |
|------|-------------|
| [section](section.md) | Field grouping / repeating sections |
| [form](form.md) | Linked form reference |

### Display Only
| Type | Description |
|------|-------------|
| [label](label.md) | Non-interactive text display |

### Special
| Type | Description |
|------|-------------|
| [group_member](group-member.md) | User selection |
| [checklist](checklist.md) | Multi-item checklist |
| [business_card](business-card.md) | Business card OCR |
| [separated_input](separated-input.md) | Segmented input (OTP style) |
| [object_detection](object-detection.md) | Image object detection |
| [text_extraction](text-extraction.md) | OCR text extraction |

---

## How to Read These Pages

Each field type page includes:

1. **Purpose** - What the field is for
2. **Data Type** - The `type` value to use
3. **Consumed Properties** - Properties this field uses
4. **Layout Variants** - Available `layout` values
5. **Answer Structure** - How the answer is stored
6. **Example** - Complete schema example
7. **Behavior Notes** - Special behaviors to know

---

## Contributing

When adding documentation:
1. Use the template structure
2. Include at least one working example
3. Note any platform differences (iOS vs Android vs Web)
4. Document edge cases

