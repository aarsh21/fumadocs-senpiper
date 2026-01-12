"use client";

import Editor, {
  type OnMount,
  type OnChange,
  type BeforeMount,
} from "@monaco-editor/react";
import { useCallback, useRef } from "react";
import type * as Monaco from "monaco-editor";

const vesperTheme: Monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: false,
  rules: [
    { token: "", foreground: "FFFFFF", background: "101010" },
    { token: "comment", foreground: "8b8b8b", fontStyle: "italic" },
    { token: "keyword", foreground: "A0A0A0" },
    { token: "keyword.json", foreground: "A0A0A0" },
    { token: "string", foreground: "99FFE4" },
    { token: "string.key.json", foreground: "FFC799" },
    { token: "string.value.json", foreground: "99FFE4" },
    { token: "number", foreground: "FFC799" },
    { token: "number.json", foreground: "FFC799" },
    { token: "delimiter", foreground: "FFFFFF" },
    { token: "delimiter.bracket", foreground: "A0A0A0" },
    { token: "delimiter.array", foreground: "A0A0A0" },
    { token: "delimiter.colon", foreground: "A0A0A0" },
    { token: "delimiter.comma", foreground: "A0A0A0" },
    { token: "type", foreground: "FFC799" },
    { token: "variable", foreground: "FFFFFF" },
    { token: "constant", foreground: "FFC799" },
    { token: "operator", foreground: "A0A0A0" },
  ],
  colors: {
    "editor.background": "#101010",
    "editor.foreground": "#FFFFFF",
    "editor.lineHighlightBackground": "#161616",
    "editor.selectionBackground": "#FFFFFF25",
    "editor.selectionHighlightBackground": "#FFFFFF25",
    "editorCursor.foreground": "#FFC799",
    "editorWhitespace.foreground": "#505050",
    "editorIndentGuide.background": "#282828",
    "editorIndentGuide.activeBackground": "#505050",
    "editorLineNumber.foreground": "#505050",
    "editorLineNumber.activeForeground": "#A0A0A0",
    "editorBracketMatch.background": "#343434",
    "editorBracketMatch.border": "#FFC799",
    "editorBracketHighlight.foreground1": "#A0A0A0",
    "editorBracketHighlight.foreground2": "#A0A0A0",
    "editorBracketHighlight.foreground3": "#A0A0A0",
    "scrollbarSlider.background": "#34343480",
    "scrollbarSlider.hoverBackground": "#343434",
    "scrollbarSlider.activeBackground": "#505050",
    "editorWidget.background": "#161616",
    "editorWidget.border": "#282828",
    "editorHoverWidget.background": "#161616",
    "editorHoverWidget.border": "#282828",
  },
};

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export function SchemaEditor({
  value,
  onChange,
  onValidationChange,
}: SchemaEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme("vesper", vesperTheme);
  }, []);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (newValue !== undefined) {
        onChange(newValue);

        try {
          JSON.parse(newValue);
          onValidationChange?.(true, []);
        } catch (e) {
          const error = e instanceof Error ? e.message : "Invalid JSON";
          onValidationChange?.(false, [error]);
        }
      }
    },
    [onChange, onValidationChange],
  );

  const formatDocument = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-fd-muted/30 px-4 py-2">
        <span className="text-sm font-medium">Form Schema (JSON)</span>
        <button
          onClick={formatDocument}
          className="rounded-md bg-fd-primary px-3 py-1 text-xs text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Format
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme="vesper"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            wordWrap: "on",
            formatOnPaste: true,
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
