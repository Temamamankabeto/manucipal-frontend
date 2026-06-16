"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, LockKeyhole, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { authService } from "@/services/auth/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login({
        login,
        password,
      });

      authService.saveSession(response);

      toast.success("Logged in successfully");

      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Section */}
        <section className="hidden items-center justify-center border-r bg-background px-12 lg:flex">
          <div className="max-w-xl">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Adama Municipality
                </h1>

                <p className="text-muted-foreground">
                  Municipality Automation System
                </p>
              </div>
            </div>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
              Integrated Municipality Administration and Workflow Management Platform
            </h2>

            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Manage municipal operations, procurement, payments,
              documents, workflows, assets, human resources,
              and reporting from a unified digital platform.
            </p>
          </div>
        </section>

        {/* Right Section */}
        <section className="flex items-center justify-center bg-background p-6 lg:p-10">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                Adama Municipality
              </h1>

              <p className="text-muted-foreground">
                Municipality Automation System
              </p>
            </div>

            <Card className="border shadow-lg">
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LockKeyhole className="h-7 w-7" />
                </div>

                <div>
                  <CardTitle className="text-2xl font-semibold">
                    Sign In
                  </CardTitle>

                  <CardDescription className="mt-2">
                    Access the Municipality Automation System.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form
                  onSubmit={onSubmit}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login">
                      Email or Phone Number
                    </Label>

                    <Input
                      id="login"
                      type="text"
                      value={login}
                      onChange={(event) =>
                        setLogin(event.target.value)
                      }
                      autoComplete="username"
                      placeholder="example@email.com or 09xxxxxxxx"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password
                    </Label>

                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}

                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}