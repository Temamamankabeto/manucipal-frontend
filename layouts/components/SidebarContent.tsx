"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

import { filterSidebarByPermissions, getSidebarForRole } from "@/config/sidebar.config";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth/auth.service";
import { paymentService } from "@/services/payment/payment.service";
import { procurementService } from "@/services/procurement/procurement.service";

type Props = {
  collapsed?: boolean;
};

function normalizeRole(role?: string | null) {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function isRecordOfficeRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "record-office" || normalized === "records-office";
}

function SidebarBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <sup className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm">
      {count > 99 ? "99+" : count}
    </sup>
  );
}

export default function SidebarContent({ collapsed = false }: Props) {
  const pathname = usePathname();
  const user = authService.getStoredUser();
  const roles = authService.getStoredRoles();
  const role = roles[0] ?? user?.role ?? "Super Admin";
  const permissions = authService.getStoredPermissions();
  const recordOffice = isRecordOfficeRole(role);

  const roleSidebar = useMemo(
    () => getSidebarForRole(role, user?.admin_level),
    [role, user?.admin_level],
  );

  const sections = filterSidebarByPermissions(roleSidebar, permissions, role);
  const RoleIcon = roleSidebar.icon;
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const { data: recordPaymentData } = useQuery({
    queryKey: ["record-office", "payment", "records-processing-count"],
    queryFn: () => paymentService.list({ status: "records_processing", per_page: 1 }),
    enabled: recordOffice,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const { data: recordProcurementData } = useQuery({
    queryKey: ["record-office", "procurement", "records-processing-count"],
    queryFn: () => procurementService.list({ status: "records_processing", per_page: 1 }),
    enabled: recordOffice,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const recordPaymentCount = Number(recordPaymentData?.meta?.total ?? 0);
  const recordProcurementCount = Number(recordProcurementData?.meta?.total ?? 0);

  function getRecordOfficeBadgeCount(sectionTitle: string, label: string) {
    if (!recordOffice) return 0;

    const normalizedSection = sectionTitle.toLowerCase();
    const normalizedLabel = label.toLowerCase();

    if (normalizedSection.includes("payment") || normalizedLabel.includes("payment")) {
      return recordPaymentCount;
    }

    if (normalizedSection.includes("procurement") || normalizedLabel.includes("procurement")) {
      return recordProcurementCount;
    }

    return 0;
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border p-4">
        <div
          className={cn(
            "flex items-center rounded-2xl bg-sidebar-accent p-3",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="rounded-xl bg-sidebar-primary p-2 text-sidebar-primary-foreground">
            <RoleIcon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold">Adama Municipality</h1>
              <p className="truncate text-xs text-sidebar-foreground/70">{roleSidebar.title}</p>
            </div>
          )}
        </div>
      </div>

      <nav className={cn("flex-1 space-y-5 overflow-y-auto", collapsed ? "p-2" : "p-4")}>
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            {!collapsed && (
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.href ? pathname === item.href : false;
                const hasChildren = Boolean(item.children?.length);
                const childIsActive = Boolean(item.children?.some((child) => pathname === child.href));
                const isOpen = openMenus[item.label] ?? childIsActive;
                const itemBadgeCount = getRecordOfficeBadgeCount(section.title, item.label);

                if (hasChildren) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        title={collapsed ? item.label : undefined}
                        onClick={() =>
                          setOpenMenus((current) => ({
                            ...current,
                            [item.label]: !current[item.label],
                          }))
                        }
                        className={cn(
                          "relative flex w-full items-center rounded-xl text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-2",
                          childIsActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {collapsed && itemBadgeCount > 0 ? (
                          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground">
                            {itemBadgeCount > 99 ? "99+" : itemBadgeCount}
                          </span>
                        ) : null}
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">
                              {item.label}
                              <SidebarBadge count={itemBadgeCount} />
                            </span>
                            <ChevronRight
                              className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-90")}
                            />
                          </>
                        )}
                      </button>

                      {!collapsed && isOpen && (
                        <div className="ml-6 space-y-1 border-l border-sidebar-border pl-2">
                          {item.children?.map((child) => {
                            const childBadgeCount = getRecordOfficeBadgeCount(section.title, child.label);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-sidebar-accent",
                                  pathname === child.href && "bg-sidebar-primary text-sidebar-primary-foreground",
                                )}
                              >
                                <span className="truncate">{child.label}</span>
                                <SidebarBadge count={childBadgeCount} />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href ?? item.label}
                    href={item.href ?? "#"}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center rounded-xl text-sm font-medium transition hover:bg-sidebar-accent",
                      collapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-2",
                      active && "bg-sidebar-primary text-sidebar-primary-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {collapsed && itemBadgeCount > 0 ? (
                      <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground">
                        {itemBadgeCount > 99 ? "99+" : itemBadgeCount}
                      </span>
                    ) : null}
                    {!collapsed && (
                      <span className="flex min-w-0 flex-1 items-center">
                        <span className="truncate">{item.label}</span>
                        <SidebarBadge count={itemBadgeCount} />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
