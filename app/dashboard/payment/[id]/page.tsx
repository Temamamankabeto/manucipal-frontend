"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Plus,
  Printer,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  usePaymentAction,
  usePaymentRequest,
} from "@/hooks/payment/use-payment";
import {
  useBudgetAccountCodes,
  useBudgetBiCodes,
  useBudgetFiscalYears,
  usePaymentTypeBudgetBalance,
} from "@/hooks/budget/use-budget";
import { authService } from "@/services/auth/auth.service";
import { paymentService } from "@/services/payment/payment.service";
import {
  PerDiemExpertWorkspace,
  PerDiemPrintableEmployees,
} from "@/components/payment/per-diem-expert-workspace";

type WorkflowAction = {
  action: string;
  label: string;
  note: string;
  variant?: "outline" | "destructive";
  icon?: React.ElementType;
};

const draftSubmitActions = {
  draft: [
    {
      action: "submit",
      label: "Submit Request",
      note: "Submitted to Manager / Branch Head",
      icon: Send,
    },
  ],
} satisfies Record<string, WorkflowAction[]>;

const managerActions = {
  manager_review: [
    {
      action: "manager_approve",
      label: "Accept & Forward",
      note: "Accepted and forwarded to Department Team Leader",
      icon: CheckCircle2,
    },
    {
      action: "reject",
      label: "Reject with Reason",
      note: "Rejected by Manager / Branch Head",
      variant: "destructive",
      icon: XCircle,
    },
  ],
  manager_final_review: [
    {
      action: "manager_final_approve",
      label: "Final Approve",
      note: "Final manager approval completed",
      icon: CheckCircle2,
    },
    {
      action: "reject",
      label: "Reject with Reason",
      note: "Rejected during final manager review",
      variant: "destructive",
      icon: XCircle,
    },
  ],
} satisfies Record<string, WorkflowAction[]>;

const ROLE_ACTIONS: Record<string, Record<string, WorkflowAction[]>> = {
  "payment-requester": draftSubmitActions,
  manager: { ...draftSubmitActions, ...managerActions },
  "municipal-manager": { ...draftSubmitActions, ...managerActions },
  "head-of-development-branch": { ...draftSubmitActions, ...managerActions },
  "head-of-service-branch": { ...draftSubmitActions, ...managerActions },
  "team-leader": {
    ...draftSubmitActions,
    budget_tl_review: [
      {
        action: "budget_tl_approve",
        label: "Accept & Forward to Experts",
        note: "Budget TL accepted and forwarded to experts",
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
    budget_tl_final_review: [
      {
        action: "budget_tl_final_approve",
        label: "Final Review & Forward",
        note: "Budget TL final review completed",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject with Reason",
        note: "Rejected during Budget TL final review",
        variant: "destructive",
        icon: XCircle,
      },
    ],
  },
  expert: {
    budget_expert_processing: [
      {
        action: "expert_complete",
        label: "Complete Payment Form",
        note: "Payment form completed and returned to Budget TL",
        icon: CheckCircle2,
      },
      {
        action: "reject",
        label: "Reject with Reason",
        note: "Rejected by Planning & Budget Expert",
        variant: "destructive",
        icon: XCircle,
      },
    ],
  },
  "records-office": {
    records_processing: [
      {
        action: "records_process",
        label: "Fill Lakk & Guyyaa",
        note: "Records processing completed",
        icon: CheckCircle2,
      },
    ],
  },
  finance: {
    sent_to_finance: [
      {
        action: "finance_complete",
        label: "Mark As Paid",
        note: "Payment marked as paid by Finance Accountant",
        icon: CheckCircle2,
      },
    ],
  },
  "finance-accountant": {
    sent_to_finance: [
      {
        action: "finance_complete",
        label: "Mark As Paid",
        note: "Payment marked as paid by Finance Accountant",
        icon: CheckCircle2,
      },
    ],
  },
};

const workflowSteps = [
  "draft",
  "manager_review",
  "budget_tl_review",
  "budget_expert_processing",
  "budget_tl_final_review",
  "manager_final_review",
  "records_processing",
  "sent_to_finance",
  "payment_completed",
];

function normalize(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function resolveRole(role: string) {
  const aliases: Record<string, string> = {
    "planning-and-budget-expert": "expert",
    "planning-and-budget-experts": "expert",
    "planing-and-budget-expert": "expert",
    "planning-budget-expert": "expert",
    "planning-budget-experts": "expert",
    "planning-and-budget-team-leader": "team-leader",
    "planing-and-budget-team-leader": "team-leader",
    "planning-budget-team-leader": "team-leader",
    "budget-team-leader": "team-leader",
    "department-head": "team-leader",
    "team-leader-department-head": "team-leader",
    "record-office": "records-office",
    "records-office": "records-office",
    "record-officer": "records-office",
    secretory: "records-office",
    "finance-department": "finance",
    "finance-accountant": "finance-accountant",
    accountant: "finance-accountant",
    "municipal-manager": "manager",
    "branch-head": "manager",
    "head-of-development-branch": "manager",
    "head-of-service-branch": "manager",
  };

  return aliases[role] ?? role;
}

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
    "http://127.0.0.1:8000"
  );
}

function fileUrl(path?: string | null) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${baseUrl()}/storage/${path}`;
}

function signerUrl(signer: any, type: "signature" | "stamp" | "titer") {
  return signer?.[`${type}_url`] || fileUrl(signer?.[`${type}_path`]);
}

function money(value?: number | string | null) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function relationName(value: any, fallback = "-") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.name ?? fallback;
}

function isPerDiemType(payment: any) {
  const value =
    `${relationName(payment?.payment_type, payment?.request_type || "")} ${payment?.request_type || ""}`.toLowerCase();
  return (
    value.includes("per diem") ||
    value.includes("per-diem") ||
    value.includes("durgoo")
  );
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function ethiopianDate(value?: string | null) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);

  const gy = d.getUTCFullYear();
  const gm = d.getUTCMonth() + 1;
  const gd = d.getUTCDate();
  const newYearDay = gy % 4 === 3 ? 12 : 11;
  const afterNewYear = gm > 9 || (gm === 9 && gd >= newYearDay);
  const ey = afterNewYear ? gy - 7 : gy - 8;
  const startYear = afterNewYear ? gy : gy - 1;
  const start = Date.UTC(startYear, 8, startYear % 4 === 3 ? 12 : 11);
  const diff = Math.floor((Date.UTC(gy, gm - 1, gd) - start) / 86400000);
  const em = Math.floor(diff / 30) + 1;
  const ed = (diff % 30) + 1;

  return `${String(ed).padStart(2, "0")}/${String(em).padStart(2, "0")}/${ey}`;
}

function TiterImage({
  signer,
  className = "",
}: {
  signer?: any;
  className?: string;
}) {
  const titer = signerUrl(signer, "titer");
  if (!titer) return null;

  return (
    <img src={titer} alt="titer" className={`object-contain ${className}`} />
  );
}

function SignerImages({
  signer,
  align = "center",
  className = "",
  imageClassName = "",
}: {
  signer?: any;
  align?: "center" | "start" | "end";
  className?: string;
  imageClassName?: string;
}) {
  const signature = signerUrl(signer, "signature");
  const titer = signerUrl(signer, "titer");

  if (!signature && !titer) return null;

  const alignClass =
    align === "end"
      ? "items-end"
      : align === "start"
        ? "items-start"
        : "items-center";

  return (
    <div className={`flex flex-col ${alignClass} gap-0.5 ${className}`}>
      {signature ? (
        <img
          src={signature}
          alt="signature"
          className={`h-16 max-w-56 object-contain print:h-12 ${imageClassName}`}
        />
      ) : null}

      {titer ? (
        <img
          src={titer}
          alt="titer"
          className="h-14 max-w-52 -rotate-[14deg] object-contain print:h-11"
        />
      ) : null}
    </div>
  );
}

function HistorySignature({ actor }: { actor?: any }) {
  const signature = signerUrl(actor, "signature");

  if (!signature) return null;

  return (
    <img
      src={signature}
      alt="signature"
      className="mt-2 h-9 max-w-28 object-contain"
    />
  );
}

export default function PaymentDetailPage() {
  const id = String(useParams().id);
  const query = usePaymentRequest(id);
  const actionMutation = usePaymentAction(() =>
    toast.success("Workflow updated"),
  );

  const [note, setNote] = useState("");
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [officeCode, setOfficeCode] = useState("");
  const [budgetYear, setBudgetYear] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [officialDate, setOfficialDate] = useState("");
  const [attachmentReferenceNo, setAttachmentReferenceNo] = useState("");
  const [attachmentOfficialDate, setAttachmentOfficialDate] = useState("");
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [printCopy, setPrintCopy] = useState<"remaining" | "exit">("remaining");
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [showAttachmentDraftForm, setShowAttachmentDraftForm] = useState(false);
  const [submitReceiverId, setSubmitReceiverId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState("");
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [financeRemark, setFinanceRemark] = useState("");
  const [attachmentTo, setAttachmentTo] = useState("");
  const [attachmentAddress, setAttachmentAddress] = useState("");
  const [attachmentCase, setAttachmentCase] = useState("");
  const [attachmentBody, setAttachmentBody] = useState("");
  const [attachmentGg, setAttachmentGg] = useState<string[]>([
    "Waajjiraa Hojii Gaggeessaa tiif",
    "Kuta Baajataa tiif",
    "Adamaa",
  ]);

  const data = query.data;

  const approversQuery = useQuery({
    queryKey: ["payment", "initial-approvers"],
    queryFn: () => paymentService.initialApprovers(),
    enabled: data?.status === "draft",
  });

  const departmentsQuery = useQuery({
    queryKey: ["payment", "departments"],
    queryFn: () => paymentService.departments(),
    enabled: data?.status === "manager_review",
  });

  const departmentTeamLeadersQuery = useQuery({
    queryKey: ["payment", "department-team-leaders", selectedDepartmentId],
    queryFn: () => paymentService.departmentTeamLeaders(selectedDepartmentId),
    enabled: data?.status === "manager_review" && Boolean(selectedDepartmentId),
  });

  const planningBudgetExpertsQuery = useQuery({
    queryKey: ["payment", "department-experts", data?.department_id],
    queryFn: () => paymentService.planningBudgetExperts(data?.department_id),
    enabled:
      data?.status === "budget_tl_review" && Boolean(data?.department_id),
  });

  const budgetAvailabilityQuery = usePaymentTypeBudgetBalance(
    {
      payment_type_id: data?.payment_type_id ?? undefined,
      fiscal_year: data?.budget_year ?? undefined,
    },
    Boolean(data?.payment_type_id && data?.status === "budget_tl_review"),
  );

  const budgetFiscalYearsQuery = useBudgetFiscalYears();

  const budgetBiCodesQuery = useBudgetBiCodes(
    { fiscal_year: budgetYear || data?.budget_year || undefined },
    Boolean(
      data?.status === "budget_expert_processing" &&
      (budgetYear || data?.budget_year),
    ),
  );

  const budgetAccountCodesQuery = useBudgetAccountCodes(
    {
      fiscal_year: budgetYear || data?.budget_year || undefined,
      bi_code: officeCode || data?.office_code || undefined,
      payment_type_id: data?.payment_type_id ?? undefined,
    },
    Boolean(
      data?.status === "budget_expert_processing" &&
      (budgetYear || data?.budget_year) &&
      (officeCode || data?.office_code),
    ),
  );

  const storedRoles = authService.getStoredRoles();

  const role =
    storedRoles
      .map((item) => resolveRole(normalize(item)))
      .find((item) => ROLE_ACTIONS[item]) ??
    resolveRole(normalize(authService.getStoredUser()?.role));

  const status = data?.status ?? "draft";
  const isPerDiem = data ? isPerDiemType(data) : false;
  const isFinanceUser = role === "finance-accountant" || role === "finance";

  const isManagerForwardStep =
    role === "manager" && status === "manager_review";
  const isManagerFinalAttachmentStep =
    role === "manager" && status === "manager_final_review" && !isPerDiem;

  const isBudgetExpertStep =
    role === "expert" && status === "budget_expert_processing";

  const isBudgetTlForwardStep =
    role === "team-leader" && status === "budget_tl_review";

  const isRecordsStep =
    role === "records-office" && status === "records_processing";
  const isFinanceStep =
    (role === "finance-accountant" || role === "finance") &&
    status === "sent_to_finance";

  useEffect(() => {
    if (!data) return;

    setOfficeCode(data.office_code ?? "");
    setBudgetYear(data.budget_year ?? "");
    setReferenceNo(data.reference_no ?? "");
    setOfficialDate(formatDate(data.official_date));
    setAttachmentReferenceNo(data.attachment_reference_no ?? "");
    setAttachmentOfficialDate(formatDate(data.attachment_official_date));
    setPaidAmount(String(data.paid_amount ?? data.amount ?? ""));
    setPaidDate(
      formatDate(data.paid_date) || new Date().toISOString().slice(0, 10),
    );
    setVoucherNo(data.voucher_no ?? "");
    setFinanceRemark(data.finance_remark ?? "");
    setAttachmentTo(data.attachment_to ?? "");
    setAttachmentAddress(data.attachment_address ?? "");
    setAttachmentCase(data.attachment_case ?? "");
    setAttachmentBody(data.attachment_body ?? "");
    setAttachmentGg(
      Array.isArray(data.attachment_gg) && data.attachment_gg.length
        ? data.attachment_gg
        : ["Waajjiraa Hojii Gaggeessaa tiif", "Kuta Baajataa tiif", "Adamaa"],
    );

    const existingAttachmentDraft =
      Boolean(data.attachment_to) ||
      Boolean(data.attachment_address) ||
      Boolean(data.attachment_case) ||
      Boolean(data.attachment_body) ||
      (Array.isArray(data.attachment_gg) && data.attachment_gg.length > 0);

    setShowAttachmentDraftForm(existingAttachmentDraft);
    setSelectedDepartmentId(String(data.department_id ?? ""));
    setSelectedTeamLeaderId(String(data.assigned_team_leader_id ?? ""));
    setSelectedExpertId(String(data.assigned_expert_id ?? ""));

    const sourceItems = data.items?.length
      ? data.items
      : [{ invoice_no: "", description: "", total_price: 0 }];

    setEditableItems(
      sourceItems.map((item: any) => ({
        budget_code:
          item.budget_code ?? item.invoice_no ?? data.budget_code ?? "",
        description: item.description ?? "",
        amount: Number(item.total_price ?? item.unit_price ?? item.amount ?? 0),
      })),
    );
  }, [data]);

  function updateEditableItem(index: number, key: string, value: string) {
    setEditableItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: key === "amount" ? Number(value || 0) : value }
          : item,
      ),
    );
  }

  function resetBudgetRows() {
    setEditableItems((current) =>
      (current.length
        ? current
        : [{ budget_code: "", description: "", amount: 0 }]
      ).map((item) => ({
        ...item,
        budget_id: undefined,
        budget_code: "",
        selected_budget: null,
      })),
    );
  }

  function handleBudgetYearChange(value: string) {
    setBudgetYear(value);
    setOfficeCode("");
    resetBudgetRows();
  }

  function handleOfficeCodeChange(value: string) {
    setOfficeCode(value);
    resetBudgetRows();
  }

  function handleBudgetCodeChange(index: number, value: string) {
    const selectedBudget = (budgetAccountCodesQuery.data ?? []).find(
      (budget: any) => String(budget.budget_code) === String(value),
    );

    setEditableItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          budget_id: selectedBudget?.id,
          budget_code: selectedBudget?.budget_code ?? value,
          selected_budget: selectedBudget ?? null,
        };
      }),
    );
  }

  function addEditableItem() {
    setEditableItems((current) => [
      ...current,
      { budget_code: "", description: "", amount: 0, selected_budget: null },
    ]);
  }

  function removeEditableItem(index: number) {
    setEditableItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function updateAttachmentGg(index: number, value: string) {
    setAttachmentGg((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function addAttachmentGg() {
    setAttachmentGg((current) => [...current, ""]);
  }

  function removeAttachmentGg(index: number) {
    setAttachmentGg((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  const officialAttachmentPayload = {
    attachment_to: attachmentTo,
    attachment_address: attachmentAddress,
    attachment_case: attachmentCase,
    attachment_body: attachmentBody,
    attachment_gg: attachmentGg.filter((item) => item.trim() !== ""),
  };

  const isManagerAttachmentComplete =
    attachmentTo.trim() !== "" &&
    attachmentAddress.trim() !== "" &&
    attachmentCase.trim() !== "" &&
    attachmentBody.trim() !== "" &&
    attachmentGg.some((item) => item.trim() !== "");

  const hasOfficialAttachmentDraft =
    Boolean(data?.attachment_to) ||
    Boolean(data?.attachment_address) ||
    Boolean(data?.attachment_case) ||
    Boolean(data?.attachment_body) ||
    (Array.isArray(data?.attachment_gg) && data.attachment_gg.length > 0) ||
    isManagerAttachmentComplete;

  function saveManagerAttachmentDraft() {
    actionMutation.mutate({
      id,
      payload: {
        action: "save_manager_final_attachment_draft",
        note: "Payment official attachment draft saved",
        ...officialAttachmentPayload,
      },
    });
  }

  function saveRecordAttachmentDraft() {
    actionMutation.mutate({
      id,
      payload: {
        action: "save_record_attachment_draft",
        note: "Record attachment draft saved",
        attachment_reference_no: attachmentReferenceNo,
        attachment_official_date: attachmentOfficialDate,
      },
    });
  }

  const allowedActions = useMemo(() => {
    if (!data) return [];

    // Every authenticated role can submit its own draft payment request.
    // After submission, the request is visible only to the selected Manager/Head
    // through current_handler_id on the backend.
    if (status === "draft") {
      return draftSubmitActions.draft;
    }

    if (role === "super-admin") {
      return Object.values(ROLE_ACTIONS).flatMap(
        (actionsByStatus) => actionsByStatus[status] || [],
      );
    }

    return ROLE_ACTIONS[role]?.[status] || [];
  }, [data, role, status]);

  if (query.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading payment request...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        Payment request not found.
      </div>
    );
  }

  const rows = data.items?.length
    ? data.items
    : [{ description: "", total_price: 0 } as any];

  const total =
    rows.reduce(
      (sum: number, item: any) =>
        sum + Number(item.total_price ?? item.unit_price ?? item.amount ?? 0),
      0,
    ) || Number(data.amount || 0);

  const recordsStamp = signerUrl(data.records_signer, "stamp");
  const finalManagerSigner = data.manager_final_signer ?? null;
  const finalBudgetTlSigner = data.budget_tl_final_signer ?? null;
  const paymentTypeWatermark = relationName(
    data.payment_type,
    data.request_type || "",
  );

  function printPaper(copy: "remaining" | "exit" = "remaining") {
    setShowApprovalHistory(false);
    setShowAttachmentPreview(false);
    setPrintCopy(copy);

    if (isPerDiem) {
      document.body.classList.add("per-diem-printing");
      setTimeout(() => {
        window.print();
        setTimeout(
          () => document.body.classList.remove("per-diem-printing"),
          200,
        );
      }, 50);
      return;
    }

    setTimeout(() => window.print(), 50);
  }

  function previewAttachment() {
    setShowApprovalHistory(false);
    setShowAttachmentPreview(true);
  }

  function printAttachment() {
    setShowApprovalHistory(false);
    setShowAttachmentPreview(true);
    setTimeout(() => window.print(), 50);
  }

  const canPreviewAttachment =
    !isPerDiem &&
    (isManagerFinalAttachmentStep ||
      ((isRecordsStep || role === "records-office") && hasOfficialAttachmentDraft) ||
      hasOfficialAttachmentDraft);

  const canPrintAttachment =
    !isPerDiem && role === "records-office" && hasOfficialAttachmentDraft;

  const shouldApplyRecordAttachmentSeal = [
    "sent_to_finance",
    "payment_completed",
    "paid",
  ].includes(status);

  return (
    <div className="space-y-5 bg-muted/30 p-4 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body * {
            visibility: hidden !important;
          }

          #payment-print-area,
          #payment-print-area *,
          #official-attachment-print-area,
          #official-attachment-print-area * {
            visibility: visible !important;
          }

          #payment-print-area,
          #official-attachment-print-area {
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 194mm !important;
            max-width: 194mm !important;
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            transform: scale(0.95);
            transform-origin: top left;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Badge className="mb-2 capitalize">
            {data.status.replaceAll("_", " ")}
          </Badge>
          <h1 className="text-2xl font-bold">Payment Request Details</h1>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowAttachmentPreview(false);
              setShowApprovalHistory((value) => !value);
            }}
          >
            <History className="mr-2 h-4 w-4" />
            Approval History
          </Button>

          {canPreviewAttachment ? (
            <>
              <Button variant="outline" onClick={previewAttachment}>
                <FileText className="mr-2 h-4 w-4" />
                Preview Attachment
              </Button>
              {canPrintAttachment ? (
                <Button variant="outline" onClick={printAttachment}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Attachment
                </Button>
              ) : null}
            </>
          ) : null}

          {!isPerDiem && !isFinanceUser ? (
            <>
              <Button variant="outline" onClick={() => printPaper("remaining")}>
                <Printer className="mr-2 h-4 w-4" />
                Print Remaining
              </Button>
              <Button onClick={() => printPaper("exit")}>
                <Printer className="mr-2 h-4 w-4" />
                Print Exit
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {!showApprovalHistory ? (
        isPerDiem ? (
          <PerDiemPrintableEmployees payment={data} />
        ) : showAttachmentPreview ? (
          <Card
            id="official-attachment-print-area"
            className="relative mx-auto min-h-[1120px] max-w-[980px] overflow-hidden rounded-none border bg-white shadow-sm print:shadow-none"
          >
            <CardContent className="relative z-10 p-12 font-serif text-[20px] leading-9 print:p-0 print:text-[14px] print:leading-6">
              <div className="pointer-events-none absolute left-16 top-10 z-20 print:left-10 print:top-6">
                <TiterImage
                  signer={data.records_signer}
                  className="h-40 max-w-[320px] -rotate-[38deg] object-contain opacity-95 print:h-32 print:max-w-[260px]"
                />
              </div>

              <div className="mb-16 flex justify-end text-[20px] italic print:text-[14px]">
                <div className="space-y-5">
                  <div>
                    Lakk{" "}
                    <span className="inline-block min-w-44 border-b border-black px-2">
                      {data.attachment_reference_no || attachmentReferenceNo || ""}
                    </span>
                  </div>
                  <div>
                    Guyyaa{" "}
                    <span className="inline-block min-w-44 border-b border-black px-2">
                      {ethiopianDate(data.attachment_official_date || attachmentOfficialDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-20 space-y-10">
                <p className="italic underline">
                  To:{" "}
                  <span className="inline-block min-w-44 border-b border-black px-2 not-italic">
                    {attachmentTo || data.attachment_to || ""}
                  </span>
                </p>
                <p className="italic underline">
                  Adress:{" "}
                  <span className="inline-block min-w-44 border-b border-black px-2 not-italic">
                    {attachmentAddress || data.attachment_address || ""}
                  </span>
                </p>
                <p className="italic underline">
                  Case:-{" "}
                  <span className="inline-block min-w-44 border-b border-black px-2 not-italic">
                    {attachmentCase || data.attachment_case || ""}
                  </span>
                </p>
                <div className="min-h-[270px]">
                  <p className="mb-4 italic underline">Body :</p>
                  <p className="whitespace-pre-line">
                    {attachmentBody || data.attachment_body || ""}
                  </p>
                </div>
              </div>

              <div className="relative mt-20 min-h-[210px]">
                {shouldApplyRecordAttachmentSeal && recordsStamp ? (
                  <img
                    src={recordsStamp}
                    alt="records office stamp"
                    className="pointer-events-none absolute left-1/3 top-10 z-20 h-36 w-36 -translate-x-1/2 object-contain opacity-95 print:h-28 print:w-28"
                  />
                ) : null}


                <div className="absolute right-0 top-0 w-[360px] text-right font-bold">
                  <p>Nagaa Wajjiin</p>
                  <div className="mt-2 flex justify-end">
                    <SignerImages
                      signer={data.manager_final_signer}
                      align="end"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 text-[20px] print:text-[13px]">
                <p className="mb-4 underline">G.G</p>
                {(attachmentGg.length
                  ? attachmentGg
                  : data.attachment_gg || []
                ).map((item: string, index: number) =>
                  item?.trim() ? (
                    <p key={`${item}-${index}`} className="mb-2">
                      ➢&nbsp;&nbsp; {item}
                    </p>
                  ) : null,
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            id="payment-print-area"
            className="relative mx-auto max-w-[980px] overflow-hidden rounded-none border bg-white shadow-sm print:shadow-none"
          >
            {paymentTypeWatermark ? (
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <span className="select-none rotate-[-35deg] text-[72px] font-normal tracking-wider text-slate-700/20 print:text-[62px]">
                  {paymentTypeWatermark}
                </span>
              </div>
            ) : null}

            <div className="pointer-events-none absolute left-8 top-8 z-10 rounded border border-dashed border-slate-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 print:left-4 print:top-4 print:text-[10px]">
              {printCopy === "exit" ? "EXIT COPY" : "REMAINING COPY"}
            </div>

            <CardContent className="relative z-10 p-10 font-serif text-[18px] leading-8 print:p-0 print:text-[13px] print:leading-5">
              <div className="mb-5 flex justify-end text-[17px] font-bold print:text-[13px]">
                <div className="space-y-2">
                  <div>
                    Lakk{" "}
                    <span className="inline-block min-w-40 border-b border-black px-2 font-normal">
                      {data.reference_no || ""}
                    </span>
                  </div>

                  <div>
                    Guyyaa{" "}
                    <span className="inline-block min-w-40 border-b border-black px-2 font-normal">
                      {ethiopianDate(data.official_date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute left-14 top-8 z-20 print:left-10 print:top-6">
                <TiterImage
                  signer={data.records_signer}
                  className="h-32 max-w-[260px] -rotate-[12deg] object-contain opacity-95 print:h-28 print:max-w-[230px]"
                />
              </div>

              <div className="mb-16 print:mb-14" />

              <div className="mb-3 space-y-1 text-center font-bold">
                <p>
                  <span className="bg-blue-100/80 px-1">
                    Biiroo Maallaqaa Oromiyaatti
                  </span>
                </p>
                <p>Waajjira Maallaqaa&nbsp; Bul. Mag. Adaamaa</p>
                <p>
                  Uunkaa&nbsp; Baasiin Hojii Adeemsiftuu Puulii Irratti Ittin
                  Gaafatamuu
                </p>
              </div>

              <div className="mb-3">
                <p>Adeemsa Hojii Bulchiinsa Faayinaansii tiif</p>
                <p>
                  Baajataa Bara{" "}
                  <span className="inline-block min-w-24 border-b border-black px-2">
                    {data.budget_year || ""}
                  </span>
                  Mana&nbsp; Hojii&nbsp; Keenyaaf Eyyamamee&nbsp; Irraa&nbsp;
                  Kodii Mana Hojii
                </p>
                <p>
                  <span className="inline-block min-w-32 border-b border-black px-2">
                    {data.office_code || ""}
                  </span>
                  Gulantaa Herreegaa Kana Gaditti Ibsamee.
                </p>
              </div>

              <div className="relative mb-1">
                <table className="w-full border-collapse border border-black text-center text-[17px] print:text-[11px]">
                  <thead>
                    <tr>
                      <th className="w-[8%] border border-black px-2 py-1">
                        Lakk
                      </th>
                      <th className="w-[24%] border border-black px-2 py-1">
                        Gulantaa Herregaa
                      </th>
                      <th className="w-[24%] border border-black px-2 py-1">
                        Hamma Qarshii
                      </th>
                      <th className="border border-black px-2 py-1">Ibsa</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((item: any, index: number) => (
                      <tr key={item.id ?? index}>
                        <td className="h-20 border border-black px-2 py-1 align-top print:h-12">
                          {index + 1}
                        </td>
                        <td className="border border-black px-2 py-1 align-top">
                          {item.invoice_no || data.budget_code || ""}
                        </td>
                        <td className="border border-black px-2 py-1 align-top">
                          {money(
                            item.total_price ??
                              item.unit_price ??
                              item.amount ??
                              0,
                          )}
                        </td>
                        <td className="border border-black px-2 py-1 align-top text-left">
                          {item.description || ""}
                        </td>
                      </tr>
                    ))}

                    <tr>
                      <td
                        colSpan={2}
                        className="border border-black px-2 py-1 text-left"
                      >
                        Ida’amaa Qarshii
                      </td>
                      <td className="border border-black px-2 py-1">
                        {money(total)}
                      </td>
                      <td className="border border-black px-2 py-1" />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="relative mb-5 text-[17px] print:text-[11px]">
                <p>
                  Qar.{" "}
                  <span className="inline-block min-w-[80%] border-b border-black px-2">
                    {money(total)} ({numberToWords(total)})
                  </span>
                </p>

                <p className="relative min-h-14 px-24 text-center">
                  Accawntii W/ra Mana Qopheesaa irra bahi ta’e kaffatii akka
                  rawwatamuu ni beeksifnaa.
                </p>
              </div>

              <div className="relative mb-5 min-h-[150px] print:min-h-[118px]">
                {printCopy === "remaining" ? (
                  <>
                    <div className="absolute left-6 top-0 w-[210px] print:left-4 print:w-[175px]">
                      <SignerImages
                        signer={data.budget_expert_signer}
                        align="start"
                      />
                    </div>

                    <div className="absolute left-1/2 top-8 w-[230px] -translate-x-1/2 print:top-5 print:w-[185px]">
                      <SignerImages
                        signer={finalBudgetTlSigner}
                        align="center"
                      />
                    </div>
                  </>
                ) : null}

                <div className="absolute right-4 top-14 w-[240px] text-right font-bold print:right-2 print:top-10 print:w-[195px]">
                  <p>Nagaa Wajjiin</p>
                  <div className="mt-1 flex justify-end">
                    <SignerImages signer={finalManagerSigner} align="end" />
                  </div>
                </div>
              </div>

              <div className="relative mb-7 text-[17px] print:text-[11px]">
                {recordsStamp ? (
                  <img
                    src={recordsStamp}
                    alt="records office stamp"
                    className="pointer-events-none absolute left-1/2 top-8 z-20 h-28 w-28 -translate-x-1/2 object-contain opacity-95 print:top-4 print:h-24 print:w-24"
                  />
                ) : null}
                <p className="mb-4 underline">G.G</p>
                <p>➢&nbsp;&nbsp; Waajjiraa Hojii Gaggeesaa tiif</p>
                <p>➢&nbsp;&nbsp; Kuta Baajataa tiif</p>
                <p className="ml-8 underline">Adamaa</p>
              </div>

              <div className="text-[17px] print:text-[11px]">
                <p>
                  Hojii Bittaa fi Bulchiinsa Faayinaansi Itti Ogeessaa
                  Herreegaatiin kan Guutamuu.
                </p>
                <p>Leejaraa Bajataa/Baasii Irraa Hir’ifamee jira</p>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
          <CardHeader>
            <CardTitle>Approval History</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {!data.histories?.length ? (
              <p className="text-sm text-muted-foreground">
                No approval history recorded.
              </p>
            ) : (
              data.histories.map((history: any) => (
                <div
                  key={history.id}
                  className="grid gap-3 rounded-xl border bg-muted/40 p-4 text-sm md:grid-cols-[1fr_1fr_1fr]"
                >
                  <div>
                    <p className="font-semibold">{history.action}</p>
                    <p className="text-muted-foreground">
                      {history.from_status ?? "-"} → {history.to_status ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">
                      {history.actor?.name ?? "System"}
                    </p>
                    <p className="text-muted-foreground">
                      {history.note ?? "No approval description"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      {ethiopianDate(history.created_at)}
                    </p>
                    <HistorySignature actor={history.actor} />
                  </div>
                </div>
              ))
            )}

            <div className="border-t pt-4">
              <p className="mb-2 font-semibold">Files</p>

              {!data.attachments?.length ? (
                <p className="text-sm text-muted-foreground">
                  No payment document attached.
                </p>
              ) : (
                data.attachments.map((attachment: any) => (
                  <a
                    key={attachment.id}
                    href={fileUrl(attachment.stored_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-2 flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
                  >
                    <span>{attachment.original_name}</span>
                    <span className="text-blue-600">Open</span>
                  </a>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isBudgetExpertStep && isPerDiem ? (
        <PerDiemExpertWorkspace payment={data} />
      ) : null}

      {isBudgetExpertStep && !isPerDiem ? (
        <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
          <CardHeader>
            <CardTitle>Planning & Budget Experts Form</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  Baajataa Bara / Budget Year (E.C)
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={budgetYear}
                  onChange={(event) =>
                    handleBudgetYearChange(event.target.value)
                  }
                >
                  <option value="">Select budget year</option>
                  {(budgetFiscalYearsQuery.data ?? []).map((year: string) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                  {budgetYear &&
                  !(budgetFiscalYearsQuery.data ?? []).includes(budgetYear) ? (
                    <option value={budgetYear}>{budgetYear}</option>
                  ) : null}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Kodii Mana Hojii / Office Code (BI Code)
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={officeCode}
                  disabled={!budgetYear || budgetBiCodesQuery.isLoading}
                  onChange={(event) =>
                    handleOfficeCodeChange(event.target.value)
                  }
                >
                  <option value="">
                    {budgetBiCodesQuery.isLoading
                      ? "Loading BI Codes..."
                      : "Select BI Code"}
                  </option>
                  {(budgetBiCodesQuery.data ?? []).map((code: string) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                  {officeCode &&
                  !(budgetBiCodesQuery.data ?? []).includes(officeCode) ? (
                    <option value={officeCode}>{officeCode}</option>
                  ) : null}
                </select>
              </div>
            </div>

            <div className="rounded-xl border bg-emerald-50/60 p-4 text-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-emerald-950">
                    Budget Recommendation
                  </p>
                  <p className="text-emerald-900">
                    Select fiscal year, BI Code, and Account Code. Balance Not
                    Committed is shown here for guidance only. Amount and
                    description must be filled by the Planning & Budget Expert.
                  </p>
                </div>
                <Badge variant="outline">
                  {officeCode || "No BI Code selected"}
                </Badge>
              </div>

              {editableItems.some((item) => item.selected_budget) ? (
                <div className="overflow-x-auto rounded-lg border bg-white">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-muted/60 text-left">
                      <tr>
                        <th className="px-3 py-2">Fiscal Year</th>
                        <th className="px-3 py-2">BI Code / Office Code</th>
                        <th className="px-3 py-2">Account Code</th>
                        <th className="px-3 py-2">Account Description</th>
                        <th className="px-3 py-2 text-right">
                          Adjusted Budget
                        </th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">
                          Balance Not Committed
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableItems
                        .filter((item) => item.selected_budget)
                        .map((item, recommendationIndex) => {
                          const budget = item.selected_budget;

                          return (
                            <tr
                              key={`${budget.id ?? budget.budget_code}-${recommendationIndex}`}
                              className="border-t"
                            >
                              <td className="px-3 py-2">
                                {budget.fiscal_year ?? budgetYear ?? "-"}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {budget.bi_code ?? officeCode ?? "-"}
                              </td>
                              <td className="px-3 py-2">
                                {budget.budget_code ?? item.budget_code ?? "-"}
                              </td>
                              <td className="px-3 py-2">
                                {budget.account_name ??
                                  budget.description ??
                                  "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(budget.allocated_amount)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(budget.used_amount)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                                {money(budget.remaining_amount)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-emerald-900">
                  No Account Code selected yet. Balance Not Committed will
                  appear here after selecting a Budget Code.
                </p>
              )}
            </div>

            {editableItems.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_1fr_1.4fr_auto]"
              >
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={item.budget_code}
                  disabled={
                    !budgetYear ||
                    !officeCode ||
                    budgetAccountCodesQuery.isLoading
                  }
                  onChange={(event) =>
                    handleBudgetCodeChange(index, event.target.value)
                  }
                >
                  <option value="">
                    {budgetAccountCodesQuery.isLoading
                      ? "Loading Account Codes..."
                      : "Gulantaa Herregaa / Budget Code"}
                  </option>
                  {(budgetAccountCodesQuery.data ?? []).map((budget: any) => (
                    <option
                      key={`${budget.id}-${budget.budget_code}`}
                      value={budget.budget_code}
                    >
                      {budget.budget_code}
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Hamma Qarshii / Amount"
                  value={item.amount}
                  onChange={(event) =>
                    updateEditableItem(index, "amount", event.target.value)
                  }
                />

                <Input
                  placeholder="Ibsa / Description"
                  value={item.description}
                  onChange={(event) =>
                    updateEditableItem(index, "description", event.target.value)
                  }
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={editableItems.length === 1}
                  onClick={() => removeEditableItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addEditableItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isManagerFinalAttachmentStep ? (
        <div className="space-y-3 print:hidden">
          {!showAttachmentDraftForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAttachmentDraftForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Attachment
            </Button>
          ) : null}

          {showAttachmentDraftForm ? (
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Official Attachment Draft</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-blue-50/60 p-4 text-sm text-blue-950">
                  Add attachment details first, save as draft, then final approve.
                  Existing Manager / Head forwarding logic is unchanged.
                </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">To</label>
                <Input
                  value={attachmentTo}
                  onChange={(event) => setAttachmentTo(event.target.value)}
                  placeholder="To"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={attachmentAddress}
                  onChange={(event) => setAttachmentAddress(event.target.value)}
                  placeholder="Address"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Case</label>
              <Input
                value={attachmentCase}
                onChange={(event) => setAttachmentCase(event.target.value)}
                placeholder="Case"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea
                value={attachmentBody}
                onChange={(event) => setAttachmentBody(event.target.value)}
                placeholder="Body"
                className="min-h-32"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">G.G</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addAttachmentGg}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add G.G
                </Button>
              </div>

              {attachmentGg.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(event) =>
                      updateAttachmentGg(index, event.target.value)
                    }
                    placeholder="G.G recipient"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={attachmentGg.length === 1}
                    onClick={() => removeAttachmentGg(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  actionMutation.isPending || !isManagerAttachmentComplete
                }
                onClick={saveManagerAttachmentDraft}
              >
                Save Attachment Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!isManagerAttachmentComplete}
                onClick={previewAttachment}
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview Attachment
              </Button>
              {canPrintAttachment ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isManagerAttachmentComplete}
                  onClick={printAttachment}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Attachment
                </Button>
              ) : null}
              </div>
            </CardContent>
          </Card>
          ) : null}
        </div>
      ) : null}

      <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
        <CardHeader>
          <CardTitle>Workflow Actions</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {allowedActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No action available for your role at this status.
            </p>
          ) : (
            <>
              {status === "draft" ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Send To</label>
                  <select
                    required
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={submitReceiverId}
                    onChange={(event) =>
                      setSubmitReceiverId(event.target.value)
                    }
                    disabled={approversQuery.isLoading}
                  >
                    <option value="">
                      {approversQuery.isLoading
                        ? "Loading approvers..."
                        : "Select Manager / Service Head / Development Head"}
                    </option>

                    {(approversQuery.data ?? []).map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name} —{" "}
                        {user.display_role ?? user.role ?? "Approver"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isManagerForwardStep ? (
                <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Department</label>
                      <select
                        required
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={selectedDepartmentId}
                        onChange={(event) => {
                          setSelectedDepartmentId(event.target.value);
                          setSelectedTeamLeaderId("");
                        }}
                        disabled={departmentsQuery.isLoading}
                      >
                        <option value="">
                          {departmentsQuery.isLoading
                            ? "Loading departments..."
                            : "Select department"}
                        </option>

                        {(departmentsQuery.data ?? []).map(
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

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Department Team Leader
                      </label>
                      <select
                        required
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={selectedTeamLeaderId}
                        onChange={(event) =>
                          setSelectedTeamLeaderId(event.target.value)
                        }
                        disabled={
                          !selectedDepartmentId ||
                          departmentTeamLeadersQuery.isLoading
                        }
                      >
                        <option value="">
                          {departmentTeamLeadersQuery.isLoading
                            ? "Loading Team Leaders..."
                            : "Select Team Leader"}
                        </option>

                        {(departmentTeamLeadersQuery.data ?? []).map(
                          (leader: any) => (
                            <option key={leader.id} value={leader.id}>
                              {leader.name} —{" "}
                              {leader.display_role ?? "Team Leader"}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  {selectedDepartmentId &&
                  !departmentTeamLeadersQuery.isLoading &&
                  (departmentTeamLeadersQuery.data ?? []).length === 0 ? (
                    <p className="text-xs text-destructive">
                      No active Team Leader found in the selected department.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isBudgetTlForwardStep ? (
                <div className="grid gap-4">
                  <div className="rounded-xl border bg-blue-50/60 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          Budget Availability Before Expert Assignment
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance Not Committed by BI Code for the selected
                          payment type/account code.
                        </p>
                      </div>
                      <Badge variant="outline">
                        {relationName(
                          data.payment_type,
                          data.request_type || "Payment Type",
                        )}
                      </Badge>
                    </div>

                    {budgetAvailabilityQuery.isLoading ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading budget balances...
                      </div>
                    ) : (budgetAvailabilityQuery.data?.data ?? []).length ? (
                      <div className="overflow-x-auto rounded-lg border bg-white">
                        <table className="w-full min-w-[760px] text-sm">
                          <thead className="bg-muted/60 text-left">
                            <tr>
                              <th className="px-3 py-2">Fiscal Year</th>
                              <th className="px-3 py-2">
                                BI Code / Office Code
                              </th>
                              <th className="px-3 py-2">Account Code</th>
                              <th className="px-3 py-2">Account Name</th>
                              <th className="px-3 py-2 text-right">
                                Adjusted Budget
                              </th>
                              <th className="px-3 py-2 text-right">Debit</th>
                              <th className="px-3 py-2 text-right">
                                Balance Not Committed
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(budgetAvailabilityQuery.data?.data ?? []).map(
                              (budget: any) => (
                                <tr
                                  key={
                                    budget.id ??
                                    `${budget.bi_code}-${budget.budget_code}`
                                  }
                                  className="border-t"
                                >
                                  <td className="px-3 py-2">
                                    {budget.fiscal_year ??
                                      data.budget_year ??
                                      "-"}
                                  </td>
                                  <td className="px-3 py-2 font-medium">
                                    {budget.bi_code ?? "-"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {budget.budget_code ?? "-"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {budget.account_name ?? "-"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {money(budget.allocated_amount)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {money(budget.used_amount)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold">
                                    {money(budget.remaining_amount)}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                          <tfoot className="border-t bg-muted/40 font-semibold">
                            <tr>
                              <td className="px-3 py-2" colSpan={4}>
                                Total
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(
                                  budgetAvailabilityQuery.data?.meta
                                    ?.total_adjusted_budget,
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(
                                  budgetAvailabilityQuery.data?.meta
                                    ?.total_debit,
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(
                                  budgetAvailabilityQuery.data?.meta
                                    ?.total_balance_not_committed,
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active budget balance found for this payment
                        type/account code.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Expert</label>
                    <select
                      required
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={selectedExpertId}
                      onChange={(event) =>
                        setSelectedExpertId(event.target.value)
                      }
                      disabled={planningBudgetExpertsQuery.isLoading}
                    >
                      <option value="">
                        {planningBudgetExpertsQuery.isLoading
                          ? "Loading Experts..."
                          : "Select Expert"}
                      </option>

                      {(planningBudgetExpertsQuery.data ?? []).map(
                        (expert: any) => (
                          <option key={expert.id} value={expert.id}>
                            {expert.name} —{" "}
                            {expert.display_role ?? expert.role ?? "Expert"}
                          </option>
                        ),
                      )}
                    </select>

                    {!planningBudgetExpertsQuery.isLoading &&
                    (planningBudgetExpertsQuery.data ?? []).length === 0 ? (
                      <p className="text-xs text-destructive">
                        No active Expert found in this department. Assign the
                        Expert role and department to at least one active user.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {isRecordsStep ? (
                <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">
                        Payment Lakk / Reference No
                      </label>
                      <Input
                        value={referenceNo}
                        onChange={(event) => setReferenceNo(event.target.value)}
                        placeholder="Enter payment reference number"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Payment Guyyaa / Date
                      </label>
                      <Input
                        type="date"
                        value={officialDate}
                        onChange={(event) =>
                          setOfficialDate(event.target.value)
                        }
                      />
                    </div>

                    {hasOfficialAttachmentDraft ? (
                      <>
                        <div>
                          <label className="text-sm font-medium">
                            Attachment Lakk / Reference No
                          </label>
                          <Input
                            value={attachmentReferenceNo}
                            onChange={(event) =>
                              setAttachmentReferenceNo(event.target.value)
                            }
                            placeholder="Enter attachment reference number"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Attachment Guyyaa / Date
                          </label>
                          <Input
                            type="date"
                            value={attachmentOfficialDate}
                            onChange={(event) =>
                              setAttachmentOfficialDate(event.target.value)
                            }
                          />
                        </div>
                      </>
                    ) : null}
                  </div>

                  {hasOfficialAttachmentDraft ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          actionMutation.isPending ||
                          !attachmentReferenceNo ||
                          !attachmentOfficialDate
                        }
                        onClick={saveRecordAttachmentDraft}
                      >
                        Save Attachment Draft
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={previewAttachment}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Preview Attachment
                      </Button>
                      {canPrintAttachment ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={printAttachment}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print Attachment
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No official attachment draft was added by Manager / Head for this payment.
                    </p>
                  )}
                </div>
              ) : null}

              {isFinanceStep ? (
                <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Approved Amount
                      </p>
                      <p className="text-lg font-semibold">
                        {money(data.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Balance Not Committed
                      </p>
                      <p className="text-lg font-semibold">
                        {money(data.budget?.remaining_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        BI / Account Code
                      </p>
                      <p className="text-sm font-medium">
                        {data.office_code || data.budget?.bi_code || "-"} /{" "}
                        {data.budget_code || data.budget?.budget_code || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Paid Amount</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(event) => setPaidAmount(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Paid Date</label>
                      <Input
                        type="date"
                        value={paidDate}
                        onChange={(event) => setPaidDate(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Voucher No</label>
                      <Input
                        value={voucherNo}
                        onChange={(event) => setVoucherNo(event.target.value)}
                        placeholder="Voucher/reference no"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Finance Remark
                    </label>
                    <Textarea
                      value={financeRemark}
                      onChange={(event) => setFinanceRemark(event.target.value)}
                      placeholder="Payment remark"
                    />
                  </div>
                </div>
              ) : null}

              <Textarea
                placeholder="Approval description / rejection reason"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                {allowedActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.action}
                      size="sm"
                      variant={item.variant ?? "outline"}
                      disabled={
                        actionMutation.isPending ||
                        (item.action === "submit" && !submitReceiverId) ||
                        (item.action === "manager_approve" &&
                          (!selectedDepartmentId || !selectedTeamLeaderId)) ||
                        (item.action === "manager_final_approve" &&
                          isManagerFinalAttachmentStep &&
                          showAttachmentDraftForm &&
                          !isManagerAttachmentComplete) ||
                        (item.action === "budget_tl_approve" &&
                          !selectedExpertId) ||
                        (item.action === "finance_complete" &&
                          (!paidAmount || !paidDate))
                      }
                      onClick={() =>
                        actionMutation.mutate({
                          id,
                          payload: {
                            action: item.action,
                            note: note || item.note,
                            ...(item.action === "submit"
                              ? { send_to_user_id: submitReceiverId }
                              : {}),
                            ...(item.action === "manager_approve"
                              ? {
                                  department_id: selectedDepartmentId,
                                  team_leader_user_id: selectedTeamLeaderId,
                                }
                              : {}),
                            ...(item.action === "budget_tl_approve"
                              ? { expert_user_id: selectedExpertId }
                              : {}),
                            ...(item.action === "manager_final_approve" &&
                            isManagerFinalAttachmentStep &&
                            showAttachmentDraftForm &&
                            isManagerAttachmentComplete
                              ? officialAttachmentPayload
                              : {}),
                            ...(item.action === "expert_complete"
                              ? {
                                  office_code: officeCode,
                                  budget_code:
                                    editableItems[0]?.budget_code ?? "",
                                  budget_id: editableItems[0]?.budget_id,
                                  budget_year: budgetYear,
                                  items: editableItems.map((editableItem) => ({
                                    ...editableItem,
                                    total_price: editableItem.amount,
                                  })),
                                }
                              : {}),
                            ...(item.action === "records_process"
                              ? {
                                  reference_no: referenceNo,
                                  official_date: officialDate,
                                  attachment_reference_no: attachmentReferenceNo,
                                  attachment_official_date: attachmentOfficialDate,
                                }
                              : {}),
                            ...(item.action === "finance_complete"
                              ? {
                                  paid_amount: paidAmount,
                                  paid_date: paidDate,
                                  voucher_no: voucherNo,
                                  finance_remark: financeRemark,
                                }
                              : {}),
                            ...(item.action === "reject"
                              ? { reason: note || item.note }
                              : {}),
                          },
                        })
                      }
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function numberToWords(n:number): string {
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const conv=(num:number):string=>{
    if(num<20) return ones[num];
    if(num<100) return tens[Math.floor(num/10)] + (num%10?' '+ones[num%10]:'');
    if(num<1000) return ones[Math.floor(num/100)]+' Hundred'+(num%100?' '+conv(num%100):'');
    if(num<1000000) return conv(Math.floor(num/1000))+' Thousand'+(num%1000?' '+conv(num%1000):'');
    return String(num);
  };
  return conv(Math.floor(n)) + ' Birr Only';
}


