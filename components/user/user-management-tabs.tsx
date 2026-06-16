"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/auth/permissions";

const tabs = [
  { label: "Users", href: "/dashboard/users", match: "/dashboard/users", permission: "users.read" },
  { label: "Roles", href: "/dashboard/users/roles", match: "/dashboard/users/roles", permission: "roles.read" },
  { label: "Permissions", href: "/dashboard/users/permissions", match: "/dashboard/users/permissions", permission: "permissions.read" },
];

export default function UserManagementTabs() {
  const pathname = usePathname();
  const visibleTabs = tabs.filter((tab) => can(tab.permission));

  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {visibleTabs.map((tab) => {
        const active = pathname === tab.match;
        return (
          <Button key={tab.href} asChild variant={active ? "default" : "ghost"} size="sm">
            <Link href={tab.href}>{tab.label}</Link>
          </Button>
        );
      })}
    </div>
  );
}
