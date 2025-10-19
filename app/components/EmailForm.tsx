"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, X, Edit2, Save } from "lucide-react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
type ErrorResponse = {
  response: {
    data: {
      error: string;
      message: string;
    };
  };
};
export const SendEmailAPI = async (params: unknown) => {
  try {
    const { data } = await axios.post(`/api/send-email`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Email validation helper
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Zod Schema - Updated to make resume required
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

type FormData = z.infer<typeof formSchema>;

// Persistent storage using localStorage
const STORAGE_KEY = "email-form-data";

interface StoredData {
  recipients?: string[];
  subject?: string;
  body?: string;
  resumeData?: string;
  resumeName?: string;
}

const getStoredData = (): StoredData => {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setStoredData = (data: object) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, recipients: [] }),
    );
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
  }
};

const clearStoredData = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
};

// Tag Input Component with improved email handling
interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: { message?: string };
  disabled?: boolean;
}

const TagInput = ({ value, onChange, error, disabled }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>(value || []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTags(value || []);
  }, [value]);

  const addTag = (email: string) => {
    const trimmedEmail = email.trim();
    if (
      trimmedEmail &&
      isValidEmail(trimmedEmail) &&
      !tags.includes(trimmedEmail)
    ) {
      const newTags = [...tags, trimmedEmail];
      setTags(newTags);
      onChange(newTags);
      setInputValue("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    setTags(newTags);
    onChange(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // Improved email parsing - handles multiple emails separated by various delimiters
    const emails = pastedText
      .split(/[,\s\n;]+/)
      .map((email) => email.trim())
      .filter((email) => email && isValidEmail(email));

    const uniqueEmails = emails.filter((email) => !tags.includes(email));

    if (uniqueEmails.length > 0) {
      const newTags = [...tags, ...uniqueEmails];
      setTags(newTags);
      onChange(newTags);
      setInputValue("");
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div>
      <div
        className={`min-h-[42px] w-full rounded-md border ${
          error ? "border-red-500" : "border-input"
        } bg-background px-3 py-2 text-sm cursor-text flex flex-wrap gap-2 items-center ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && inputRef.current?.focus()}
        onKeyDown={() => {}} // Add empty handler for accessibility
        role="button"
        tabIndex={0}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="hover:bg-primary/80 rounded-full p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
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
            className="flex-1 min-w-[120px] outline-none bg-transparent"
          />
        )}
      </div>
    </div>
  );
};

const EmailForm = () => {
  const { auth } = useAuth();
  const email = auth?.gmail || "";
  const password = auth?.appPassword || "";

  const [storedFileName, setStoredFileName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const storedData = getStoredData();

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
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: [],
      subject: storedData.subject || "",
      body: storedData.body || "",
      resume: storedData.resumeData || undefined,
    },
  });

  // Load stored resume on mount
  useEffect(() => {
    if (storedData.resumeData && storedData.resumeName) {
      setStoredFileName(storedData.resumeName);
      // Clear resume error if we have a stored resume
      clearErrors("resume");
    }
  }, [storedData.resumeData, storedData.resumeName, clearErrors]);

  const formValues = watch();

  // Auto-save to persistent storage
  useEffect(() => {
    const { recipients, resume, ...dataToStore } = formValues;

    // Store resume data if present
    if (resume && resume[0]) {
      const file = resume[0];
      // Validate file type
      if (file.type !== "application/pdf") {
        setError("resume", {
          type: "manual",
          message: "Only PDF files are allowed",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setStoredData({
          ...dataToStore,
          recipients,
          resumeData: e.target?.result,
          resumeName: file.name,
        });
        setStoredFileName(file.name);
        // Clear resume error when valid file is selected
        clearErrors("resume");
      };
      reader.readAsDataURL(file);
    } else {
      // Always store current data
      setStoredData({
        ...storedData,
        ...dataToStore,
        recipients,
      });
    }
  }, [formValues, storedData, setError, clearErrors]);

  const mutation = useMutation({
    mutationFn: SendEmailAPI,
    onSuccess: () => {
      setValue("recipients", []);
      toast.success("Email sent successfully!");
    },
    onError: ({ response }: ErrorResponse) => {
      if (response?.data?.error) {
        toast.error(response.data.error);
      }
      if (response?.data?.message) {
        toast.error(response.data.message);
      } else {
        toast.error("Failed to send email. Please try again.");
      }
    },
  });

  const onSubmit = (data: FormData) => {
    // Additional validation to ensure resume is present
    if (!data.resume || !data.resume[0]) {
      if (!storedData.resumeData) {
        setError("resume", {
          type: "manual",
          message: "Resume is required",
        });
        toast.error("Please upload a resume before sending the email.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("app_password", password);
    formData.append("recipients", data.recipients.join(","));
    formData.append("subject", data.subject);
    formData.append("body", data.body);

    // Use stored resume if no new one is selected
    if (data.resume && data.resume[0]) {
      formData.append("resume", data.resume[0]);
    } else if (storedData.resumeData && storedData.resumeName) {
      // Convert base64 back to file
      fetch(storedData.resumeData)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], storedData.resumeName!, {
            type: "application/pdf",
          });
          formData.append("resume", file);
          mutation.mutate(formData);
        });
      return;
    }

    mutation.mutate(formData);
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
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveTemplate = () => {
    setIsEditing(false);
    // Data is already auto-saved, just show confirmation
  };

  // Update resume label to indicate it's required
  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardContent>
            <div className="space-y-6">
              {/* User Info Display */}
              <div className="bg-secondary/60 p-4 rounded-lg border border-secondary">
                <p className="text-sm text-primary">
                  <span className="font-semibold">Sending from:</span> {email}
                </p>
              </div>

              {/* Recipients Field with Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="recipients">Recipients</Label>
                </div>
                <Controller
                  name="recipients"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.recipients}
                    />
                  )}
                />
                {errors.recipients && (
                  <p className="text-sm text-red-500">
                    {errors.recipients.message}
                  </p>
                )}
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject">Subject</Label>

                  <div className="flex gap-2">
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleEditing}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveTemplate}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  id="subject"
                  type="text"
                  placeholder="ReactJS Developer Application"
                  {...register("subject")}
                  className={errors.subject ? "border-red-500" : ""}
                  disabled={!isEditing}
                />
                {errors.subject && (
                  <p className="text-sm text-red-500">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Body Field */}
              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  placeholder="Hi, I'm applying for the ReactJS Developer role..."
                  rows={8}
                  {...register("body")}
                  className={errors.body ? "border-red-500" : ""}
                  disabled={!isEditing}
                />
                {errors.body && (
                  <p className="text-sm text-red-500">{errors.body.message}</p>
                )}
              </div>

              {/* Resume Upload - Now Required */}
              <div className="space-y-2">
                <Label htmlFor="resume">
                  Resume (PDF) <span className="text-red-500">*</span>
                </Label>
                {storedFileName && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-2 flex items-center justify-between">
                    <span className="text-sm text-green-800">
                      Stored: {storedFileName}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  {...register("resume")}
                  className={errors.resume ? "border-red-500" : ""}
                  disabled={!isEditing}
                  required
                />
                {errors.resume && (
                  <p className="text-sm text-red-500">
                    {errors.resume.message as string}
                  </p>
                )}
                {!storedFileName && !errors.resume && (
                  <p className="text-sm text-gray-500">
                    Please upload your resume in PDF format
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={mutation.isPending}
                  onClick={() => handleSubmit(onSubmit)()}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <CardFooter className="text-xs text-gray-500 text-center block">
            Note: All fields including resume are automatically saved to your
            browser&apos;s storage
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EmailForm;
