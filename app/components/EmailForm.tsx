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
  Paperclip,
  Trash2,
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
  attachments: z
    .any()
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return Array.from(files as FileList).every(
        (file) => file.size <= MAX_FILE_SIZE,
      );
    }, "Each attachment must be less than 5MB")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return Array.from(files as FileList).every((file) =>
        ACCEPTED_FILE_TYPES.includes(file.type),
      );
    }, "Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, MP4"),
});

type FormType = z.infer<typeof formSchema>;

const STORAGE_KEY = "email-form-data";
const SEND_HISTORY_KEY = "email-send-history";

type StoredAttachment = {
  name: string;
  type: string;
  data: string;
};

type StoredData = {
  recipients?: string[];
  subject?: string;
  body?: string;
  resumeData?: string;
  resumeName?: string;
  attachments?: StoredAttachment[];
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
  const attachmentInputRef = useRef<HTMLInputElement>(null);
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

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
      attachments: undefined,
    },
  });

  // Restore Resume and Attachments
  useEffect(() => {
    // Restore Resume
    if (storedData.resumeData && storedData.resumeName) {
      setStoredFileName(storedData.resumeName);
      const convertResume = async () => {
        const res = await fetch(storedData.resumeData!);
        const blob = await res.blob();
        const file = new File([blob], storedData.resumeName!, {
          type: "application/pdf",
        });
        const dt = new DataTransfer();
        dt.items.add(file);
        setValue("resume", dt.files);
        clearErrors("resume");
      };
      convertResume().catch(() => {});
    }

    // Restore Attachments
    if (storedData.attachments && storedData.attachments.length > 0) {
      const convertAttachments = async () => {
        const files: File[] = [];
        for (const att of storedData.attachments!) {
          try {
            const res = await fetch(att.data);
            const blob = await res.blob();
            files.push(new File([blob], att.name, { type: att.type }));
          } catch (e) {
            console.error("Failed to restore attachment", att.name, e);
          }
        }
        if (files.length > 0) {
          setAttachedFiles(files);
          const dt = new DataTransfer();
          files.forEach((f) => dt.items.add(f));
          setValue("attachments", dt.files);
        }
      };
      convertAttachments().catch(() => {});
    }
  }, [
    storedData.resumeData,
    storedData.resumeName,
    storedData.attachments,
    setValue,
    clearErrors,
  ]);

  const formValues = watch();

  // Save to LocalStorage
  useEffect(() => {
    // attachments is handled via attachedFiles state
    const {
      recipients,
      resume,
      attachments: _ignore,
      ...dataToStore
    } = formValues as FormType;

    const saveToStorage = async () => {
      const newData: StoredData = {
        ...dataToStore,
        recipients,
        // resumeData, resumeName, attachments will be set below if they exist
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
        // Explicitly clear if removed
        setStoredFileName(null);
      }

      // Handle Attachments
      if (attachedFiles.length > 0) {
        const attData: StoredAttachment[] = [];
        for (const file of attachedFiles) {
          try {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            attData.push({
              name: file.name,
              type: file.type,
              data: base64,
            });
          } catch {}
        }
        newData.attachments = attData;
      } else {
        newData.attachments = [];
      }

      setStoredData(newData);
    };

    saveToStorage();
  }, [
    formValues.recipients,
    formValues.subject,
    formValues.body,
    formValues.resume,
    attachedFiles,
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
      setStoredData({
        ...storedData,
        recipients: [],
      });
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
    if (!data.resume || !data.resume[0]) {
      if (!storedData.resumeData) {
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

    // Resume
    if (data.resume && data.resume[0]) {
      formData.append("resume", data.resume[0]);
    } else if (storedData.resumeData && storedData.resumeName) {
      try {
        const res = await fetch(storedData.resumeData);
        const blob = await res.blob();
        const file = new File([blob], storedData.resumeName!, {
          type: "application/pdf",
        });
        formData.append("resume", file);
      } catch {
        toast.error("Failed to load stored resume file.");
        return;
      }
    }

    // Attachments
    attachedFiles.forEach((file) => {
      formData.append("attachments", file);
    });

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
    setAttachedFiles([]);
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
      attachments: null,
    });
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const toggleEditing = () => setIsEditing((s) => !s);
  const handleSaveTemplate = () => {
    setIsEditing(false);
    toast.success("Template saved successfully!");
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setValue("resume", files);
      trigger("resume");
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      // Validate
      const invalidFiles = newFiles.filter(
        (f) => f.size > MAX_FILE_SIZE || !ACCEPTED_FILE_TYPES.includes(f.type),
      );
      if (invalidFiles.length > 0) {
        toast.error(
          "Some files were rejected. Check size (<5MB) and type restrictions.",
        );
      }
      const validFiles = newFiles.filter(
        (f) => f.size <= MAX_FILE_SIZE && ACCEPTED_FILE_TYPES.includes(f.type),
      );

      const updated = [...attachedFiles, ...validFiles];
      setAttachedFiles(updated);

      // Update form value for validation
      const dt = new DataTransfer();
      updated.forEach((f) => dt.items.add(f));
      setValue("attachments", dt.files);

      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    const updated = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(updated);
    const dt = new DataTransfer();
    updated.forEach((f) => dt.items.add(f));
    setValue("attachments", dt.files);
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
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 mb-2 flex items-center justify-between">
                    <span className="text-sm text-emerald-800">
                      Stored: {storedFileName}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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

              {/* Additional Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Additional Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  disabled={!isEditing}
                  ref={attachmentInputRef}
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                />

                {attachedFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {attachedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate max-w-[200px] md:max-w-xs">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeAttachment(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.attachments && (
                  <p className="text-xs text-destructive">
                    {errors.attachments.message as string}
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
