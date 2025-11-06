"use client";
import { Button } from "@/components/ui/button";
import AuthGuard from "./components/AuthGuard";
import EmailForm from "./components/EmailForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ui/mode-toggle";

const queryClient = new QueryClient();
export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  return (
    <AuthGuard>
      <div className="p-4 md:p-8 flex w-[100vw] justify-between items-center ">
        <span className="text-2xl md:text-4xl font-light text-primary ">
          EmailxSender
        </span>
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => {
              auth.logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
          <ModeToggle />
        </div>
      </div>
      <QueryClientProvider client={queryClient}>
        <EmailForm />
      </QueryClientProvider>
    </AuthGuard>
  );
}
