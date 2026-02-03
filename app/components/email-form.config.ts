import * as z from "zod";

export const STORAGE_KEY = "email-form-data";
export const SEND_HISTORY_KEY = "email-send-history";

export const formSchema = z.object({
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

export type FormType = z.infer<typeof formSchema>;

export type StoredData = {
  recipients?: string[];
  subject?: string;
  body?: string;
  resumeData?: string;
  resumeName?: string;
};

export type SendRecord = {
  gmail: string;
  recipient: string;
  lastSent: string;
};

export const getStoredData = (): StoredData => {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const setStoredData = (data: StoredData) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write errors (e.g. quota)
  }
};

export const clearStoredData = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore clear errors
  }
};

export const getSendHistory = (): SendRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEND_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setSendHistory = (records: SendRecord[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEND_HISTORY_KEY, JSON.stringify(records));
  } catch {
    // ignore write errors
  }
};

