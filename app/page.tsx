"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AuthGuard from "./components/AuthGuard";
import EmailForm from "./components/EmailForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { History, Send, MailCheck, Github, LogOutIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PROJECT_CONFIG } from "@/lib/constants";

const queryClient = new QueryClient();

export default function Home() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("email-send-history");
        if (raw) {
          const parsed = JSON.parse(raw);
          // Filter by current user if auth is available
          const count = auth?.gmail
            ? parsed.filter((r: any) => r.gmail === auth.gmail).length
            : parsed.length;
          setSentCount(count);
        } else {
          setSentCount(0);
        }
      } catch {
        setSentCount(0);
      }
    };

    updateCount();

    // Listen for storage events (though this mostly works for other tabs)
    // For same-tab updates, we might need a custom event or context,
    // but the form updates localStorage directly.
    // A simple interval or just relying on page load is usually okay for MVP,
    // but let's add an interval for "live" feel if the user sends an email.
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, [auth?.gmail]);

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
            <div className="max-w-4xl mx-auto space-y-0">
              <QueryClientProvider client={queryClient}>
                <EmailForm />
              </QueryClientProvider>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

