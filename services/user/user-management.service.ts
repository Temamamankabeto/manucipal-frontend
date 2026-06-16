import { userService } from "@/services/user/user.service";
import { roleService } from "@/services/user/role.service";
import { permissionService } from "@/services/user/permission.service";

export const userManagementService = {
  users: userService,
  roles: roleService,
  permissions: permissionService,
};

export default userManagementService;
