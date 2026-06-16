"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Edit,
  Eye,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useOfficesLiteQuery,
  useResetUserPasswordMutation,
  useToggleUserMutation,
  useUpdateUserMutation,
  useUserRolesLiteQuery,
  useUsersQuery,
} from "@/hooks";

import { authService } from "@/services/auth/auth.service";
import { createUserSchema, updateUserSchema } from "@/lib/schemas/user.schema";

import type {
  AdminLevel,
  CreateUserPayload,
  OfficeItem,
  ProfessionalLevel,
  UpdateUserPayload,
  UserItem,
  UserStatus,
} from "@/types/user-management/user.type";

type UserForm = (CreateUserPayload | UpdateUserPayload) & {
  city_id?: number | null;
  professional_level?: ProfessionalLevel | null;
  signature?: File | null;
  stamp?: File | null;
  titer?: File | null;
};

const emptyCreate: CreateUserPayload & { city_id?: number | null } = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "Admin",
  admin_level: "zone",
  professional_level: null,
  address: "",
  office_id: null,
  sub_city_id: null,
  woreda_id: null,
  zone_id: null,
  city_id: null,
  signature: null,
  stamp: null,
  titer: null,
};

const emptyEdit: UpdateUserPayload & { city_id?: number | null } = {
  name: "",
  email: "",
  phone: "",
  role: "Admin",
  admin_level: "zone",
  professional_level: null,
  address: "",
  office_id: null,
  sub_city_id: null,
  woreda_id: null,
  zone_id: null,
  city_id: null,
  signature: null,
  stamp: null,
  titer: null,
};

const levelLabels: Record<AdminLevel, string> = {
  city: "City level",
  subcity: "Subcity level",
  woreda: "Woreda level",
  zone: "Zone level",
};


function normalizeRoleName(role?: string | null) {
  return (role || "").toLowerCase().trim();
}

function isPaymentProcurementRole(role?: string | null) {
  return [
    "manager",
    "head of development branch",
    "head of service branch",
    "planning & budget team leader",
    "planning & budget expert",
    "payment requester",
    "procurement requester",
    "record office",
    "records office",
    "finance",
    "finance accountant",
    "asset team leader",
    "machinery team leader",
  ].includes(normalizeRoleName(role));
}

function isPlanningBudgetExpert(role?: string | null) {
  return normalizeRoleName(role) === "planning & budget expert";
}

function isManagerUserContext(role?: string | null) {
  return ["manager", "head of development branch", "head of service branch"].includes(normalizeRoleName(role));
}


function numberOrNull(value?: string | null) {
  if (!value || value === "none") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function roleOf(user: UserItem) {
  if (user.role) return user.role;
  const first = user.roles?.[0];
  return !first ? "—" : typeof first === "string" ? first : first.name;
}

function findOffice(offices: OfficeItem[], id?: number | string | null) {
  return offices.find((office) => String(office.id) === String(id));
}

function findParent(offices: OfficeItem[], id?: number | string | null) {
  return findOffice(offices, id)?.parent_id ?? null;
}

function getCityId(form: UserForm, offices: OfficeItem[]) {
  if (form.city_id) return Number(form.city_id);

  if (form.admin_level === "city" && form.office_id) {
    return Number(form.office_id);
  }

  if (form.sub_city_id) {
    return findParent(offices, form.sub_city_id);
  }

  if (form.woreda_id) {
    const subcityId = findParent(offices, form.woreda_id);
    return findParent(offices, subcityId);
  }

  if (form.zone_id) {
    const woredaId = findParent(offices, form.zone_id);
    const subcityId = findParent(offices, woredaId);
    return findParent(offices, subcityId);
  }

  return null;
}

function getAllowedLevels(currentAdminLevel?: string | null, isSuperAdmin = false): AdminLevel[] {
  if (isSuperAdmin) return ["city", "subcity", "woreda", "zone"];

  if (currentAdminLevel === "city") return ["subcity", "woreda", "zone"];
  if (currentAdminLevel === "subcity") return ["woreda", "zone"];
  if (currentAdminLevel === "woreda") return ["zone"];

  return [];
}

export default function UsersPage() {
  const currentUser = authService.getStoredUser();
  const currentRole = authService.getStoredRoles()[0] ?? currentUser?.role ?? "";
  const currentAdminLevel = currentUser?.admin_level ?? null;
  const currentIsSuperAdmin = String(currentRole).toLowerCase().includes("super");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [createForm, setCreateForm] =
    useState<CreateUserPayload & { city_id?: number | null }>(emptyCreate);

  const [editForm, setEditForm] =
    useState<UpdateUserPayload & { city_id?: number | null }>(emptyEdit);

  const [newPassword, setNewPassword] = useState("");

  const params = useMemo(
    () => ({
      search,
      status,
      page,
      per_page: 10,
    }),
    [search, status, page]
  );

  const usersQuery = useUsersQuery(params);
  const roles = useUserRolesLiteQuery().data ?? [];
  const offices = useOfficesLiteQuery().data ?? [];

  const createUser = useCreateUserMutation(() => {
    setCreateOpen(false);
    setCreateForm(emptyCreate);
    toast.success("User created");
  });

  const updateUser = useUpdateUserMutation(() => {
    setEditOpen(false);
    setSelectedUser(null);
    toast.success("User updated");
  });

  const toggleUser = useToggleUserMutation(() => toast.success("User status updated"));
  const removeUser = useDeleteUserMutation(() => toast.success("User deleted"));

  const resetPassword = useResetUserPasswordMutation(() => {
    setResetOpen(false);
    setSelectedUser(null);
    setNewPassword("");
    toast.success("Password reset");
  });

  const rows = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const busy = createUser.isPending || updateUser.isPending || resetPassword.isPending;

  function openCreate() {
    const levels = getAllowedLevels(currentAdminLevel, currentIsSuperAdmin);
    setCreateForm({
      ...emptyCreate,
      admin_level: levels[0] ?? "zone",
      professional_level: null,
    });
    setCreateOpen(true);
  }

  function openEdit(user: UserItem) {
    setSelectedUser(user);
    setEditForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      role: roleOf(user) || "Admin",
      admin_level: user.admin_level ?? "zone",
      professional_level: user.professional_level ?? null,
      office_id: user.office_id ?? null,
      sub_city_id: user.sub_city_id ?? null,
      woreda_id: user.woreda_id ?? null,
      zone_id: user.zone_id ?? null,
      city_id: user.office?.type === "city" ? user.office.id : null,
      signature: null,
      stamp: null,
      titer: null,
    });
    setEditOpen(true);
  }

  function preparePayload<T extends UserForm>(form: T): T {
    const workflowRole = isPaymentProcurementRole(form.role);

    return {
      ...form,
      address: workflowRole ? "" : form.address,
      admin_level: workflowRole ? null : form.admin_level,
      office_id: workflowRole || form.admin_level === "zone" ? null : form.office_id,
      sub_city_id: workflowRole ? null : form.sub_city_id,
      woreda_id: workflowRole ? null : form.woreda_id,
      zone_id: workflowRole ? null : form.zone_id,
      professional_level: isPlanningBudgetExpert(form.role) ? form.professional_level : null,
    };
  }

  function submitCreate(event: FormEvent) {
    event.preventDefault();

    const payload = preparePayload(createForm);
    const parsed = createUserSchema.safeParse(payload);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid user data");
      return;
    }

    createUser.mutate(parsed.data);
  }

  function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;

    const payload = preparePayload(editForm);
    const parsed = updateUserSchema.safeParse(payload);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid user data");
      return;
    }

    updateUser.mutate({
      id: selectedUser.id,
      payload: parsed.data,
    });
  }

  function submitReset(event: FormEvent) {
    event.preventDefault();

    if (!selectedUser || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    resetPassword.mutate({
      id: selectedUser.id,
      payload: { new_password: newPassword },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and office scope for the municipality system.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>User List</CardTitle>

            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 md:w-72"
                  placeholder="Search name, email or phone..."
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                />
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value as UserStatus | "all");
                }}
              >
                <SelectTrigger className="md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>


              <Button variant="outline" onClick={() => usersQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {usersQuery.isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone ?? "—"}</TableCell>
                        <TableCell>{roleOf(user)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "disabled" ? "secondary" : "default"
                            }
                          >
                            {user.status ?? "active"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/users/${user.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() => setTimeout(() => openEdit(user), 0)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() =>
                                  setTimeout(() => toggleUser.mutate(user.id), 0)
                                }
                              >
                                {user.status === "disabled" ? (
                                  <UserCheck className="mr-2 h-4 w-4" />
                                ) : (
                                  <UserX className="mr-2 h-4 w-4" />
                                )}
                                {user.status === "disabled" ? "Enable" : "Disable"}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() =>
                                  setTimeout(() => {
                                    setSelectedUser(user);
                                    setNewPassword("");
                                    setResetOpen(true);
                                  }, 0)
                                }
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset password
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() =>
                                  setTimeout(() => setDeleteUser(user), 0)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && meta.last_page > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {meta.current_page} of {meta.last_page} • {meta.total} users
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Create a user with the correct role and administrative scope.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitCreate}>
            <UserFields
              form={createForm}
              roles={roles.map((role) => role.name)}
              offices={offices}
              currentAdminLevel={currentAdminLevel}
              currentUser={currentUser}
              currentRole={currentRole}
              currentIsSuperAdmin={currentIsSuperAdmin}
              onChange={setCreateForm}
              includePassword
            />

            <Button className="w-full" disabled={busy}>
              {createUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save user
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update profile, role, level, and administrative scope.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitEdit}>
            <UserFields
              form={editForm}
              roles={roles.map((role) => role.name)}
              offices={offices}
              currentAdminLevel={currentAdminLevel}
              currentUser={currentUser}
              currentRole={currentRole}
              currentIsSuperAdmin={currentIsSuperAdmin}
              onChange={setEditForm}
            />

            <Button className="w-full" disabled={busy}>
              {updateUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update user
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name ?? "this user"}.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitReset}>
            <div className="grid gap-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reset password
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteUser)}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {deleteUser?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteUser) removeUser.mutate(deleteUser.id);
                setDeleteUser(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserFields({
  form,
  roles,
  offices,
  currentAdminLevel,
  currentUser,
  currentRole,
  currentIsSuperAdmin,
  onChange,
  includePassword = false,
}: {
  form: UserForm;
  roles: string[];
  offices: OfficeItem[];
  currentAdminLevel?: string | null;
  currentUser: any;
  currentRole?: string | null;
  currentIsSuperAdmin: boolean;
  onChange: (form: any) => void;
  includePassword?: boolean;
}) {
  const isSuperAdmin = form.role === "Super Admin";
  const isWorkflowRole = isPaymentProcurementRole(form.role);
  const isPlanningExpert = isPlanningBudgetExpert(form.role);
  const hideMunicipalityScope = isWorkflowRole || isManagerUserContext(currentRole ?? currentUser?.role);
  const allowedLevels = getAllowedLevels(currentAdminLevel, currentIsSuperAdmin);

  const selectedCityId = getCityId(form, offices);

  const currentWoredaId = currentUser?.woreda_id ?? null;
  const currentSubcityId = currentUser?.sub_city_id ?? null;

  const isWoredaCreatingZone =
    currentAdminLevel === "woreda" && form.admin_level === "zone";

  const cities = offices.filter((office) => office.type === "city");

  const subCities = offices.filter(
    (office) =>
      office.type === "subcity" && (!selectedCityId || office.parent_id === selectedCityId)
  );

  const woredas = offices.filter((office) => {
    if (office.type !== "woreda") return false;
    if (currentAdminLevel === "subcity") {
      return String(office.parent_id) === String(currentSubcityId);
    }
    return !form.sub_city_id || office.parent_id === form.sub_city_id;
  });

  const zones = offices.filter((office) => {
    if (office.type !== "zone") return false;

    if (isWoredaCreatingZone) {
      return String(office.parent_id) === String(currentWoredaId);
    }

    return !form.woreda_id || office.parent_id === form.woreda_id;
  });

  function setRole(role: string) {
    onChange({
      ...form,
      role,
      admin_level: role === "Super Admin" || isPaymentProcurementRole(role) ? null : (allowedLevels[0] ?? "zone"),
      professional_level: isPlanningBudgetExpert(role) ? (form.professional_level ?? "IV") : null,
      city_id: null,
      office_id: null,
      sub_city_id: null,
      woreda_id: null,
      zone_id: null,
    });
  }

  function setLevel(level: AdminLevel) {
    onChange({
      ...form,
      admin_level: level,
      city_id: null,
      office_id: null,
      sub_city_id: currentAdminLevel === "subcity" ? currentSubcityId : null,
      woreda_id: currentAdminLevel === "woreda" ? currentWoredaId : null,
      zone_id: null,
    });
  }

  function setCity(id: number | null) {
    onChange({
      ...form,
      city_id: id,
      office_id: form.admin_level === "city" ? id : null,
      sub_city_id: null,
      woreda_id: null,
      zone_id: null,
    });
  }

  function setSubcity(id: number | null) {
    onChange({
      ...form,
      sub_city_id: id,
      office_id: form.admin_level === "subcity" ? id : null,
      woreda_id: null,
      zone_id: null,
    });
  }

  function setWoreda(id: number | null) {
    onChange({
      ...form,
      woreda_id: id,
      office_id: form.admin_level === "woreda" ? id : null,
      zone_id: null,
    });
  }

  function setZone(id: number | null) {
    onChange({
      ...form,
      zone_id: id,
      office_id: form.admin_level === "zone" ? null : id,
      sub_city_id: isWoredaCreatingZone ? currentSubcityId : form.sub_city_id,
      woreda_id: isWoredaCreatingZone ? currentWoredaId : form.woreda_id,
    });
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(event) => onChange({ ...form, phone: event.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Role</Label>
          <Select value={form.role || "Admin"} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hideMunicipalityScope ? (
        <div className="grid gap-2">
          <Label>Address</Label>
          <Input
            value={form.address ?? ""}
            onChange={(event) => onChange({ ...form, address: event.target.value })}
          />
        </div>
      ) : null}

      {isPlanningExpert ? (
        <div className="grid gap-2">
          <Label>Level</Label>
          <Select
            value={form.professional_level ?? "IV"}
            onValueChange={(value) =>
              onChange({ ...form, professional_level: value as ProfessionalLevel })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IV">IV</SelectItem>
              <SelectItem value="III">III</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This level is required only for Planning & Budget Expert.
          </p>
        </div>
      ) : null}

      {!isSuperAdmin && !hideMunicipalityScope ? (
        <>
          <div className="grid gap-2">
            <Label>Admin Level</Label>
            <Select
              value={form.admin_level ?? allowedLevels[0] ?? "zone"}
              onValueChange={(value) => setLevel(value as AdminLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {levelLabels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isWoredaCreatingZone ? (
            <div className="grid gap-2">
              <Label>Zone</Label>
              <Select
                value={form.zone_id ? String(form.zone_id) : "none"}
                onValueChange={(next) => setZone(numberOrNull(next))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {zones.map((office) => (
                    <SelectItem key={office.id} value={String(office.id)}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                City, Subcity, and Woreda are assigned automatically from your Woreda scope.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <OfficeSelect
                label="City"
                value={selectedCityId}
                offices={cities}
                disabled={!currentIsSuperAdmin}
                onValueChange={setCity}
              />

              <OfficeSelect
                label="Subcity"
                value={form.sub_city_id}
                offices={subCities}
                disabled={
                  !selectedCityId ||
                  !["subcity", "woreda", "zone"].includes(form.admin_level ?? "")
                }
                onValueChange={setSubcity}
              />

              <OfficeSelect
                label="Woreda"
                value={form.woreda_id}
                offices={woredas}
                disabled={!form.sub_city_id || !["woreda", "zone"].includes(form.admin_level ?? "")}
                onValueChange={setWoreda}
              />

              <OfficeSelect
                label="Zone"
                value={form.zone_id}
                offices={zones}
                disabled={!form.woreda_id || form.admin_level !== "zone"}
                onValueChange={setZone}
              />
            </div>
          )}
        </>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Signature</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              onChange({
                ...form,
                signature: event.target.files?.[0] ?? null,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Used on procurement/payment approval documents.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Stamp</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              onChange({
                ...form,
                stamp: event.target.files?.[0] ?? null,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Used by Records Office for official stamping.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Titer</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              onChange({
                ...form,
                titer: event.target.files?.[0] ?? null,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Personal title stamp image, used beside signatures on official documents.
          </p>
        </div>
      </div>

      {includePassword && "password" in form ? (
        <div className="grid gap-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(event) => onChange({ ...form, password: event.target.value })}
            required
            minLength={8}
          />
        </div>
      ) : null}
    </>
  );
}

function OfficeSelect({
  label,
  value,
  offices,
  disabled,
  onValueChange,
}: {
  label: string;
  value?: number | null;
  offices: OfficeItem[];
  disabled?: boolean;
  onValueChange: (value: number | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select
        value={value ? String(value) : "none"}
        onValueChange={(next) => onValueChange(numberOrNull(next))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {offices.map((office) => (
            <SelectItem key={office.id} value={String(office.id)}>
              {office.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}