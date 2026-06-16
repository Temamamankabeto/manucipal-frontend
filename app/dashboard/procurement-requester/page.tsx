import WorkflowRoleDashboard from "@/components/dashboards/workflow-role-dashboard";

export default function ProcurementRequesterDashboardPage() {
  return (
    <WorkflowRoleDashboard
      roleName="Procurement Requester"
      title="Procurement Request Dashboard"
      subtitle="Create, submit, and track your procurement requests from one workspace."
      showPayment={false}
      canCreateProcurement
    />
  );
}
