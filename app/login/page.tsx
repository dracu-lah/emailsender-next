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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

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
    localStorage.setItem("auth", JSON.stringify(values));
    router.push("/");
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
                <Label htmlFor="appPassword">
                  App Password
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span>
                        <Button className="p-0" type="button" variant="link">
                          (?)
                        </Button>
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <span className="text-sm opacity-60">
                        Tip:
                        <br /> Go to Google Account → Security → App Passwords
                      </span>
                    </HoverCardContent>
                  </HoverCard>
                </Label>

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
    </div>
  );
};

export default LoginPage;
