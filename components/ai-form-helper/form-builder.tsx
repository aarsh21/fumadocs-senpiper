"use client";

import { useState, useEffect } from "react";
import { SchemaEditor } from "./schema-editor";
import { AIChatPanel } from "./ai-chat-panel";
import { SubmitDialog } from "./submit-dialog";
import { useFormBuilder } from "./use-form-builder";
import { TEMPLATES, type TemplateKey } from "./templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  Send,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";

export function FormBuilder() {
  const {
    schema,
    updateSchema,
    isValid,
    errors,
    handleValidationChange,
    loadTemplate,
    resetSchema,
    isInitialized,
    selectedTemplate,
  } = useFormBuilder();

  const [submitOpen, setSubmitOpen] = useState(false);
  const [alphaDialogOpen, setAlphaDialogOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("alpha-dialog-dismissed");
    if (!dismissed) {
      setAlphaDialogOpen(true);
    }
  }, []);

  const handleAlphaDialogClose = () => {
    sessionStorage.setItem("alpha-dialog-dismissed", "true");
    setAlphaDialogOpen(false);
  };

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-fd-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-fd-background px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to Docs</span>
          </Link>
          <div className="h-5 w-px bg-fd-border hidden sm:block" />
          <h1 className="text-lg font-semibold">AI Form Schema Builder</h1>
          <Select
            value={selectedTemplate}
            onValueChange={(key) =>
              loadTemplate(
                TEMPLATES[key as TemplateKey].template,
                key as TemplateKey,
              )
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Load template..." />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" sideOffset={4}>
              {Object.entries(TEMPLATES).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={resetSchema}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {isValid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span className="text-fd-muted-foreground">Valid JSON</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                <span className="text-red-500">{errors[0]}</span>
              </>
            )}
          </div>
          <Button onClick={() => setSubmitOpen(true)} disabled={!isValid}>
            <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            Submit to Server
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r">
          <SchemaEditor
            value={schema}
            onChange={updateSchema}
            onValidationChange={handleValidationChange}
          />
        </div>
        <div className="w-[400px]">
          <AIChatPanel currentSchema={schema} onSchemaUpdate={updateSchema} />
        </div>
      </div>

      <SubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        schema={schema}
      />

      <Dialog open={alphaDialogOpen} onOpenChange={setAlphaDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Alpha Preview
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              This feature is currently in{" "}
              <span className="font-semibold text-amber-500">
                very early alpha
              </span>{" "}
              stage. You may encounter bugs, incomplete features, or unexpected
              behavior.
              <br />
              <br />
              Your feedback is valuable! Please report any issues you encounter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleAlphaDialogClose}>
              I understand, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
