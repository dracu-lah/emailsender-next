"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Github, Eye, EyeOff, Info, ExternalLink, CheckCircle2, Zap, Shield, Send, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PROJECT_CONFIG } from "@/lib/constants";

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<{
    gmail: string;
    appPassword: string;
  } | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) router.replace("/");
  }, [router]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      gmail: "",
      appPassword: "",
    },
  });

  const onSubmit = (values: { gmail: string; appPassword: string }) => {
    setFormData(values);
    setConfirmOpen(true);
  };

  const handleConfirmLogin = () => {
    if (formData) {
      localStorage.setItem("auth", JSON.stringify(formData));
      router.push("/");
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-background relative z-10">
      <div className="hidden bg-muted lg:flex flex-col p-10 text-white dark:text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950 dark:bg-zinc-950/90" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

        <div className="relative z-10 flex items-center gap-2 text-xl font-bold text-white">
          <div className="p-1.5 bg-primary rounded-lg">
            <Send className="h-5 w-5 text-primary-foreground" />
          </div>
          EmailxSender
        </div>

        <div className="relative z-10 mt-auto space-y-6 max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
            Supercharge Your <br />
            <span className="text-primary">Job Search</span> & Outreach
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Stop wasting time with manual emails. EmailxSender helps you manage
            personalized campaigns directly from your Gmail, securely and
            efficiently.
          </p>

          <div className="grid gap-6 pt-4">
            <div className="flex items-start gap-4 text-zinc-300">
              <div className="p-2 bg-primary/10 rounded-full">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">Bulk Sending</h3>
                <p className="text-sm text-zinc-400">
                  Send personalized emails to multiple recipients without the
                  hassle of BCC.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-zinc-300">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">Secure & Private</h3>
                <p className="text-sm text-zinc-400">
                  Your data stays local. We use your Gmail App Password for
                  direct, secure access.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-zinc-300">
              <div className="p-2 bg-primary/10 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">Smart Tracking</h3>
                <p className="text-sm text-zinc-400">
                  Keep track of who you&apos;ve emailed and avoid awkward
                  double-sends.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 flex items-center gap-2 text-sm text-zinc-500 font-medium">
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
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-8 lg:p-8 relative bg-background">
        <div className="absolute right-4 top-4 md:right-8 md:top-8 flex items-center gap-2">
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
        </div>

        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="size-14 flex justify-center items-center rounded-full bg-primary/10">
                <MailCheck className="size-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Connect your Gmail
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your Gmail and App Password to start sending
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gmail">Gmail Address</Label>
                  <Input
                    id="gmail"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    {...register("gmail", { required: "Gmail is required" })}
                  />
                  {errors.gmail && (
                    <p className="text-xs text-destructive">
                      {errors.gmail.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appPassword">App Password</Label>
                    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          size="sm"
                          className="px-0 h-auto font-normal text-xs text-muted-foreground hover:text-primary"
                        >
                          What is this?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-xl">
                            <Info className="h-5 w-5" />
                            How to Generate an App Password
                          </DialogTitle>
                          <DialogDescription>
                            Follow these steps to create a Google App Password
                            for this application.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                1
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-sm">
                                  Open Google Account Settings
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Go to your Google Account settings page
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                2
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-sm">
                                  Enable 2-Step Verification
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Navigate to{" "}
                                  <code className="bg-muted px-1 py-0.5 rounded">
                                    Security → 2-Step Verification
                                  </code>{" "}
                                  and enable it.
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                3
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-sm">
                                  Access App Passwords
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Search for &quot;App Passwords&quot; in the
                                  search bar or go to Security settings.
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                4
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-sm">
                                  Generate Password
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Create a new app password named &quot;Email
                                  Sender&quot;.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 p-3">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                  Security Note
                                </p>
                                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                                  App passwords bypass 2FA for specific apps.
                                  Never share this password. We store it locally
                                  in your browser only.
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            asChild
                          >
                            <a
                              href="https://myaccount.google.com/apppasswords"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2"
                            >
                              Open Google App Passwords
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="relative">
                    <Input
                      id="appPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="abcd efgh ijkl mnop"
                      {...register("appPassword", {
                        required: "App Password is required",
                      })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        Toggle password visibility
                      </span>
                    </Button>
                  </div>
                  {errors.appPassword && (
                    <p className="text-xs text-destructive">
                      {errors.appPassword.message}
                    </p>
                  )}
                </div>

                <Button className="mt-2 w-full" type="submit">
                  Connect & Continue
                </Button>
              </div>
            </form>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            By connecting, you agree that your credentials will be stored
            locally on your device.
          </p>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Is this an App Password?</DialogTitle>
            <DialogDescription>
              Please ensure you are using a <strong>Google App Password</strong>{" "}
              (16 characters), not your regular Google login password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
            <Button onClick={handleConfirmLogin} className="w-full sm:w-full">
              Yes, I&apos;m using an App Password
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-full mt-2 sm:mt-0"
              onClick={() => {
                setConfirmOpen(false);
                setModalOpen(true);
              }}
            >
              No, help me get one
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="w-full sm:w-full mt-2 sm:mt-0"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;

