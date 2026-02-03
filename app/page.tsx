"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, MailCheck, Github, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthGuard from "./components/AuthGuard";
import EmailForm from "./components/EmailForm";
import { useAuth } from "./hooks/useAuth";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PROJECT_CONFIG } from "@/lib/constants";
import { QueryProvider } from "./components/QueryProvider";

const SEND_HISTORY_KEY = "email-send-history";

const useSentCount = (gmail?: string) => {
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(SEND_HISTORY_KEY);
        if (!raw) {
          setSentCount(0);
          return;
        }
        const parsed = JSON.parse(raw) as Array<{ gmail: string }>;
        const count = gmail
          ? parsed.filter((record) => record.gmail === gmail).length
          : parsed.length;
        setSentCount(count);
      } catch {
        setSentCount(0);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, [gmail]);

  return sentCount;
};

export default function Home() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const sentCount = useSentCount(auth?.gmail);

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="border-b bg-background/60 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground hidden md:inline-block">
                  EmailxSender
                </span>
              </div>

              <div className="flex items-center gap-3">
                {sentCount > 0 && (
                  <div
                    onClick={() => router.push("/history")}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/80 px-3 py-1.5 rounded-full border transition-colors group"
                    role="button"
                    tabIndex={0}
                  >
                    <MailCheck className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                      {sentCount} <span className="hidden sm:inline">sent</span>
                    </span>
                  </div>
                )}

                <div className="h-6 w-px bg-border mx-1" />

                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="rounded-full"
                >
                  <a
                    href={PROJECT_CONFIG.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    <span className="sr-only">GitHub</span>
                  </a>
                </Button>

                <ModeToggle />

                <Button
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  <LogOutIcon />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 ">
            <div className="max-w-4xl mx-auto space-y-0 mt-2">
              <QueryProvider>
                <EmailForm />
              </QueryProvider>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
