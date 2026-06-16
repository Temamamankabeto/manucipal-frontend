"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/language/language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getDashboardForRole } from "@/config/dashboard.config";
import { useUnreadNotificationsQuery } from "@/hooks";
import SidebarContent from "@/layouts/components/SidebarContent";
import { authService, type AuthUser } from "@/services/auth/auth.service";
import { useTranslation } from "react-i18next";

export default function DashboardHeader({
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  const { data: unreadNotificationData } = useUnreadNotificationsQuery();

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, [pathname]);

  const role = authService.getStoredRoles()[0] ?? user?.role ?? "Super Admin";
  const dashboard = getDashboardForRole(role);

  const unreadCount = useMemo(() => {
    const value = unreadNotificationData as { count?: number } | number | undefined;

    if (typeof value === "number") {
      return value;
    }

    return value?.count ?? 0;
  }, [unreadNotificationData]);

  async function logout() {
    await authService.logout();
    toast.success("Logged out");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Open sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("current_workspace")}</p>
          <h2 className="truncate text-sm font-semibold md:text-base">{dashboard.roleName}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <LanguageSwitcher />
        <Button asChild variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Link href="/dashboard/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </Button>

        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">{t("signed_in_as")}</p>
          <p className="max-w-40 truncate text-sm font-medium">{user?.name ?? user?.email ?? "User"}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="User menu">
              <UserCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="truncate text-sm font-semibold">{user?.name ?? "User"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications">
                <Bell className="mr-2 h-4 w-4" />
                {t("notifications")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
