"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  History,
  Printer,
  Paperclip,
  Send,
  Stamp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useProcurementAction,
  useProcurementRequest,
} from "@/hooks/procurement/use-procurement";
import { authService } from "@/services/auth/auth.service";
import { procurementService } from "@/services/procurement/procurement.service";
import type { ProcurementItem } from "@/types/procurement/procurement.type";

const ETHIOPIAN_DAYS = Array.from({ length: 30 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const ETHIOPIAN_MONTHS = [
  { value: "01", label: "01 - Meskerem" },
  { value: "02", label: "02 - Tikimt" },
  { value: "03", label: "03 - Hidar" },
  { value: "04", label: "04 - Tahsas" },
  { value: "05", label: "05 - Tir" },
  { value: "06", label: "06 - Yekatit" },
  { value: "07", label: "07 - Megabit" },
  { value: "08", label: "08 - Miazia" },
  { value: "09", label: "09 - Ginbot" },
  { value: "10", label: "10 - Sene" },
  { value: "11", label: "11 - Hamle" },
  { value: "12", label: "12 - Nehase" },
  { value: "13", label: "13 - Pagume" },
];
const ETHIOPIAN_YEARS = Array.from({ length: 31 }, (_, index) =>
  String(2010 + index),
);

function splitEthiopianDate(value?: string | null) {
  const [day = "", month = "", year = ""] = String(value ?? "").split("/");

  return {
    day: day.padStart(2, "0"),
    month: month.padStart(2, "0"),
    year,
  };
}

function buildEthiopianDate(day: string, month: string, year: string) {
  if (!day && !month && !year) return "";
  return `${day || "__"}/${month || "__"}/${year || "____"}`;
}

type WorkflowAction = {
  action: string;
  label: string;
  note: string;
  variant?: "outline" | "destructive";
  icon?: React.ElementType;
};

const ACTIONS: Record<string, Record<string, WorkflowAction[]>> = {
  "procurement-requester": {
    draft: [
      {
        action: "submit",
        label: "Submit Request",
        note: "Submitted to selected head",
        icon: Send,
      },
    ],
  },
  manager: {
    draft: [
      {
        action: "submit",
        label: "Submit Request",
        note: "Submitted to selected head",
        icon: Send,
      },
    ],
    executive_review: [
      {
        action: "manager_approve",
        label: "Approve & Forward",
        note: "Reviewed, approved, and forwarded to the selected technical team.",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject",
        note: "Rejected by selected head",
        variant: "destructive",
        icon: XCircle,
      },
    ],
    executive_final_review: [
      {
        action: "final_manager_approve",
        label: "Final Approve, Sign & Titer",
        note: "Final approval completed",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject",
        note: "Rejected during final approval",
        variant: "destructive",
        icon: XCircle,
      },
    ],
  },
  "team-leader": {
    property_review: [
      {
        action: "asset_team_approve",
        label: "Fill Form & Forward to Budget",
        note: "Form filled by Department Team Leader and forwarded to Budget Department",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject with Reason",
        note: "Rejected by Department Team Leader",
        variant: "destructive",
        icon: XCircle,
      },
    ],
    budget_review: [
      {
        action: "assign_budget_code",
        label: "Approve & Forward Back",
        note: "Budget Team Leader approved and forwarded back to the original Manager / Head",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject with Reason",
        note: "Rejected by Budget Team Leader",
        variant: "destructive",
        icon: XCircle,
      },
    ],
  },
  "budget-team-leader": {
    draft: [
      {
        action: "submit",
        label: "Submit Request",
        note: "Submitted to selected head",
        icon: Send,
      },
    ],
    budget_review: [
      {
        action: "assign_budget_code",
        label: "Approve & Forward Back",
        note: "Budget Team Leader approved and forwarded back to the original Manager / Head",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject with Reason",
        note: "Rejected by Budget Team Leader",
        variant: "destructive",
        icon: XCircle,
      },
    ],
  },
  "records-office": {
    draft: [
      {
        action: "submit",
        label: "Submit Request",
        note: "Submitted to selected head",
        icon: Send,
      },
    ],
    records_review: [
      {
        action: "records_process",
        label: "Fill Lakk, Date, Stamp",
        note: "Reference number and Ethiopian date filled by Records Office",
        icon: Stamp,
      },
    ],
  },
  finance: {
    finance: [
      {
        action: "finance_complete",
        label: "Finance Approve",
        note: "Procurement financially completed",
        icon: CheckCircle2,
      },
    ],
  },
};

const steps = [
  ["draft", "Draft"],
  ["executive_review", "Manager Paraph"],
  ["property_review", "Department TL"],
  ["budget_review", "Budget Department TL"],
  ["executive_final_review", "Final Approval"],
  ["records_review", "Records"],
  ["approved", "Completed"],
];

function normalize(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}
function roleKey(role?: string | null) {
  const r = normalize(role);
  const aliases: Record<string, string> = {
    "municipal-manager": "manager",
    "branch-head": "manager",
    "head-of-development-branch": "manager",
    "head-of-service-branch": "manager",
    "asset-machinery-team-leader": "team-leader",
    "asset-and-machinery-team-leader": "team-leader",
    "asset-team-leader": "team-leader",
    "property-team-leader": "team-leader",
    "machinery-team-leader": "team-leader",
    "planning-and-budget-team-leader": "budget-team-leader",
    "planning-budget-team-leader": "budget-team-leader",
    "planning-budget-team": "budget-team-leader",
    "team-leader-department-head": "team-leader",
    "department-head": "team-leader",
    "record-office": "records-office",
    "record-officer": "records-office",
    "records-officer": "records-office",
    "finance-department": "finance",
    "preparation-team": "procurement-requester",
  };
  return aliases[r] ?? r;
}
function statusKey(status?: string | null) {
  const s = normalize(status);
  const map: Record<string, string> = {
    submitted: "executive_review",
    "manager-review": "executive_review",
    "asset-team-review": "property_review",
    "budget-tl-review": "budget_review",
    "final-manager-review": "executive_final_review",
    "records-processing": "records_review",
    "sent-to-finance": "finance",
    completed: "approved",
  };
  return map[s] ?? s.replace(/-/g, "_");
}

function displayCustomerName(data: any) {
  return pickText(
    data?.customer_name,
    data?.customerName,
    data?.requested_customer_name,
    data?.requester_name,
    data?.title,
    data?.requester?.name,
  );
}
function displayPurchaseReason(data: any) {
  const value = String(data?.description ?? "").trim();
  if (!value) return "";
  return value.replace(/\s*send\s*to\s*:\s*.*$/i, "").trim();
}

function pickText(...values: any[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (
      text &&
      ![
        "title",
        "customer name",
        "customer_name",
        "description",
        "undefined",
        "null",
        "-",
      ].includes(text.toLowerCase())
    ) {
      return text;
    }
  }
  return "";
}

function displayRequesterType(data: any) {
  return pickText(
    data?.requester_type,
    data?.receiver_type,
    data?.department,
    data?.office_name,
  );
}

function displayProcurementCategory(data: any) {
  return pickText(
    data?.category?.name,
    data?.procurement_category?.name,
    data?.procurementCategory?.name,
    data?.category_name,
    data?.procurement_category_name,
  );
}

function displayProcurementType(data: any) {
  return pickText(
    data?.procurement_type?.name,
    data?.procurementType?.name,
    data?.type?.name,
    data?.procurement_type_name,
    data?.type_name,
  );
}

function recommendedTechnicalForward(data: any) {
  const category = displayProcurementCategory(data).toLowerCase();

  if (category.includes("machinery") || category.includes("machinary")) {
    return {
      value: "machinery_team_leader",
      label: "Machinery Team Leader",
      message:
        "Recommended: this procurement category is Machinery, so forward it to Machinery Team Leader.",
    };
  }

  if (category.includes("fixed asset") || category.includes("fixed assets")) {
    return {
      value: "asset_team_leader",
      label: "Asset Team Leader",
      message:
        "Recommended: this procurement category is Fixed Asset, so forward it to Asset Team Leader.",
    };
  }

  return {
    value: "asset_team_leader",
    label: "Asset Team Leader",
    message:
      "Recommendation: select Asset Team Leader for fixed asset requests or Machinery Team Leader for machinery requests.",
  };
}

function displayFormCustomerName(data: any) {
  return pickText(
    data?.customer_name,
    data?.customerName,
    data?.requested_customer_name,
    data?.requester_name,
    data?.title,
    data?.requester?.name,
  );
}

function displayFormReason(data: any) {
  return pickText(
    data?.purchase_reason,
    data?.sababa_bittaa,
    data?.reason,
    displayPurchaseReason(data),
    data?.description,
  );
}

function getItems(data: any): any[] {
  return Array.isArray(data?.items) && data.items.length
    ? data.items
    : Array.isArray(data?.procurement_items) && data.procurement_items.length
      ? data.procurement_items
      : Array.isArray(data?.form_items) && data.form_items.length
        ? data.form_items
        : [];
}

function itemText(item: any, ...keys: string[]) {
  return pickText(...keys.map((key) => item?.[key]));
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return text.slice(0, 10);
  return text;
}

function money(v?: number | string | null) {
  return Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
    "http://127.0.0.1:8000"
  );
}
function fileUrl(path?: string | null) {
  return path
    ? path.startsWith("http")
      ? path
      : `${baseUrl()}/storage/${path}`
    : "";
}
function signerUrl(signer: any, type: "signature" | "stamp" | "titer") {
  return signer?.[`${type}_url`] || fileUrl(signer?.[`${type}_path`]);
}
function blankItem(): ProcurementItem {
  return {
    item_name: "",
    specification: "",
    quantity: 1,
    unit: "pcs",
    estimated_unit_cost: 0,
  };
}

function SignatureLine({
  title,
  signer,
  stampOnly = false,
  showStamp = false,
}: {
  title: string;
  signer?: any;
  stampOnly?: boolean;
  showStamp?: boolean;
}) {
  const signature = !stampOnly ? signerUrl(signer, "signature") : "";
  const stamp = signerUrl(signer, "stamp");
  const titer = signerUrl(signer, "titer");

  return (
    <div className="procurement-signature-slot" aria-label={title}>
      {signature ? (
        <img
          src={signature}
          alt="signature"
          className="procurement-signature-img"
        />
      ) : null}
      {titer ? (
        <img src={titer} alt="titer" className="procurement-titer-img" />
      ) : null}
      {(showStamp || stampOnly) && stamp ? (
        <img src={stamp} alt="stamp" className="procurement-stamp-img" />
      ) : null}
    </div>
  );
}

function approvalDescription(history: any) {
  const custom = String(history?.metadata?.approval_description ?? "").trim();
  if (custom) return custom;
  const action = normalize(history?.action);
  const toStatus = statusKey(history?.to_status);
  const descriptions: Record<string, string> = {
    submit: "Requester submitted the procurement request for review.",
    "manager-approve":
      "Selected Manager/Service Head/Development Head reviewed, approved, and forwarded the request to the selected technical team.",
    "asset-team-approve":
      "Asset Team Leader verified the request, filled the procurement item form, signed, and forwarded it to Budget Team Leader.",
    "assign-budget-code":
      "Budget Team Leader assigned the budget code, approved the budget, signed, and forwarded it for final approval.",
    "final-manager-approve":
      "Final Manager reviewed the completed request, gave final approval, signed, and forwarded it to Records Office.",
    "records-process":
      "Records Officer entered the reference number, official date, added records title/stamp, and sent the request to Finance.",
    "finance-complete":
      "Finance Officer financially processed and completed the procurement request.",
    reject: "Request was rejected with reason at this approval stage.",
  };

  return (
    descriptions[action] ||
    (toStatus === "finance"
      ? "Records Office sent the approved procurement request to Finance."
      : "Procurement workflow action was recorded for this stage.")
  );
}

function HistorySignature({ actor }: { actor?: any }) {
  const signature = signerUrl(actor, "signature");

  if (!signature) return null;

  return (
    <div className="mt-2 flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground">
        Signature:
      </span>
      {signature ? (
        <img
          src={signature}
          alt="signature"
          className="h-10 max-w-28 object-contain"
        />
      ) : null}
    </div>
  );
}

function ApprovalHistoryPage({
  histories,
  attachments,
  currentStatus,
  onBack,
}: {
  histories?: any[];
  attachments?: any[];
  currentStatus?: string;
  onBack: () => void;
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex(([key]) => key === currentStatus),
  );
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-xl print:hidden">
      <div className="absolute right-0 top-0 h-52 w-52 bg-gradient-to-br from-white via-slate-100 to-slate-300 [clip-path:polygon(100%_0,0_0,100%_100%)]" />
      <div className="relative grid gap-6 p-4 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-slate-900">
                Procurement paper folded
              </p>
              <p className="text-sm text-muted-foreground">
                Approval history and paraph records are shown here.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={onBack}>
              Show Form
            </Button>
          </div>
          <div className="space-y-0">
            {steps.map(([key, label], index) => (
              <div key={key} className="relative flex gap-3 pb-5 last:pb-0">
                {index !== steps.length - 1 ? (
                  <div className="absolute left-[13px] top-7 h-full w-px bg-slate-300" />
                ) : null}
                <div
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${index <= activeIndex ? "border-primary bg-primary text-primary-foreground" : "border-slate-300 bg-white text-slate-500"}`}
                >
                  {index + 1}
                </div>
                <div
                  className={`rounded-xl border px-4 py-3 shadow-sm ${index === activeIndex ? "border-primary bg-primary/5" : "border-slate-200 bg-white"}`}
                >
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {index === activeIndex ? "Current step" : "Workflow stage"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <p className="text-xl font-bold text-slate-900">Approval History</p>
          {!histories?.length ? (
            <p className="text-sm text-muted-foreground">
              No approval history recorded.
            </p>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {histories.map((history) => (
                <div
                  key={history.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm shadow-sm"
                >
                  <div className="font-medium">
                    {history.action}: {history.from_status ?? "-"} →{" "}
                    {history.to_status ?? "-"}
                  </div>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">
                      Approval Description:{" "}
                    </span>
                    {approvalDescription(history)}
                  </div>
                  {history.note ? (
                    <div className="mt-2 text-muted-foreground">
                      <span className="font-medium">Note:</span> {history.note}
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs text-muted-foreground">
                    By: {history.actor?.name ?? "-"}
                  </div>
                  <HistorySignature actor={history.actor} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
              <Paperclip className="h-4 w-4" />
              Files
            </div>
            {!attachments?.length ? (
              <p className="text-sm text-muted-foreground">No file attached.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((file) => (
                  <a
                    key={file.id ?? file.stored_path}
                    href={fileUrl(file.stored_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="truncate">
                      {file.original_name ?? "Attachment"}
                    </span>
                    <span className="text-xs text-muted-foreground">Open</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcurementDetailPage() {
  const id = String(useParams().id);
  const query = useProcurementRequest(id);
  const actionMutation = useProcurementAction(() => {
    toast.success("Workflow updated");
    setModalAction(null);
    setNote("");
    setApprovalDescriptionText("");
    query.refetch();
  });
  const [note, setNote] = useState("");
  const [approvalDescriptionText, setApprovalDescriptionText] = useState("");
  const [modalAction, setModalAction] = useState<WorkflowAction | null>(null);
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [items, setItems] = useState<ProcurementItem[]>([blankItem()]);
  const [budgetCode, setBudgetCode] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [officialDateEc, setOfficialDateEc] = useState("");
  const [attachmentReferenceNo, setAttachmentReferenceNo] = useState("");
  const [attachmentOfficialDateEc, setAttachmentOfficialDateEc] = useState("");
  const [receiverType, setReceiverType] = useState("manager");
  const [receiverUserId, setReceiverUserId] = useState("");
  const [forwardToRole, setForwardToRole] = useState("asset_team_leader");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState("");
  const [selectedBudgetDepartmentId, setSelectedBudgetDepartmentId] =
    useState("");
  const [selectedBudgetTeamLeaderId, setSelectedBudgetTeamLeaderId] =
    useState("");
  const [showAttachmentDraftForm, setShowAttachmentDraftForm] = useState(false);
  const [attachmentTo, setAttachmentTo] = useState("");
  const [attachmentAddress, setAttachmentAddress] = useState("");
  const [attachmentCase, setAttachmentCase] = useState("");
  const [attachmentBody, setAttachmentBody] = useState("");
  const [attachmentGg, setAttachmentGg] = useState<string[]>([
    "Waajjiraa Hojii Gaggeessaa tiif",
    "Kuta Bittaa tiif",
    "Adamaa",
  ]);
  const data = query.data;

  const initialApproversQuery = useQuery({
    queryKey: ["procurement", "initial-approvers"],
    queryFn: () =>
      procurementService.initialApprovers?.() ?? Promise.resolve([]),
    enabled: data?.status === "draft",
  });

  const departmentsQuery = useQuery({
    queryKey: ["procurement", "departments", id],
    queryFn: () => procurementService.departments(id),
    enabled: data?.status === "manager_review",
  });

  const departmentTeamLeadersQuery = useQuery({
    queryKey: ["procurement", "department-team-leaders", selectedDepartmentId],
    queryFn: () =>
      procurementService.departmentTeamLeaders(selectedDepartmentId),
    enabled: data?.status === "manager_review" && Boolean(selectedDepartmentId),
  });

  const budgetDepartmentsQuery = useQuery({
    queryKey: ["procurement", "budget-departments"],
    queryFn: () => procurementService.budgetDepartments(),
    enabled: data?.status === "asset_team_review",
  });

  const budgetDepartmentTeamLeadersQuery = useQuery({
    queryKey: [
      "procurement",
      "budget-department-team-leaders",
      selectedBudgetDepartmentId,
    ],
    queryFn: () =>
      procurementService.departmentTeamLeaders(selectedBudgetDepartmentId),
    enabled:
      data?.status === "asset_team_review" &&
      Boolean(selectedBudgetDepartmentId),
  });

  const technicalRecommendation = useMemo(
    () => recommendedTechnicalForward(data),
    [data],
  );
  const status = statusKey(data?.status);
  const currentUser = authService.getStoredUser();
  const currentUserId = String(currentUser?.id ?? "");
  const role = roleKey(
    authService.getStoredRoles()[0] || currentUser?.role,
  );

  const hasOfficialAttachmentDraft = Boolean(
    data?.attachment_to ||
    data?.attachment_address ||
    data?.attachment_case ||
    data?.attachment_body ||
    (Array.isArray(data?.attachment_gg) && data.attachment_gg.length),
  );

  const isAttachmentComplete =
    attachmentTo.trim() !== "" &&
    attachmentAddress.trim() !== "" &&
    attachmentCase.trim() !== "" &&
    attachmentBody.trim() !== "" &&
    attachmentGg.some((item) => item.trim() !== "");

  const officialAttachmentPayload = {
    attachment_to: attachmentTo,
    attachment_address: attachmentAddress,
    attachment_case: attachmentCase,
    attachment_body: attachmentBody,
    attachment_gg: attachmentGg.filter((item) => item.trim() !== ""),
  };

  const allowedActions = useMemo(() => {
    if (!data) return [];
    if (status === "draft") {
      return [
        {
          action: "submit",
          label: "Submit Request",
          note: "Submitted to selected head",
          icon: Send,
        },
      ];
    }

    const currentHandlerId = String((data as any).current_handler_id ?? "");
    const technicalTeamLeaderId = String(
      (data as any).assigned_team_leader_id ??
        (data as any).team_leader_user_id ??
        "",
    );
    const budgetTeamLeaderId = String(
      (data as any).budget_team_leader_id ??
        (data as any).budget_team_leader_user_id ??
        (data as any).assigned_budget_team_leader_id ??
        "",
    );

    // After Asset/Machinery Team Leader forwards to the Budget Department
    // Team Leader, the technical Team Leader must no longer see workflow
    // actions for the budget review step. Only the current handler / selected
    // Budget Department Team Leader can act at budget_review.
    if (role === "team-leader" && status === "budget_review") {
      const isBudgetDepartmentHandler =
        Boolean(currentUserId) &&
        [currentHandlerId, budgetTeamLeaderId].some(
          (value) => value && value === currentUserId,
        );

      return isBudgetDepartmentHandler ? ACTIONS[role]?.[status] || [] : [];
    }

    if (role === "team-leader" && status === "property_review") {
      const isTechnicalTeamLeaderHandler =
        !currentUserId ||
        [currentHandlerId, technicalTeamLeaderId].some(
          (value) => value && value === currentUserId,
        );

      return isTechnicalTeamLeaderHandler ? ACTIONS[role]?.[status] || [] : [];
    }

    if (role === "super-admin")
      return Object.values(ACTIONS).flatMap((a) => a[status] || []);
    return ACTIONS[role]?.[status] || [];
  }, [currentUserId, data, role, status]);

  if (query.isLoading) return <div>Loading...</div>;
  if (!data) return <div>Request not found.</div>;

  if (showApprovalHistory)
    return (
      <ApprovalHistoryPage
        histories={data.histories}
        attachments={data.attachments}
        currentStatus={status}
        onBack={() => setShowApprovalHistory(false)}
      />
    );

  const recordDate = formatDisplayDate(
    (data as any).official_date_ec || data.official_date || "",
  );
  const officialDateParts = splitEthiopianDate(officialDateEc);
  const setOfficialDatePart = (
    part: "day" | "month" | "year",
    value: string,
  ) => {
    const next = { ...officialDateParts, [part]: value };
    setOfficialDateEc(buildEthiopianDate(next.day, next.month, next.year));
  };
  const attachmentOfficialDateParts = splitEthiopianDate(
    attachmentOfficialDateEc,
  );
  const setAttachmentOfficialDatePart = (
    part: "day" | "month" | "year",
    value: string,
  ) => {
    const next = { ...attachmentOfficialDateParts, [part]: value };
    setAttachmentOfficialDateEc(
      buildEthiopianDate(next.day, next.month, next.year),
    );
  };

  const runAction = (payload: any) =>
    actionMutation.mutate({
      id,
      payload: {
        note: note || modalAction?.note,
        approval_description:
          approvalDescriptionText || note || modalAction?.note,
        ...payload,
      },
    });

  function printProcurement() {
    document.body.classList.remove("procurement-attachment-printing");
    document.body.classList.add("procurement-main-printing");
    setTimeout(() => {
      window.print();
      setTimeout(
        () => document.body.classList.remove("procurement-main-printing"),
        200,
      );
    }, 50);
  }

  function printProcurementAttachment() {
    document.body.classList.remove("procurement-main-printing");
    document.body.classList.add("procurement-attachment-printing");
    setTimeout(() => {
      window.print();
      setTimeout(
        () => document.body.classList.remove("procurement-attachment-printing"),
        200,
      );
    }, 50);
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        .procurement-print-area {
          background: #fff;
        }
        .procurement-a4-page {
          width: 210mm;
          min-height: 297mm;
          max-width: 100%;
          margin: 0 auto;
          background: #fff;
          position: relative;
        }
        .procurement-diagonal-office-titer {
          position: absolute;
          left: 10mm;
          top: 13mm;
          width: 68mm;
          height: 38mm;
          object-fit: contain;
          transform: rotate(-21deg);
          transform-origin: center;
          opacity: 0.95;
          z-index: 12;
          pointer-events: none;
        }
        .procurement-center-titer {
          display: none;
        }
        .procurement-signature-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8mm;
          align-items: end;
          margin-top: 10mm;
          padding: 0 8mm;
        }
        .procurement-signature-slot {
          min-height: 34mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          position: relative;
        }
        .procurement-signature-img {
          width: 34mm;
          max-height: 18mm;
          object-fit: contain;
          margin-bottom: -1mm;
          opacity: 1;
        }
        .procurement-titer-img {
          width: 44mm;
          max-height: 22mm;
          object-fit: contain;
          transform: rotate(-18deg);
          transform-origin: center;
          opacity: 0.95;
          pointer-events: none;
        }
        .procurement-stamp-img {
          width: 34mm;
          height: 34mm;
          object-fit: contain;
          opacity: 0.95;
          pointer-events: none;
        }
        .procurement-records-stamp {
          width: 36mm;
          height: 36mm;
          object-fit: contain;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.95;
          z-index: 3;
          pointer-events: none;
        }
        .procurement-table-content {
          position: relative;
          z-index: 5;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html,
          body {
            width: 210mm !important;
            min-height: 297mm !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .procurement-print-area,
          .procurement-print-area * {
            visibility: visible !important;
          }
          .procurement-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .procurement-a4-page {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 9mm 10mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          .procurement-print-table {
            min-width: 0 !important;
            width: 100% !important;
            font-size: 8.5pt !important;
          }
          .procurement-print-table th,
          .procurement-print-table td {
            padding: 4px !important;
            background: transparent !important;
          }
          .procurement-signature-grid {
            margin-top: 8mm !important;
            gap: 6mm !important;
            padding: 0 6mm !important;
          }
          .procurement-signature-img {
            width: 33mm !important;
            max-height: 18mm !important;
          }
          .procurement-titer-img {
            width: 39mm !important;
            max-height: 19mm !important;
          }
          body.procurement-main-printing * {
            visibility: hidden !important;
          }
          body.procurement-main-printing #procurement-print-area,
          body.procurement-main-printing #procurement-print-area * {
            visibility: visible !important;
          }
          body.procurement-main-printing #procurement-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
          }
          body.procurement-main-printing #procurement-attachment-print-area {
            display: none !important;
          }
          body.procurement-attachment-printing * {
            visibility: hidden !important;
          }
          body.procurement-attachment-printing
            #procurement-attachment-print-area,
          body.procurement-attachment-printing
            #procurement-attachment-print-area
            * {
            visibility: visible !important;
          }
          body.procurement-attachment-printing
            #procurement-attachment-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
          }
          body.procurement-attachment-printing #procurement-print-area {
            display: none !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">{data.request_no}</h1>
          <p className="text-sm text-muted-foreground">
            {displayCustomerName(data)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">
              Category: {displayProcurementCategory(data) || "-"}
            </Badge>
            {displayProcurementType(data) ? (
              <Badge variant="outline">
                Type: {displayProcurementType(data)}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{status.replaceAll("_", " ")}</Badge>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setShowApprovalHistory(true)}
          >
            <History className="mr-2 h-4 w-4" />
            Approval History
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={printProcurement}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Procurement
          </Button>
          {hasOfficialAttachmentDraft ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={printProcurementAttachment}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Attachment
            </Button>
          ) : null}
        </div>
      </div>

      <Card
        id="procurement-print-area"
        className="procurement-print-area relative mx-auto w-full max-w-[210mm] overflow-hidden print:border-0 print:shadow-none"
      >
        <div className="absolute right-0 top-0 z-20 hidden h-24 w-24 bg-gradient-to-br from-slate-100 via-white to-slate-300 shadow-inner [clip-path:polygon(100%_0,0_0,100%_100%)] print:hidden md:block" />
        <div className="absolute right-4 top-4 z-30 rounded-full border bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm print:hidden">
          Current: {status.replaceAll("_", " ")}
        </div>
        <CardContent className="procurement-a4-page space-y-5 p-8 print:p-0">
          {signerUrl(data.records_signer, "titer") ? (
            <img
              src={signerUrl(data.records_signer, "titer")}
              alt="Records Office titer"
              className="procurement-diagonal-office-titer"
            />
          ) : null}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div />
            <div className="space-y-3 text-sm font-semibold">
              <div>
                Lakk{" "}
                <span className="inline-block min-w-48 border-b border-black px-3 font-normal">
                  {data.reference_no ?? ""}
                </span>
              </div>
              <div>
                Guyyaa{" "}
                <span className="inline-block min-w-48 border-b border-black px-3 font-normal">
                  {recordDate}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-4 text-base font-semibold">
            <div>
              W/ra. Sektara Bittaa Gaafate:-{" "}
              <span className="inline-block min-w-96 border-b border-black font-bold">
                {displayRequesterType(data)}
              </span>
            </div>
            <div>
              Procurement Category:-{" "}
              <span className="inline-block min-w-64 border-b border-black font-bold">
                {displayProcurementCategory(data) || "-"}
              </span>
              {displayProcurementType(data) ? (
                <>
                  <span className="ml-4">Procurement Type:- </span>
                  <span className="inline-block min-w-64 border-b border-black font-normal">
                    {displayProcurementType(data)}
                  </span>
                </>
              ) : null}
            </div>
            <div>
              Maqaa kan gaafate :-{" "}
              <span className="inline-block min-w-80 border-b border-black font-normal">
                {displayFormCustomerName(data) || "-"}
              </span>
            </div>
            <div>
              Sababa bittaa:-{" "}
              <span className="inline-block min-w-96 border-b border-black font-normal">
                {displayFormReason(data) || "-"}
              </span>
            </div>
            <div>
              Koodii fi Gulanta hereegaa Mana Hojii :-{" "}
              <span className="inline-block min-w-64 border-b border-black font-normal">
                {data.budget_code ?? ""}
              </span>
            </div>
          </div>
          <div className="relative overflow-x-auto">
            {signerUrl(data.records_signer, "stamp") ? (
              <img
                src={signerUrl(data.records_signer, "stamp")}
                alt="Records Office stamp"
                className="procurement-records-stamp"
              />
            ) : null}
            <table className="procurement-table-content procurement-print-table w-full min-w-[980px] border-collapse border border-black text-sm">
              <thead>
                <tr>
                  {[
                    "Lak",
                    "Akaakuu Meeshaa",
                    "Safar",
                    "Baayin",
                    "Moodeela Speesfikes",
                    "Tilmaama gatii tokkoo",
                    "Tilmaama gatii hundaa",
                    "Gulant Baasii",
                    "Remark",
                  ].map((h) => (
                    <th key={h} className="border border-black p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getItems(data).map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td className="border border-black p-2">{index + 1}</td>
                    <td className="border border-black p-2">
                      {itemText(
                        item,
                        "item_name",
                        "name",
                        "item",
                        "description",
                        "item_description",
                      )}
                    </td>
                    <td className="border border-black p-2">
                      {itemText(item, "unit", "safar", "measurement_unit")}
                    </td>
                    <td className="border border-black p-2">
                      {item?.quantity ?? item?.qty ?? item?.baayin ?? ""}
                    </td>
                    <td className="border border-black p-2">
                      {itemText(
                        item,
                        "specification",
                        "model_specification",
                        "spec",
                        "moodeela_speesfikes",
                      ) || "-"}
                    </td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2" />
                    <td className="border border-black p-2" />
                  </tr>
                ))}
                {Array.from({
                  length: Math.max(0, 5 - getItems(data).length),
                }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="h-9 border border-black p-2" />
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="border border-black p-2 font-bold" colSpan={6}>
                    Ida&apos;ama
                  </td>
                  <td className="border border-black p-2 font-bold"></td>
                  <td className="border border-black p-2" />
                  <td className="border border-black p-2" />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="procurement-signature-grid pt-2">
            <SignatureLine
              title="I/G Kutaa Meeshaa"
              signer={data.asset_signer}
            />
            <SignatureLine
              title="I/G. Kuta fi Herreegaa"
              signer={data.budget_tl_signer}
            />
            <SignatureLine
              title="I/G. Mirkaneessaa"
              signer={data.final_manager_signer}
            />
            <SignatureLine
              title="Finance Approval"
              signer={data.finance_signer}
            />
          </div>
        </CardContent>
      </Card>

      {hasOfficialAttachmentDraft ? (
        <Card
          id="procurement-attachment-print-area"
          className="relative mx-auto w-full max-w-[210mm] overflow-hidden bg-white print:border-0 print:shadow-none"
        >
          <CardContent className="relative min-h-[297mm] space-y-8 p-10 font-serif text-base leading-8 print:p-8">
            {signerUrl(data.records_signer, "titer") ? (
              <img
                src={signerUrl(data.records_signer, "titer")}
                alt="Records Office titer"
                className="absolute left-8 top-8 z-20 h-36 max-w-[280px] -rotate-[32deg] object-contain opacity-95"
              />
            ) : null}

            <div className="flex justify-end text-sm font-semibold">
              <div className="space-y-3">
                <div>
                  Lakk{" "}
                  <span className="inline-block min-w-48 border-b border-black px-3 font-normal">
                    {(data as any).attachment_reference_no ??
                      attachmentReferenceNo ??
                      ""}
                  </span>
                </div>
                <div>
                  Guyyaa{" "}
                  <span className="inline-block min-w-48 border-b border-black px-3 font-normal">
                    {formatDisplayDate(
                      (data as any).attachment_official_date_ec ||
                        attachmentOfficialDateEc ||
                        "",
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-20">
              <p className="italic underline">
                To:{" "}
                <span className="inline-block min-w-64 border-b border-black px-3 not-italic">
                  {(data as any).attachment_to ?? attachmentTo ?? ""}
                </span>
              </p>
              <p className="mt-5 italic underline">
                Address:{" "}
                <span className="inline-block min-w-64 border-b border-black px-3 not-italic">
                  {(data as any).attachment_address ?? attachmentAddress ?? ""}
                </span>
              </p>
              <p className="mt-5 italic underline">
                Case:-{" "}
                <span className="inline-block min-w-64 border-b border-black px-3 not-italic">
                  {(data as any).attachment_case ?? attachmentCase ?? ""}
                </span>
              </p>
              <div className="mt-8 min-h-[260px]">
                <p className="mb-3 italic underline">Body :</p>
                <p className="whitespace-pre-line">
                  {(data as any).attachment_body ?? attachmentBody ?? ""}
                </p>
              </div>
            </div>

            <div className="relative min-h-[190px]">
              {signerUrl(data.records_signer, "stamp") ? (
                <img
                  src={signerUrl(data.records_signer, "stamp")}
                  alt="Records Office stamp"
                  className="absolute left-1/3 top-8 z-20 h-36 w-36 -translate-x-1/2 object-contain opacity-95"
                />
              ) : null}
              <div className="absolute right-0 top-0 text-right font-bold">
                <p>Nagaa Wajjiin</p>
                <SignatureLine title="" signer={data.final_manager_signer} />
              </div>
            </div>

            <div>
              <p className="mb-3 underline">G.G</p>
              {(
                ((data as any).attachment_gg as string[] | undefined) ??
                attachmentGg
              )
                .filter((item) => item?.trim())
                .map((item, index) => (
                  <p key={`${item}-${index}`} className="mb-2">
                    ➢&nbsp;&nbsp; {item}
                  </p>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2 print:hidden">
        {allowedActions.map((a) => {
          const Icon = a.icon;
          return (
            <Button
              key={a.action}
              size="sm"
              variant={a.variant ?? "outline"}
              disabled={actionMutation.isPending}
              onClick={() => {
                setNote("");
                setApprovalDescriptionText(a.note);
                if (a.action === "asset_team_approve") {
                  setItems(
                    getItems(data).length ? getItems(data) : [blankItem()],
                  );
                }
                if (a.action === "manager_approve") {
                  setForwardToRole(technicalRecommendation.value);
                  setSelectedDepartmentId(
                    String((data as any).department_id ?? ""),
                  );
                  setSelectedTeamLeaderId(
                    String((data as any).assigned_team_leader_id ?? ""),
                  );
                }
                if (a.action === "asset_team_approve") {
                  setSelectedBudgetDepartmentId(
                    String((data as any).budget_department_id ?? ""),
                  );
                  setSelectedBudgetTeamLeaderId(
                    String((data as any).budget_team_leader_id ?? ""),
                  );
                }
                if (a.action === "records_process") {
                  setReferenceNo(String((data as any).reference_no ?? ""));
                  setOfficialDateEc(
                    String((data as any).official_date_ec ?? ""),
                  );
                  setAttachmentReferenceNo(
                    String((data as any).attachment_reference_no ?? ""),
                  );
                  setAttachmentOfficialDateEc(
                    String((data as any).attachment_official_date_ec ?? ""),
                  );
                }
                if (a.action === "final_manager_approve") {
                  setShowAttachmentDraftForm(hasOfficialAttachmentDraft);
                  setAttachmentTo(String((data as any).attachment_to ?? ""));
                  setAttachmentAddress(
                    String((data as any).attachment_address ?? ""),
                  );
                  setAttachmentCase(
                    String((data as any).attachment_case ?? ""),
                  );
                  setAttachmentBody(
                    String((data as any).attachment_body ?? ""),
                  );
                  setAttachmentGg(
                    Array.isArray((data as any).attachment_gg) &&
                      (data as any).attachment_gg.length
                      ? (data as any).attachment_gg
                      : [
                          "Waajjiraa Hojii Gaggeessaa tiif",
                          "Kuta Bittaa tiif",
                          "Adamaa",
                        ],
                  );
                }
                setModalAction(a);
              }}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {a.label}
            </Button>
          );
        })}
      </div>

      <Dialog
        open={!!modalAction}
        onOpenChange={(o) => !o && setModalAction(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{modalAction?.label}</DialogTitle>
          </DialogHeader>
          {modalAction ? (
            <div className="rounded-2xl border bg-muted/20 p-4">
              <Label>Approval Description</Label>
              <Textarea
                className="mt-2 min-h-24"
                placeholder="Write approval description"
                value={approvalDescriptionText}
                onChange={(e) => setApprovalDescriptionText(e.target.value)}
              />
            </div>
          ) : null}
          {modalAction?.action === "submit" ? (
            <div className="space-y-4">
              <div>
                <Label>Select receiver</Label>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={receiverUserId}
                  onChange={(e) => setReceiverUserId(e.target.value)}
                >
                  <option value="">Select Manager / Head</option>
                  {(initialApproversQuery.data ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} —{" "}
                      {user.display_role ?? user.role ?? "Approver"}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                placeholder="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    runAction({
                      action: "submit",
                      send_to_user_id: receiverUserId,
                      receiver_type: receiverType,
                      note: note || "Submitted to selected Manager / Head",
                    })
                  }
                >
                  Submit Request
                </Button>
              </div>
            </div>
          ) : null}
          {modalAction?.action === "manager_approve" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                {technicalRecommendation.message}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Department</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedTeamLeaderId("");
                    }}
                  >
                    <option value="">Select department</option>
                    {(departmentsQuery.data ?? []).map((department: any) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                        {department.office?.name
                          ? ` — ${department.office.name}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fixed Asset requests show Asset Department. Machinery
                    requests show Machinery Department.
                  </p>
                </div>
                <div>
                  <Label>Department Team Leader</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedTeamLeaderId}
                    disabled={
                      !selectedDepartmentId ||
                      departmentTeamLeadersQuery.isLoading
                    }
                    onChange={(e) => setSelectedTeamLeaderId(e.target.value)}
                  >
                    <option value="">
                      {departmentTeamLeadersQuery.isLoading
                        ? "Loading Team Leaders..."
                        : "Select Team Leader"}
                    </option>
                    {(departmentTeamLeadersQuery.data ?? []).map(
                      (leader: any) => (
                        <option key={leader.id} value={leader.id}>
                          {leader.name} — {leader.display_role ?? "Team Leader"}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div>
                <Label>Additional Note</Label>
                <Textarea
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    !selectedDepartmentId ||
                    !selectedTeamLeaderId ||
                    actionMutation.isPending
                  }
                  onClick={() =>
                    runAction({
                      action: "manager_approve",
                      department_id: selectedDepartmentId,
                      team_leader_user_id: selectedTeamLeaderId,
                    })
                  }
                >
                  Approve & Forward
                </Button>
              </div>
            </div>
          ) : null}
          {modalAction?.action === "asset_team_approve" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-4"
                  >
                    <Input
                      placeholder="Item"
                      value={it.item_name}
                      onChange={(e) =>
                        setItems((old) =>
                          old.map((x, i) =>
                            i === idx ? { ...x, item_name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="Specification"
                      value={it.specification ?? ""}
                      onChange={(e) =>
                        setItems((old) =>
                          old.map((x, i) =>
                            i === idx
                              ? { ...x, specification: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="Unit"
                      value={it.unit}
                      onChange={(e) =>
                        setItems((old) =>
                          old.map((x, i) =>
                            i === idx ? { ...x, unit: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) =>
                        setItems((old) =>
                          old.map((x, i) =>
                            i === idx
                              ? { ...x, quantity: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setItems((x) => [...x, blankItem()])}
              >
                Add Item
              </Button>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Budget Department</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedBudgetDepartmentId}
                    onChange={(e) => {
                      setSelectedBudgetDepartmentId(e.target.value);
                      setSelectedBudgetTeamLeaderId("");
                    }}
                  >
                    <option value="">Select Budget Department</option>
                    {(budgetDepartmentsQuery.data ?? []).map(
                      (department: any) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                          {department.office?.name
                            ? ` — ${department.office.name}`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <Label>Budget Department Team Leader</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedBudgetTeamLeaderId}
                    disabled={
                      !selectedBudgetDepartmentId ||
                      budgetDepartmentTeamLeadersQuery.isLoading
                    }
                    onChange={(e) =>
                      setSelectedBudgetTeamLeaderId(e.target.value)
                    }
                  >
                    <option value="">
                      {budgetDepartmentTeamLeadersQuery.isLoading
                        ? "Loading Team Leaders..."
                        : "Select Budget Team Leader"}
                    </option>
                    {(budgetDepartmentTeamLeadersQuery.data ?? []).map(
                      (leader: any) => (
                        <option key={leader.id} value={leader.id}>
                          {leader.name} — {leader.display_role ?? "Team Leader"}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div>
                <Label>Additional Note</Label>
                <Textarea
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    !selectedBudgetDepartmentId ||
                    !selectedBudgetTeamLeaderId ||
                    actionMutation.isPending
                  }
                  onClick={() =>
                    runAction({
                      action: "asset_team_approve",
                      budget_department_id: selectedBudgetDepartmentId,
                      budget_team_leader_user_id: selectedBudgetTeamLeaderId,
                      items: items.map((x) => ({
                        ...x,
                        estimated_unit_cost: 0,
                        estimated_total_cost: 0,
                      })),
                    })
                  }
                >
                  Approve & Submit Form
                </Button>
              </div>
            </div>
          ) : null}
          {modalAction?.action === "assign_budget_code" ? (
            <div className="space-y-4">
              <Label>Budget Code</Label>
              <Input
                value={budgetCode}
                onChange={(e) => setBudgetCode(e.target.value)}
                placeholder="Enter budget code"
              />
              <div>
                <Label>Additional Note</Label>
                <Textarea
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    runAction({
                      action: "assign_budget_code",
                      budget_code: budgetCode,
                    })
                  }
                >
                  Approve
                </Button>
              </div>
            </div>
          ) : null}
          {modalAction?.action === "records_process" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Reference No (Lakk)</Label>
                  <Input
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Guyyaa / Date (Ethiopian Calendar)</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={officialDateParts.day}
                      onChange={(e) =>
                        setOfficialDatePart("day", e.target.value)
                      }
                    >
                      <option value="">Day</option>
                      {ETHIOPIAN_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={officialDateParts.month}
                      onChange={(e) =>
                        setOfficialDatePart("month", e.target.value)
                      }
                    >
                      <option value="">Month</option>
                      {ETHIOPIAN_MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={officialDateParts.year}
                      onChange={(e) =>
                        setOfficialDatePart("year", e.target.value)
                      }
                    >
                      <option value="">Year</option>
                      {ETHIOPIAN_YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved as E.C date: {officialDateEc || "dd/mm/yyyy"}
                  </p>
                </div>
              </div>
              {hasOfficialAttachmentDraft ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">
                    Attachment Lakk & Guyyaa
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Attachment Reference No (Lakk)</Label>
                      <Input
                        value={attachmentReferenceNo}
                        onChange={(e) =>
                          setAttachmentReferenceNo(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>
                        Attachment Guyyaa / Date (Ethiopian Calendar)
                      </Label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <select
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          value={attachmentOfficialDateParts.day}
                          onChange={(e) =>
                            setAttachmentOfficialDatePart("day", e.target.value)
                          }
                        >
                          <option value="">Day</option>
                          {ETHIOPIAN_DAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <select
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          value={attachmentOfficialDateParts.month}
                          onChange={(e) =>
                            setAttachmentOfficialDatePart(
                              "month",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Month</option>
                          {ETHIOPIAN_MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          value={attachmentOfficialDateParts.year}
                          onChange={(e) =>
                            setAttachmentOfficialDatePart(
                              "year",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Year</option>
                          {ETHIOPIAN_YEARS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saved as E.C date:{" "}
                        {attachmentOfficialDateEc || "dd/mm/yyyy"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <Label>Additional Note</Label>
                <Textarea
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    runAction({
                      action: "records_process",
                      reference_no: referenceNo,
                      official_date_ec: officialDateEc,
                      attachment_reference_no: attachmentReferenceNo,
                      attachment_official_date_ec: attachmentOfficialDateEc,
                    })
                  }
                >
                  Stamp & Process
                </Button>
              </div>
            </div>
          ) : null}

          {modalAction?.action === "final_manager_approve" ? (
            <div className="space-y-4">
              {!showAttachmentDraftForm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAttachmentDraftForm(true)}
                >
                  Add Optional Attachment
                </Button>
              ) : (
                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>To</Label>
                      <Input
                        value={attachmentTo}
                        onChange={(e) => setAttachmentTo(e.target.value)}
                        placeholder="To"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={attachmentAddress}
                        onChange={(e) => setAttachmentAddress(e.target.value)}
                        placeholder="Address"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Case</Label>
                    <Input
                      value={attachmentCase}
                      onChange={(e) => setAttachmentCase(e.target.value)}
                      placeholder="Case"
                    />
                  </div>
                  <div>
                    <Label>Body</Label>
                    <Textarea
                      className="min-h-32"
                      value={attachmentBody}
                      onChange={(e) => setAttachmentBody(e.target.value)}
                      placeholder="Body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>G.G</Label>
                    {attachmentGg.map((item, index) => (
                      <Input
                        key={index}
                        value={item}
                        onChange={(e) =>
                          setAttachmentGg((current) =>
                            current.map((value, itemIndex) =>
                              itemIndex === index ? e.target.value : value,
                            ),
                          )
                        }
                        placeholder="G.G recipient"
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAttachmentGg((current) => [...current, ""])
                      }
                    >
                      Add G.G
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Label>Additional Note</Label>
                <Textarea
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    actionMutation.isPending ||
                    (showAttachmentDraftForm && !isAttachmentComplete)
                  }
                  onClick={() =>
                    runAction({
                      action: "final_manager_approve",
                      ...(showAttachmentDraftForm && isAttachmentComplete
                        ? officialAttachmentPayload
                        : {}),
                    })
                  }
                >
                  Final Approve
                </Button>
              </div>
            </div>
          ) : null}

          {modalAction &&
          ![
            "submit",
            "manager_approve",
            "asset_team_approve",
            "assign_budget_code",
            "records_process",
            "final_manager_approve",
          ].includes(modalAction.action) ? (
            <div className="space-y-4">
              <div>
                <Label>
                  {modalAction.action === "reject"
                    ? "Reject Reason"
                    : "Additional Note"}
                </Label>
                <Textarea
                  className="mt-2"
                  placeholder={
                    modalAction.action === "reject"
                      ? "Write reject reason"
                      : "Optional note"
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant={modalAction.variant ?? "default"}
                  onClick={() =>
                    runAction({
                      action: modalAction.action,
                      reason:
                        modalAction.action === "reject" ? note : undefined,
                    })
                  }
                >
                  Submit
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
