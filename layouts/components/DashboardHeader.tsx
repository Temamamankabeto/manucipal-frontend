"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ExternalLink,
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
import { useNotificationsQuery, useUnreadNotificationsQuery } from "@/hooks";
import SidebarContent from "@/layouts/components/SidebarContent";
import { authService, type AuthUser } from "@/services/auth/auth.service";
import { useTranslation } from "react-i18next";

type ActionNotification = {
  id: string | number;
  title?: string;
  message?: string;
  created_at?: string | null;
  data?: {
    redirect_url?: string;
    status?: string;
    request_no?: string;
  } | null;
};

function toTranslationKey(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function translateText(t: (key: string, options?: Record<string, unknown>) => string, value: string) {
  const key = toTranslationKey(value);
  return key ? t(key, { defaultValue: value }) : value;
}

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
  const notificationsQuery = useNotificationsQuery({ page: 1, per_page: 8 });

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

  const actionNotifications = useMemo<ActionNotification[]>(() => {
    return Array.isArray(notificationsQuery.data?.data)
      ? notificationsQuery.data.data
      : [];
  }, [notificationsQuery.data]);

  function openNotification(notification: ActionNotification) {
    const redirectUrl = notification.data?.redirect_url;

    if (!redirectUrl) {
      router.push("/dashboard/notifications");
      return;
    }

    router.push(redirectUrl);
  }

  async function logout() {
    await authService.logout();
    toast.success(t("logged_out", { defaultValue: "Logged out" }));
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label={t("open_sidebar", { defaultValue: "Open sidebar" })}>
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
          aria-label={sidebarCollapsed ? t("expand_sidebar", { defaultValue: "Expand sidebar" }) : t("collapse_sidebar", { defaultValue: "Collapse sidebar" })}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("current_workspace", { defaultValue: "Current workspace" })}</p>
          <h2 className="truncate text-sm font-semibold md:text-base">{translateText(t, dashboard.roleName)}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative" aria-label={t("notifications", { defaultValue: "Notifications" })}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between gap-3">
                <span>{t("action_needed", { defaultValue: "Action needed" })}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {unreadCount}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notificationsQuery.isLoading ? (
              <DropdownMenuItem disabled>{t("loading_notifications", { defaultValue: "Loading notifications..." })}</DropdownMenuItem>
            ) : actionNotifications.length === 0 ? (
              <DropdownMenuItem disabled>{t("no_action_needed_now", { defaultValue: "No action needed now." })}</DropdownMenuItem>
            ) : (
              actionNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer items-start gap-3 py-3"
                  onClick={() => openNotification(notification)}
                >
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{notification.title ?? t("action_needed", { defaultValue: "Action needed" })}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message ?? t("open_request_to_continue_workflow", { defaultValue: "Open this request to continue the workflow." })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications" className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("view_all_notifications", { defaultValue: "View all notifications" })}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">{t("signed_in_as", { defaultValue: "Signed in as" })}</p>
          <p className="max-w-40 truncate text-sm font-medium">{user?.name ?? user?.email ?? t("user", { defaultValue: "User" })}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t("user_menu", { defaultValue: "User menu" })}>
              <UserCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="truncate text-sm font-semibold">{user?.name ?? t("user", { defaultValue: "User" })}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                {t("profile", { defaultValue: "Profile" })}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications">
                <Bell className="mr-2 h-4 w-4" />
                {t("notifications", { defaultValue: "Notifications" })}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout", { defaultValue: "Logout" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
