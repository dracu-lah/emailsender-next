"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  Edit2,
  Save,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { RecipientsTagInput } from "./RecipientsTagInput";
import { SendConfirmationDialog } from "./SendConfirmationDialog";
import {
  FormType,
  SendRecord,
  StoredData,
  clearStoredData,
  formSchema,
  getSendHistory,
  getStoredData,
  setSendHistory,
  setStoredData,
} from "./email-form.config";

type ErrorResponse = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const SendEmailAPI = async (params: unknown) => {
  const { data } = await axios.post(`/api/send-email`, params);
  return data;
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

  const recipients = watch("recipients");
  const subject = watch("subject");
  const body = watch("body");
  const resume = watch("resume");

  // Save to LocalStorage
  useEffect(() => {
    const saveToStorage = async () => {
      const newData: StoredData = {
        recipients,
        subject,
        body,
      };

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
    recipients,
    subject,
    body,
    resume,
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
                    <RecipientsTagInput
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

      <SendConfirmationDialog
        open={showConfirm}
        isSubmitting={mutation.isPending}
        recipients={conflictingRecipients}
        selectedRecipients={selectedConflicts}
        onToggleRecipient={handleToggleConflict}
        onConfirm={handleConfirmSend}
        onClose={() => {
          setShowConfirm(false);
          setPendingFormData(null);
          setConflictingRecipients([]);
          setSelectedConflicts({});
        }}
      />
    </div>
  );
};

export default EmailForm;
