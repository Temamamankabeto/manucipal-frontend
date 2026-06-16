import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  AssignUserRolePayload,
  CreateUserPayload,
  OfficeItem,
  PaginatedResponse,
  PermissionItem,
  PermissionListParams,
  ResetUserPasswordPayload,
  RoleItem,
  RoleListParams,
  UpdateUserPayload,
  UserItem,
  UserListParams,
} from "@/types/user-management/user.type";

function hasUserFiles(payload: CreateUserPayload | UpdateUserPayload) {
  return Boolean(
    (payload as any).signature instanceof File ||
      (payload as any).stamp instanceof File ||
      (payload as any).titer instanceof File,
  );
}

function toUserFormData(
  payload: CreateUserPayload | UpdateUserPayload | Record<string, unknown>,
  options: { includeEmptyNullable?: boolean } = {},
) {
  const form = new FormData();

  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined) return;

    if (key === "signature" || key === "stamp" || key === "titer") {
      if (value instanceof File) {
        form.append(key, value);
      }
      return;
    }

    if (value === null || value === "") {
      if (options.includeEmptyNullable) {
        form.append(key, "");
      }
      return;
    }

    form.append(key, String(value));
  });

  return form;
}

function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) {
  const out: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      out[key] = value;
    }
  });
  return out;
}

function paginated<T>(body: any): PaginatedResponse<T> {
  const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const meta = body?.meta ?? {};

  return {
    success: body?.success,
    message: body?.message,
    data,
    meta: {
      current_page: Number(meta.current_page ?? 1),
      per_page: Number(meta.per_page ?? data.length ?? 10),
      total: Number(meta.total ?? data.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

export const userService = {
  async list(params: UserListParams = {}) {
    const response = await api.get("/admin/users", { params: cleanParams(params) });
    return paginated<UserItem>(response.data);
  },

  async show(id: number | string) {
    const response = await api.get(`/admin/users/${id}`);
    return unwrap<ApiEnvelope<UserItem>>(response).data;
  },

  async create(payload: CreateUserPayload) {
    const hasFiles = hasUserFiles(payload);
    const body = hasFiles ? toUserFormData(payload) : payload;

    const response = await api.post(
      "/admin/users",
      body,
      hasFiles ? { headers: { "Content-Type": "multipart/form-data" } } : undefined,
    );

    return unwrap<ApiEnvelope<UserItem>>(response);
  },

  async update(id: number | string, payload: UpdateUserPayload) {
    // Always use multipart + method spoofing for updates so Laravel receives
    // signature, stamp, and titer files consistently.
    const body = toUserFormData(
      { ...(payload as Record<string, unknown>), _method: "PUT" },
      { includeEmptyNullable: true },
    );

    const response = await api.post(`/admin/users/${id}`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return unwrap<ApiEnvelope<UserItem>>(response);
  },

  async remove(id: number | string) {
    const response = await api.delete(`/admin/users/${id}`);
    return unwrap<ApiEnvelope<null>>(response);
  },

  async toggle(id: number | string) {
    const response = await api.patch(`/admin/users/${id}/toggle`);
    return unwrap<ApiEnvelope<UserItem>>(response);
  },

  async resetPassword(id: number | string, payload: ResetUserPasswordPayload) {
    const response = await api.post(`/admin/users/${id}/reset-password`, payload);
    return unwrap<ApiEnvelope<{ id: number | string }>>(response);
  },

  async assignRole(id: number | string, payload: AssignUserRolePayload) {
    const response = await api.post(`/admin/users/${id}/roles`, payload);
    return unwrap<ApiEnvelope<UserItem>>(response);
  },

  async rolesLite() {
    const response = await api.get("/admin/users/roles-lite");
    return Array.isArray(response.data?.data) ? (response.data.data as RoleItem[]) : [];
  },

  async officesLite(params: { type?: string; parent_id?: number | string | null } = {}) {
    const response = await api.get("/admin/users/offices-lite", { params: cleanParams(params) });
    return Array.isArray(response.data?.data) ? (response.data.data as OfficeItem[]) : [];
  },

  async roles(params: RoleListParams = {}) {
    const response = await api.get("/admin/roles", { params: cleanParams(params) });
    return paginated<RoleItem>(response.data);
  },

  async permissions(params: PermissionListParams = { all: true }) {
    const response = await api.get("/admin/permissions", { params: cleanParams(params) });
    return Array.isArray(response.data?.data) ? (response.data.data as PermissionItem[]) : [];
  },
};

export default userService;
