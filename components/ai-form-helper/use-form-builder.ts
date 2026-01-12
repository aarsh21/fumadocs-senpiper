'use client';

import { useState, useCallback, useEffect } from 'react';
import { BASIC_TEMPLATE, type V1FormSchema, type TemplateKey } from './templates';

const STORAGE_KEY = 'ai-form-helper-schema';
const TEMPLATE_KEY = 'ai-form-helper-template';

export function useFormBuilder() {
  const [schema, setSchema] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | ''>('');
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedTemplate = localStorage.getItem(TEMPLATE_KEY) as TemplateKey | null;
    if (saved) {
      setSchema(saved);
      setSelectedTemplate(savedTemplate || 'basic');
    } else {
      setSchema(JSON.stringify(BASIC_TEMPLATE, null, 2));
      setSelectedTemplate('basic');
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && schema) {
      localStorage.setItem(STORAGE_KEY, schema);
    }
  }, [schema, isInitialized]);

  useEffect(() => {
    if (isInitialized && selectedTemplate) {
      localStorage.setItem(TEMPLATE_KEY, selectedTemplate);
    }
  }, [selectedTemplate, isInitialized]);

  const updateSchema = useCallback((newSchema: string) => {
    setSchema(newSchema);
  }, []);

  const handleValidationChange = useCallback((valid: boolean, errs: string[]) => {
    setIsValid(valid);
    setErrors(errs);
  }, []);

  const loadTemplate = useCallback((template: V1FormSchema, key: TemplateKey) => {
    setSchema(JSON.stringify(template, null, 2));
    setSelectedTemplate(key);
  }, []);

  const getParsedSchema = useCallback((): V1FormSchema | null => {
    try {
      return JSON.parse(schema) as V1FormSchema;
    } catch {
      return null;
    }
  }, [schema]);

  const resetSchema = useCallback(() => {
    setSchema(JSON.stringify(BASIC_TEMPLATE, null, 2));
    setSelectedTemplate('basic');
  }, []);

  return {
    schema,
    updateSchema,
    isValid,
    errors,
    handleValidationChange,
    loadTemplate,
    getParsedSchema,
    resetSchema,
    isInitialized,
    selectedTemplate,
  };
}
