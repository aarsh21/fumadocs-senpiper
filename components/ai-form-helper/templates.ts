export interface V1FormSchema {
  name: string;
  groupId: string;
  companyId: string;
  schema: {
    type: 'object';
    description: string;
    properties: Record<string, V1FieldSchema>;
    order: string[];
    required?: string[];
    searchableKeys?: string[];
    enableViewModeWebLayout?: boolean;
    enableWebLayout?: boolean;
  };
  disableDelete?: boolean;
  updatable?: boolean;
  adminOnly?: boolean;
  isPublic?: boolean;
  master?: boolean;
  hidden?: boolean;
  formIsParent?: boolean;
  formIsChild?: boolean;
  localisationMap?: Record<string, unknown>;
  formSetting?: {
    renderLayoutConfigOnWeb?: boolean;
    convertJsonToFilterStringCondition?: boolean;
  };
}

export interface V1FieldSchema {
  key: string;
  title: string;
  type: string;
  description: string;
  accessMatrix?: {
    mandatory?: boolean;
    readOnly?: boolean;
    visibility?: 'VISIBLE' | 'INVISIBLE';
  };
  enum?: Array<{ const: string; title: string }>;
  predicates?: Array<{
    type: string;
    condition?: string;
    accessMatrix?: {
      mandatory?: boolean;
      readOnly?: boolean;
      visibility?: 'VISIBLE' | 'INVISIBLE';
    };
    expression?: string;
  }>;
  minimum?: number;
  maximum?: number;
  default?: unknown;
  placeholder?: string;
  helpText?: string;
}

export const BLANK_TEMPLATE: V1FormSchema = {
  name: 'New Form',
  groupId: '',
  companyId: '',
  schema: {
    type: 'object',
    description: 'form',
    properties: {},
    order: [],
    required: [],
    searchableKeys: [],
    enableViewModeWebLayout: false,
    enableWebLayout: false,
  },
  disableDelete: true,
  updatable: true,
  adminOnly: false,
  isPublic: false,
  master: false,
  hidden: false,
  formIsParent: false,
  formIsChild: false,
  localisationMap: {},
  formSetting: {
    renderLayoutConfigOnWeb: false,
    convertJsonToFilterStringCondition: false,
  },
};

export const BASIC_TEMPLATE: V1FormSchema = {
  name: 'Basic Form',
  groupId: '',
  companyId: '',
  schema: {
    type: 'object',
    description: 'form',
    properties: {
      name: {
        key: 'name',
        title: 'Name',
        type: 'string',
        description: 'textfield',
        accessMatrix: {
          mandatory: true,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      email: {
        key: 'email',
        title: 'Email',
        type: 'string',
        description: 'textfield',
        placeholder: 'Enter email address',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      phone: {
        key: 'phone',
        title: 'Phone',
        type: 'string',
        description: 'phone',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
    },
    order: ['name', 'email', 'phone'],
    required: ['name'],
    searchableKeys: ['name', 'email'],
    enableViewModeWebLayout: false,
    enableWebLayout: false,
  },
  disableDelete: true,
  updatable: true,
  adminOnly: false,
  isPublic: false,
  master: false,
  hidden: false,
  formIsParent: false,
  formIsChild: false,
  localisationMap: {},
  formSetting: {
    renderLayoutConfigOnWeb: false,
    convertJsonToFilterStringCondition: false,
  },
};

export const ADVANCED_TEMPLATE: V1FormSchema = {
  name: 'Advanced Form with Conditions',
  groupId: '',
  companyId: '',
  schema: {
    type: 'object',
    description: 'form',
    properties: {
      section_personal: {
        key: 'section_personal',
        title: 'Personal Information',
        type: 'null',
        description: 'section',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      name: {
        key: 'name',
        title: 'Full Name',
        type: 'string',
        description: 'textfield',
        accessMatrix: {
          mandatory: true,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      status: {
        key: 'status',
        title: 'Status',
        type: 'string',
        description: 'string_list',
        enum: [
          { const: 'active', title: 'Active' },
          { const: 'inactive', title: 'Inactive' },
          { const: 'pending', title: 'Pending' },
        ],
        accessMatrix: {
          mandatory: true,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      reason: {
        key: 'reason',
        title: 'Reason for Inactivity',
        type: 'string',
        description: 'textfield',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'INVISIBLE',
        },
        predicates: [
          {
            type: 'APPLY_ACCESS_MATRIX',
            condition: '${status} == "inactive"',
            accessMatrix: {
              mandatory: true,
              readOnly: false,
              visibility: 'VISIBLE',
            },
          },
        ],
      },
      section_location: {
        key: 'section_location',
        title: 'Location Details',
        type: 'null',
        description: 'section',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      location: {
        key: 'location',
        title: 'Location',
        type: 'object',
        description: 'location',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
      photos: {
        key: 'photos',
        title: 'Photos',
        type: 'array',
        description: 'multimedia',
        accessMatrix: {
          mandatory: false,
          readOnly: false,
          visibility: 'VISIBLE',
        },
      },
    },
    order: [
      'section_personal',
      'name',
      'status',
      'reason',
      'section_location',
      'location',
      'photos',
    ],
    required: ['name', 'status'],
    searchableKeys: ['name', 'status'],
    enableViewModeWebLayout: false,
    enableWebLayout: false,
  },
  disableDelete: true,
  updatable: true,
  adminOnly: false,
  isPublic: false,
  master: false,
  hidden: false,
  formIsParent: false,
  formIsChild: false,
  localisationMap: {},
  formSetting: {
    renderLayoutConfigOnWeb: false,
    convertJsonToFilterStringCondition: false,
  },
};

export const TEMPLATES = {
  blank: { name: 'Blank Form', template: BLANK_TEMPLATE },
  basic: { name: 'Basic Contact Form', template: BASIC_TEMPLATE },
  advanced: { name: 'Advanced with Conditions', template: ADVANCED_TEMPLATE },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;
