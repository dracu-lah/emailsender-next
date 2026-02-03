"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, Search, Trash2, Github, Calendar, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AuthGuard from "../components/AuthGuard";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { PROJECT_CONFIG } from "@/lib/constants";

type SendRecord = {
  gmail: string;
  recipient: string;
  lastSent: string;
};

const SEND_HISTORY_KEY = "email-send-history";

const useEmailHistory = (gmail?: string) => {
  const [history, setHistory] = useState<SendRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SEND_HISTORY_KEY);
      if (!raw) {
        setHistory([]);
        return;
      }
      const parsed: SendRecord[] = JSON.parse(raw);
      const userHistory = gmail
        ? parsed.filter((record) => record.gmail === gmail)
        : parsed;
      userHistory.sort(
        (a, b) =>
          new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime(),
      );
      setHistory(userHistory);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  }, [gmail]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const lower = searchTerm.toLowerCase();
    return history.filter(
      (item) =>
        item.recipient.toLowerCase().includes(lower) ||
        new Date(item.lastSent)
          .toLocaleString()
          .toLowerCase()
          .includes(lower),
    );
  }, [history, searchTerm]);

  return {
    history,
    filteredHistory,
    searchTerm,
    setSearchTerm,
    setHistory,
  };
};

export default function HistoryPage() {
  const router = useRouter();
  const { auth } = useAuth();
  const {
    history,
    filteredHistory,
    searchTerm,
    setSearchTerm,
    setHistory,
  } = useEmailHistory(auth?.gmail);

  const clearHistory = () => {
    if (typeof window === "undefined") return;
    if (
      !confirm(
        "Are you sure you want to clear your email history? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      const raw = localStorage.getItem(SEND_HISTORY_KEY);
      let allHistory: SendRecord[] = raw ? JSON.parse(raw) : [];

      if (auth?.gmail) {
        allHistory = allHistory.filter((record) => record.gmail !== auth.gmail);
      } else {
        allHistory = [];
      }

      localStorage.setItem(SEND_HISTORY_KEY, JSON.stringify(allHistory));
      setHistory([]);
      toast.success("History cleared.");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/")}
                className="h-10 w-10 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <History className="h-6 w-6 text-primary" />
                  Email History
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
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
              {history.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Sent Emails</CardTitle>
                  <CardDescription>
                    Total sent: {history.length}
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipients..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm
                    ? "No matching records found."
                    : "No email history found."}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[40%]">Recipient</TableHead>
                        <TableHead className="w-[30%]">Date Sent</TableHead>
                        <TableHead className="w-[30%] text-right">Time Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((record, i) => {
                        const date = new Date(record.lastSent);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground md:hidden" />
                                <span className="truncate max-w-[150px] md:max-w-none" title={record.recipient}>
                                  {record.recipient}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground md:hidden" />
                                {date.toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 md:hidden" />
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <footer className="py-6 text-center text-sm text-muted-foreground">
             <p>
              &copy; {new Date().getFullYear()} EmailxSender.{" "}
              <a 
                href={PROJECT_CONFIG.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline underline-offset-4"
              >
                Open source project
              </a>
             </p>
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}