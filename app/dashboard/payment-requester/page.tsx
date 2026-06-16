import WorkflowRoleDashboard from "@/components/dashboards/workflow-role-dashboard";

export default function PaymentRequesterDashboardPage() {
  return (
    <WorkflowRoleDashboard
      roleName="Payment Requester"
      title="Payment Request Dashboard"
      subtitle="Create, submit, and track your payment requests from one workspace."
      showProcurement={false}
      canCreatePayment
    />
  );
}
