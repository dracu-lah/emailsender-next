"use client";

import React, { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

interface TagInputProps {
  value: string[];
  label: string;
  onChange: (value: string[]) => void;
  error?: { message?: string };
  disabled?: boolean;
  sentMap?: Record<string, string>;
}

export const RecipientsTagInput: React.FC<TagInputProps> = ({
  value,
  label,
  onChange,
  error,
  disabled,
  sentMap,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>(value || []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setTags(value || []), [value]);

  const addTag = (email: string) => {
    const trimmed = email.trim();
    if (trimmed && isValidEmail(trimmed) && !tags.includes(trimmed)) {
      const next = [...tags, trimmed];
      setTags(next);
      onChange(next);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const next = tags.filter((_, i) => i !== index);
    setTags(next);
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length) {
      removeTag(tags.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const emails = pasted
      .split(/[,\s\n;]+/)
      .map((x) => x.trim())
      .filter((x) => x && isValidEmail(x));
    const unique = emails.filter((x) => !tags.includes(x));
    if (unique.length) {
      const next = [...tags, ...unique];
      setTags(next);
      onChange(next);
      setInputValue("");
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  const copyAll = () => {
    if (!tags.length) return;
    navigator.clipboard.writeText(tags.join(", ")).then(
      () => toast.success("Emails copied to clipboard!"),
      () => toast.error("Failed to copy emails"),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        {label && <Label htmlFor="recipients">{label}</Label>}
        {tags.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={copyAll}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy all emails
          </Button>
        )}
      </div>
      <div
        className={`min-h-[44px] w-full rounded-md border px-3 py-2 text-sm flex flex-wrap gap-2 items-center ${error ? "border-destructive" : "border"} bg-popover`}
        onClick={() => !disabled && inputRef.current?.focus()}
        role="button"
        tabIndex={0}
      >
        {tags.map((tag, i) => {
          const sent = sentMap?.[tag];
          return (
            <div
              key={i}
              className={`inline-flex items-center gap-3 ${!sent ? "bg-primary" : "bg-secondary"} rounded-md px-2 py-1`}
            >
              <div className="flex relative flex-col justify-center">
                <div className="text-sm font-medium text-foreground">
                  {tag}
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(i);
                  }}
                  aria-label={`Remove ${tag}`}
                  className="rounded p-1 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        {!disabled && (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={
              tags.length === 0
                ? "recipient@gmail.com, recipient2@company.com"
                : ""
            }
            className="flex-1 min-w-[140px] bg-transparent outline-none"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          Recipients Legend:
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            New
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Already Sent
          </span>
        </div>
      </div>
      {error?.message && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}
    </div>
  );
};

