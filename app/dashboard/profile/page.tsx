"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Mail, Phone, Shield, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService, type AuthUser } from "@/services/auth/auth.service";
import { useChangePasswordMutation } from "@/hooks/profile/use-profile";

const emptyPasswordForm = {
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
};

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

  const changePassword = useChangePasswordMutation(() => {
    toast.success("Password updated successfully");
    setPasswordForm(emptyPasswordForm);
  });

  useEffect(() => {
    setUser(authService.getStoredUser());
    setRoles(authService.getStoredRoles());
  }, []);

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toast.error("New password confirmation does not match");
      return;
    }

    changePassword.mutate(passwordForm, {
      onError: (error) => {
        toast.error(error.message || "Failed to update password");
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account, role, and security information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{user?.name ?? "Not available"}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </p>
            <p className="font-medium">{user?.email ?? "Not available"}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Phone
            </p>
            <p className="font-medium">{user?.phone ?? "Not available"}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Role
            </p>
            <p className="font-medium">{roles.length ? roles.join(", ") : user?.role ?? "Not available"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitPassword} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, new_password: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
              <Input
                id="new_password_confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.new_password_confirmation}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    new_password_confirmation: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="md:col-span-3">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
