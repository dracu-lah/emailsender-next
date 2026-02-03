"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Info, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<{
    gmail: string;
    appPassword: string;
  } | null>(null);

  // 👇 redirect if already logged in
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) router.replace("/");
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
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
    <div>
      <div className="p-4 md:p-8 flex w-[100vw] justify-between items-center ">
        <span className="text-3xl md:text-4xl font-light text-primary ">
          EmailxSender
        </span>
        <div className="flex justify-center items-center gap-4">
          <ModeToggle />
        </div>
      </div>
      <Card className="m-auto my-40 w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid w-full gap-4">
              {/* Gmail */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="gmail">Gmail</Label>
                <Input
                  id="gmail"
                  type="email"
                  placeholder="johndoe@gmail.com"
                  {...register("gmail", { required: "Gmail is required" })}
                />
                {errors.gmail && (
                  <span className="text-sm text-red-500">
                    {errors.gmail.message}
                  </span>
                )}
              </div>

              {/* App Password */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-start items-center gap-1">
                  <Label htmlFor="appPassword">App Password </Label>
                  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                      <div
                        className="text-primary cursor-pointer text-sm"

                      >
(Dont have one?)
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                          <Info className="h-5 w-5" />
                          How to Generate an App Password
                        </DialogTitle>
                        <DialogDescription>
                          Follow these steps to create a Google App Password for
                          this application
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              1
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">
                                Open Google Account Settings
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Go to your Google Account settings page
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              2
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">
                                Enable 2-Step Verification
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Navigate to{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                  Security → 2-Step Verification
                                </code>{" "}
                                and enable it if not already enabled
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              3
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">
                                Access App Passwords
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Go to{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                  Security → App Passwords
                                </code>
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              4
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">Generate Password</p>
                              <p className="text-sm text-muted-foreground">
                                Create a new app password for &quot;Email
                                Sender&quot; or &quot;Mail&quot;
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              5
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">Copy and Save</p>
                              <p className="text-sm text-muted-foreground">
                                Copy the generated 16-character password and
                                paste it in the form
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Important Note
                              </p>
                              <p className="text-xs text-muted-foreground">
                                App passwords can only be used with apps or
                                services that don&apos;t support 2-Step
                                Verification. Make sure to keep your app
                                password secure.
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
                    placeholder="* * * * * *"
                    {...register("appPassword", {
                      required: "App Password is required",
                    })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>

                {errors.appPassword && (
                  <span className="text-sm text-red-500">
                    {errors.appPassword.message}
                  </span>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button className="w-full mt-4" type="submit">
              Save
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Is this an App Password?</DialogTitle>
            <DialogDescription>
              Please ensure you are using a <strong>Google App Password</strong>
              , not your regular Google login password.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleConfirmLogin}>
              Yes, it is an App Password
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setModalOpen(true);
              }}
            >
              No, I don&apos;t have one (Help)
            </Button>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
