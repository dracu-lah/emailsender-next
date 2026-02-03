"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  X,
  Edit2,
  Save,
  Copy,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type ErrorResponse = {
  response: {
    data: {
      error: string;
      message: string;
    };
  };
};
const SendEmailAPI = async (params: unknown) => {
  const { data } = await axios.post(`/api/send-email`, params);
  return data;
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "video/mp4",
];

const formSchema = z.object({
  recipients: z
    .array(z.string().email())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  resume: z
    .any()
    .refine((files) => files?.length > 0, "Resume is required")
    .refine(
      (files) => files?.[0]?.type === "application/pdf",
      "Only PDF files are allowed",
    ),
});

type FormType = z.infer<typeof formSchema>;

const STORAGE_KEY = "email-form-data";
const SEND_HISTORY_KEY = "email-send-history";

type StoredData = {
  recipients?: string[];
  subject?: string;
  body?: string;
  resumeData?: string;
  resumeName?: string;
};

type SendRecord = {
  gmail: string;
  recipient: string;
  lastSent: string;
};

const getStoredData = (): StoredData => {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
};

const setStoredData = (data: StoredData) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearStoredData = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

const getSendHistory = (): SendRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEND_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setSendHistory = (records: SendRecord[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEND_HISTORY_KEY, JSON.stringify(records));
  } catch {}
};

interface TagInputProps {
  value: string[];
  label: string;
  onChange: (value: string[]) => void;
  error?: { message?: string };
  disabled?: boolean;
  sentMap?: Record<string, string>;
}

const TagInput: React.FC<TagInputProps> = ({
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
    const t = email.trim();
    if (t && isValidEmail(t) && !tags.includes(t)) {
      const next = [...tags, t];
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
    if (tags.length) {
      navigator.clipboard.writeText(tags.join(", ")).then(
        () => toast.success("Emails copied to clipboard!"),
        () => toast.error("Failed to copy emails"),
      );
    }
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
                <div className={`text-sm font-medium text-foreground`}>
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

const EmailForm: React.FC = () => {
  const { auth } = useAuth();
  const email = auth?.gmail || "";
  const password = auth?.appPassword || "";
  const [storedFileName, setStoredFileName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedData = getStoredData();
  const [sendMap, setSendMap] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormType | null>(null);
  const [conflictingRecipients, setConflictingRecipients] = useState<
    SendRecord[]
  >([]);
  const [selectedConflicts, setSelectedConflicts] = useState<
    Record<string, boolean>
  >({});
  const [lastSentRecipients, setLastSentRecipients] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    watch,
    reset,
    setError,
    clearErrors,
    trigger,
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: storedData.recipients || [],
      subject: storedData.subject || "ReactJS Developer Application",
      body:
        storedData.body ||
        `Dear Hiring Manager,

I am writing to express my interest in the ReactJS Developer position. 

With my experience in modern React development and related technologies, I believe I would be a great fit for your team.

Please find my resume attached for your consideration.

Best regards,
[Your Name]`,
      resume: undefined,
    },
  });

  // Restore Resume on mount only
  useEffect(() => {
    const data = getStoredData();

    // Restore Resume
    if (data.resumeData && data.resumeName) {
      setStoredFileName(data.resumeName);
      const convertResume = async () => {
        try {
          const res = await fetch(data.resumeData!);
          const blob = await res.blob();
          const file = new File([blob], data.resumeName!, {
            type: "application/pdf",
          });
          const dt = new DataTransfer();
          dt.items.add(file);
          setValue("resume", dt.files, { shouldValidate: true });
          clearErrors("resume");
        } catch (e) {
          console.error("Failed to restore resume", e);
        }
      };
      convertResume();
    }
  }, [setValue, clearErrors]);

  const formValues = watch();

  // Save to LocalStorage
  useEffect(() => {
    const {
      recipients,
      resume,
      ...dataToStore
    } = formValues as FormType;

    const saveToStorage = async () => {
      const newData: StoredData = {
        ...dataToStore,
        recipients,
      };

      // Handle Resume
      if (resume && resume[0]) {
        const file = resume[0];
        if (file.type === "application/pdf") {
          try {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            newData.resumeData = base64;
            newData.resumeName = file.name;
            setStoredFileName(file.name);
          } catch {}
        }
      } else {
        setStoredFileName(null);
      }

      setStoredData(newData);
    };

    saveToStorage();
  }, [
    formValues.recipients,
    formValues.subject,
    formValues.body,
    formValues.resume,
  ]);

  useEffect(() => {
    const history = getSendHistory();
    const map: Record<string, string> = {};
    history.forEach((r) => {
      if (r.gmail === email) map[r.recipient] = r.lastSent;
    });
    setSendMap(map);
  }, [email]);

  const mutation = useMutation({
    mutationFn: SendEmailAPI,
    onSuccess: () => {
      const now = new Date().toISOString();
      const history = getSendHistory();
      const updated = [...history];
      lastSentRecipients.forEach((recipient) => {
        const idx = updated.findIndex(
          (r) => r.gmail === email && r.recipient === recipient,
        );
        if (idx >= 0) {
          updated[idx].lastSent = now;
        } else {
          updated.push({ gmail: email, recipient, lastSent: now });
        }
      });
      setSendHistory(updated);
      const map: Record<string, string> = {};
      updated.forEach((r) => {
        if (r.gmail === email) map[r.recipient] = r.lastSent;
      });
      setSendMap(map);
      setValue("recipients", []);

      toast.success("Email sent successfully!");
      setPendingFormData(null);
      setShowConfirm(false);
      setConflictingRecipients([]);
      setSelectedConflicts({});
      setLastSentRecipients([]);
    },
    onError: (err: ErrorResponse) => {
      const resp = err?.response?.data;
      if (resp?.error) toast.error(resp.error);
      else if (resp?.message) toast.error(resp.message);
      else toast.error("Failed to send email. Please try again.");
    },
  });

  const onSubmit = async (data: FormType) => {
    const valid = await trigger();
    if (!valid) {
      toast.error("Please fix the form errors before sending.");
      return;
    }

    const currentData = getStoredData();
    if (!data.resume || !data.resume[0]) {
      if (!currentData.resumeData) {
        setError("resume", { type: "manual", message: "Resume is required" });
        toast.error("Please upload a resume before sending the email.");
        return;
      }
    }

    const prevMap = getSendHistory()
      .filter((r) => r.gmail === email)
      .reduce<Record<string, string>>((acc, cur) => {
        acc[cur.recipient] = cur.lastSent;
        return acc;
      }, {});
    const conflicts = data.recipients
      .filter((r) => !!prevMap[r])
      .map((r) => ({ gmail: email, recipient: r, lastSent: prevMap[r] }));
    if (conflicts.length) {
      const sel: Record<string, boolean> = {};
      conflicts.forEach((c) => (sel[c.recipient] = true));
      setSelectedConflicts(sel);
      setConflictingRecipients(conflicts);
      setPendingFormData(data);
      setShowConfirm(true);
      return;
    }
    await performSend(data, data.recipients);
  };

  const performSend = async (data: FormType, recipientsToSend: string[]) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("app_password", password);
    formData.append("recipients", recipientsToSend.join(","));
    formData.append("subject", data.subject);
    formData.append("body", data.body);

    const currentData = getStoredData();

    // Resume
    if (data.resume && data.resume[0]) {
      formData.append("resume", data.resume[0]);
    } else if (currentData.resumeData && currentData.resumeName) {
      try {
        const res = await fetch(currentData.resumeData);
        const blob = await res.blob();
        const file = new File([blob], currentData.resumeName!, {
          type: "application/pdf",
        });
        formData.append("resume", file);
      } catch {
        toast.error("Failed to load stored resume file.");
        return;
      }
    }

    setLastSentRecipients(recipientsToSend);
    mutation.mutate(formData);
  };

  const handleConfirmSend = async () => {
    if (!pendingFormData) return;
    const selected = conflictingRecipients
      .filter((c) => selectedConflicts[c.recipient])
      .map((c) => c.recipient);
    const nonConflicting = pendingFormData.recipients.filter(
      (r) => !conflictingRecipients.some((c) => c.recipient === r),
    );
    const recipientsToSend = [...nonConflicting, ...selected];
    if (!recipientsToSend.length) {
      toast.error("No recipients selected to send to.");
      return;
    }
    await performSend(pendingFormData, recipientsToSend);
  };

  const handleToggleConflict = (recipient: string) => {
    setSelectedConflicts((s) => ({ ...s, [recipient]: !s[recipient] }));
  };

  const handleClearStorage = () => {
    clearStoredData();
    setStoredFileName(null);
    reset({
      recipients: [],
      subject: "ReactJS Developer Application",
      body: `Dear Hiring Manager,

I am writing to express my interest in the ReactJS Developer position. 

With my experience in modern React development and related technologies, I believe I would be a great fit for your team.

Please find my resume attached for your consideration.

Best regards,
[Your Name]`,
      resume: null,
    });
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleEditing = () => setIsEditing((s) => !s);
  const handleSaveTemplate = () => {
    setIsEditing(false);
    toast.success("Template saved successfully!");
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setValue("resume", files, { shouldValidate: true });
      trigger("resume");
    }
  };

  return (
    <div className="md:py-12 px-2 md:px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="px-4 ">
            <div className="space-y-6">
              <div className="bg-secondary/60  p-3  rounded-lg border border-secondary">
                <p className="text-sm text-primary">
                  <span className="font-semibold">Sending from:</span>{" "}
                  {email || "Not configured"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between"></div>
                <Controller
                  name="recipients"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      label="Recipients"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.recipients}
                      sentMap={sendMap}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject">Subject</Label>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleEditing}
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveTemplate}
                      >
                        <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  id="subject"
                  {...register("subject")}
                  disabled={!isEditing}
                />
                {errors.subject && (
                  <p className="text-xs text-destructive">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  rows={8}
                  {...register("body")}
                  disabled={!isEditing}
                />
                {errors.body && (
                  <p className="text-xs text-destructive">
                    {errors.body.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">
                  Resume (PDF) <span className="text-destructive">*</span>
                </Label>
                {storedFileName && (
                  <div className="bg-muted/50 border border-border rounded-md p-2 mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Stored: <span className="text-foreground font-medium">{storedFileName}</span>
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={!isEditing}
                  ref={fileInputRef}
                />
                {errors.resume && (
                  <p className="text-xs text-destructive">
                    {errors.resume.message as string}
                  </p>
                )}
                {!storedFileName && !errors.resume && (
                  <p className="text-sm text-muted-foreground">
                    Please upload your resume in PDF format
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={mutation.isPending}
                  onClick={() => handleSubmit(onSubmit)()}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearStorage}
                  disabled={mutation.isPending}
                >
                  Clear All Data
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground text-center">
            Note: All fields including resume are automatically saved to your
            browser&apos;s storage
          </CardFooter>
        </Card>
      </div>

      <Dialog
        open={showConfirm}
        onOpenChange={(v) => {
          if (!v) {
            setPendingFormData(null);
            setConflictingRecipients([]);
            setSelectedConflicts({});
          }
          setShowConfirm(v);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Previously sent to these recipients</DialogTitle>
            <DialogDescription>
              This email was previously sent to some recipients from this Gmail
              account. Choose which of them should be updated and proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="max-h-64 overflow-auto flex flex-col gap-1 rounded border p-1">
              {conflictingRecipients.map((c) => (
                <label
                  key={c.recipient}
                  className="flex items-center justify-between gap-4 p-2 bg-card"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!!selectedConflicts[c.recipient]}
                      onCheckedChange={() => handleToggleConflict(c.recipient)}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <div className="text-sm font-medium ">{c.recipient}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.lastSent).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
              {conflictingRecipients.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">
                  No conflicting recipients.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirm(false);
                setPendingFormData(null);
                setConflictingRecipients([]);
                setSelectedConflicts({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              className="md:ml-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Proceed"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailForm;
