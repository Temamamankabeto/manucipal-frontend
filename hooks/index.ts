export {
  useUsersQuery,
  useUserQuery,
  useRolesLiteQuery,
  useRolesLiteQuery as useUserRolesLiteQuery,
  useOfficesLiteQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserMutation,
  useResetUserPasswordMutation,
  useAssignUserRoleMutation,
} from "@/hooks/user/use-users";

export {
  useRolesQuery,
  useRolePermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignRolePermissionsMutation,
  useAvailableRolePermissionsQuery,
} from "@/hooks/user/use-roles";

export {
  usePermissionsQuery,
  useAllPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} from "@/hooks/user/use-permissions";

export {
  useOfficesQuery,
  useAllOfficesQuery,
  useOfficeTreeQuery,
  useOfficeQuery,
  useCreateOfficeMutation,
  useUpdateOfficeMutation,
  useToggleOfficeMutation,
  useDeleteOfficeMutation,
  useCitiesQuery,
  useAllCitiesQuery,
  useSubcitiesQuery,
  useAllSubcitiesQuery,
  useWoredasQuery,
  useAllWoredasQuery,
  useZonesQuery,
  useAllZonesQuery,
  useLocationLevelQuery,
  useLocationLevelAllQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useToggleLocationMutation,
  useDeleteLocationMutation,
} from "@/hooks/location/use-offices";

export { useAuditLogsQuery } from "@/hooks/user/use-audit-logs";

export {
  useNotificationsQuery,
  useUnreadNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/hooks/notification/use-notifications";

export {
  useProcurementRequests,
  useProcurementRequest,
  useCreateProcurementRequest,
  useProcurementAction,
} from "@/hooks/procurement/use-procurement";

export {
  usePaymentRequests,
  usePaymentRequest,
  useCreatePaymentRequest,
  usePaymentAction,
} from "@/hooks/payment/use-payment";
export { useTranslationsQuery, useCreateTranslationMutation, useUpdateTranslationMutation, useDeleteTranslationMutation } from "@/hooks/translation/use-translations";
