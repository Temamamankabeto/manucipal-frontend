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
  useDepartmentsLiteQuery,
  useOfficesLiteQuery,
  useResetUserPasswordMutation,
  useToggleUserMutation,
  useUpdateUserMutation,
  useUserRolesLiteQuery,
  useUsersQuery,
} from "@/hooks";

import { createUserSchema, updateUserSchema } from "@/lib/schemas/user.schema";

import type {
  CreateUserPayload,
  DepartmentItem,
  OfficeItem,
  UpdateUserPayload,
  UserItem,
  UserStatus,
} from "@/types/user-management/user.type";

type UserForm = (CreateUserPayload | UpdateUserPayload) & {
  signature?: File | null;
  stamp?: File | null;
  titer?: File | null;
};

const DEFAULT_ROLE = "Manager";

const DEFAULT_ROLE_OPTIONS = [
  "Super admin",
  "Manager",
  "Head of Development Branch",
  "Head of Service Branch",
  "Team Leader",
  "Expert",
  "Secretory",
  "Accountant",
  "Record Officer",
];

const ROLE_ALIASES: Record<string, string> = {
  super_admin: "Super admin",
  "super admin": "Super admin",
  "Super Admin": "Super admin",
  manager: "Manager",
  head_of_development_branch: "Head of Development Branch",
  "head of development branch": "Head of Development Branch",
  head_of_service_branch: "Head of Service Branch",
  "head of service branch": "Head of Service Branch",
  team_leader: "Team Leader",
  "team leader": "Team Leader",
  "Team leader": "Team Leader",
  "Team Leader (Department Head)": "Team Leader",
  expert: "Expert",
  secretory: "Secretory",
  secretary: "Secretory",
  accountant: "Accountant",
  record_officer: "Record Officer",
  "record officer": "Record Officer",
};

function normalizeRoleName(role?: string | null) {
  if (!role) return null;
  const trimmed = role.trim();
  return ROLE_ALIASES[trimmed] ?? ROLE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

function uniqueRoles(roles: string[]) {
  const source = roles.length > 0 ? roles : DEFAULT_ROLE_OPTIONS;
  return Array.from(
    new Set(source.map((role) => normalizeRoleName(role)).filter(Boolean) as string[])
  );
}

const emptyCreate: CreateUserPayload = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: DEFAULT_ROLE,
  admin_level: null,
  professional_level: null,
  address: "",
  office_id: null,
  department_id: null,
  sub_city_id: null,
  woreda_id: null,
  zone_id: null,
  signature: null,
  stamp: null,
  titer: null,
};

const emptyEdit: UpdateUserPayload = {
  name: "",
  email: "",
  phone: "",
  role: DEFAULT_ROLE,
  admin_level: null,
  professional_level: null,
  address: "",
  office_id: null,
  department_id: null,
  sub_city_id: null,
  woreda_id: null,
  zone_id: null,
  signature: null,
  stamp: null,
  titer: null,
};

function numberOrNull(value?: string | null) {
  if (!value || value === "none") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function roleOf(user: UserItem) {
  const first = user.roles?.[0];
  const rawRole =
    user.role ??
    user.display_role ??
    (!first ? null : typeof first === "string" ? first : first.name);

  return normalizeRoleName(rawRole) ?? "—";
}

function selectedRole(roles: string[]) {
  const normalizedRoles = uniqueRoles(roles);
  return normalizedRoles.includes(DEFAULT_ROLE) ? DEFAULT_ROLE : normalizedRoles[0] ?? DEFAULT_ROLE;
}

function departmentsForOffice(
  officeId: number | string | null | undefined,
  departments: DepartmentItem[] = [],
) {
  if (!officeId) return [];

  const selectedOfficeId = Number(officeId);

  return departments.filter(
    (department) => Number(department.office_id) === selectedOfficeId,
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [createForm, setCreateForm] = useState<CreateUserPayload>(emptyCreate);
  const [editForm, setEditForm] = useState<UpdateUserPayload>(emptyEdit);
  const [newPassword, setNewPassword] = useState("");

  const params = useMemo(
    () => ({ search, status, page, per_page: 10 }),
    [search, status, page]
  );

  const usersQuery = useUsersQuery(params);
  const roles = useUserRolesLiteQuery().data ?? [];
  const offices = useOfficesLiteQuery().data ?? [];

  const createDepartmentsQuery = useDepartmentsLiteQuery({ office_id: createForm.office_id });
  const editDepartmentsQuery = useDepartmentsLiteQuery({ office_id: editForm.office_id });

  const createDepartments = useMemo(
    () => departmentsForOffice(createForm.office_id, createDepartmentsQuery.data ?? []),
    [createForm.office_id, createDepartmentsQuery.data],
  );

  const editDepartments = useMemo(
    () => departmentsForOffice(editForm.office_id, editDepartmentsQuery.data ?? []),
    [editForm.office_id, editDepartmentsQuery.data],
  );

  const roleNames = useMemo(() => uniqueRoles(roles.map((role) => role.name)), [roles]);

  const createUser = useCreateUserMutation(() => {
    setCreateOpen(false);
    setCreateForm({ ...emptyCreate, role: selectedRole(roleNames) });
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
    setCreateForm({ ...emptyCreate, role: selectedRole(roleNames) });
    setCreateOpen(true);
  }

  function openEdit(user: UserItem) {
    setSelectedUser(user);
    setEditForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      role: roleOf(user) !== "—" ? roleOf(user) : selectedRole(roleNames),
      admin_level: null,
      professional_level: null,
      office_id: user.office_id ?? null,
      department_id: user.department_id ?? null,
      sub_city_id: null,
      woreda_id: null,
      zone_id: null,
      signature: null,
      stamp: null,
      titer: null,
    });
    setEditOpen(true);
  }

  function preparePayload<T extends UserForm>(form: T): T {
    return {
      ...form,
      admin_level: null,
      professional_level: null,
      sub_city_id: null,
      woreda_id: null,
      zone_id: null,
      department_id: form.department_id ?? null,
    };
  }

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    const parsed = createUserSchema.safeParse(preparePayload(createForm));

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid user data");
      return;
    }

    createUser.mutate(parsed.data);
  }

  function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;

    const parsed = updateUserSchema.safeParse(preparePayload(editForm));

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid user data");
      return;
    }

    updateUser.mutate({ id: selectedUser.id, payload: parsed.data });
  }

  function submitReset(event: FormEvent) {
    event.preventDefault();

    if (!selectedUser || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    resetPassword.mutate({ id: selectedUser.id, payload: { new_password: newPassword } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage users with office assignment and optional department scope.
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
                    <TableHead>Office</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
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
                        <TableCell>{user.office?.name ?? "—"}</TableCell>
                        <TableCell>{user.department?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "disabled" ? "secondary" : "default"}>
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

                              <DropdownMenuItem onSelect={() => setTimeout(() => openEdit(user), 0)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem onSelect={() => setTimeout(() => toggleUser.mutate(user.id), 0)}>
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

                              <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => setDeleteUser(user), 0)}>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Previous
                </Button>

                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>
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
            <DialogDescription>Select role, office, and optional department.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitCreate}>
            <UserFields
              form={createForm}
              roles={roleNames}
              offices={offices}
              departments={createDepartments}
              onChange={setCreateForm}
              includePassword
            />

            <Button className="w-full" disabled={busy}>
              {createUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save user
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update profile, role, office, and department.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitEdit}>
            <UserFields
              form={editForm}
              roles={roleNames}
              offices={offices}
              departments={editDepartments}
              onChange={setEditForm}
            />

            <Button className="w-full" disabled={busy}>
              {updateUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update user
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name ?? "this user"}.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitReset}>
            <div className="grid gap-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
            </div>

            <Button className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reset password
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
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
  departments,
  onChange,
  includePassword = false,
}: {
  form: UserForm;
  roles: string[];
  offices: OfficeItem[];
  departments: DepartmentItem[];
  onChange: (form: any) => void;
  includePassword?: boolean;
}) {
  function setOffice(officeId: number | null) {
    onChange({
      ...form,
      office_id: officeId,
      department_id: null,
      admin_level: null,
      professional_level: null,
      sub_city_id: null,
      woreda_id: null,
      zone_id: null,
    });
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
        </div>

        <div className="grid gap-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} required />
        </div>

        <div className="grid gap-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} required />
        </div>

        <div className="grid gap-2">
          <Label>Role</Label>
          <Select
            value={normalizeRoleName(form.role) ?? selectedRole(roles)}
            onValueChange={(role) => onChange({ ...form, role })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {uniqueRoles(roles).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <OfficeSelect label="Office" value={form.office_id} offices={offices} onValueChange={setOffice} />

        <DepartmentSelect
          value={form.department_id}
          departments={departments}
          disabled={!form.office_id}
          onValueChange={(departmentId) => onChange({ ...form, department_id: departmentId })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Address</Label>
        <Input value={form.address ?? ""} onChange={(event) => onChange({ ...form, address: event.target.value })} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Signature</Label>
          <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange({ ...form, signature: event.target.files?.[0] ?? null })} />
        </div>

        <div className="grid gap-2">
          <Label>Stamp</Label>
          <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange({ ...form, stamp: event.target.files?.[0] ?? null })} />
        </div>

        <div className="grid gap-2">
          <Label>Titer</Label>
          <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange({ ...form, titer: event.target.files?.[0] ?? null })} />
        </div>
      </div>

      {includePassword && "password" in form ? (
        <div className="grid gap-2">
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} required minLength={8} />
        </div>
      ) : null}
    </>
  );
}

function OfficeSelect({
  label,
  value,
  offices,
  onValueChange,
}: {
  label: string;
  value?: number | null;
  offices: OfficeItem[];
  onValueChange: (value: number | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value ? String(value) : "none"} onValueChange={(next) => onValueChange(numberOrNull(next))}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" disabled>
            Select office
          </SelectItem>
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

function DepartmentSelect({
  value,
  departments,
  disabled,
  onValueChange,
}: {
  value?: number | null;
  departments: DepartmentItem[];
  disabled?: boolean;
  onValueChange: (value: number | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>Department Optional</Label>
      <Select value={value ? String(value) : "none"} onValueChange={(next) => onValueChange(numberOrNull(next))} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {!disabled && departments.length === 0 ? (
            <SelectItem value="__empty" disabled>
              No departments found for selected office
            </SelectItem>
          ) : null}
          {departments.map((department) => (
            <SelectItem key={`${department.office_id}-${department.id}`} value={String(department.id)}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
