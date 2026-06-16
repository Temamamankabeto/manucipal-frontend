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
import { usePaymentAction, usePaymentRequest } from "@/hooks/payment/use-payment";
import { usePaymentTypeBudgetBalance } from "@/hooks/budget/use-budget";
import { authService } from "@/services/auth/auth.service";
import { paymentService } from "@/services/payment/payment.service";
import { PerDiemExpertWorkspace, PerDiemPrintableEmployees } from "@/components/payment/per-diem-expert-workspace";

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
      note: "Accepted and forwarded to Planning & Budget Team Leader",
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
  "planning-budget-team-leader": {
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
  "planning-budget-experts": {
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
    "planning-and-budget-expert": "planning-budget-experts",
    "planning-and-budget-experts": "planning-budget-experts",
    "planing-and-budget-expert": "planning-budget-experts",
    "planning-budget-expert": "planning-budget-experts",
    "planning-and-budget-team-leader": "planning-budget-team-leader",
    "planing-and-budget-team-leader": "planning-budget-team-leader",
    "budget-team-leader": "planning-budget-team-leader",
    "record-office": "records-office",
    "records-office": "records-office",
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
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:8000";
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
  const value = `${relationName(payment?.payment_type, payment?.request_type || "")} ${payment?.request_type || ""}`.toLowerCase();
  return value.includes("per diem") || value.includes("per-diem") || value.includes("durgoo");
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

  return <img src={titer} alt="titer" className={`object-contain ${className}`} />;
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
    align === "end" ? "items-end" : align === "start" ? "items-start" : "items-center";

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
  const actionMutation = usePaymentAction(() => toast.success("Workflow updated"));

  const [note, setNote] = useState("");
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [officeCode, setOfficeCode] = useState("");
  const [budgetYear, setBudgetYear] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [officialDate, setOfficialDate] = useState("");
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [printCopy, setPrintCopy] = useState<"remaining" | "exit">("remaining");
  const [submitReceiverId, setSubmitReceiverId] = useState("");
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [financeRemark, setFinanceRemark] = useState("");

  const data = query.data;

  const approversQuery = useQuery({
    queryKey: ["payment", "initial-approvers"],
    queryFn: () => paymentService.initialApprovers(),
    enabled: data?.status === "draft",
  });

  const planningBudgetExpertsQuery = useQuery({
    queryKey: ["payment", "planning-budget-experts"],
    queryFn: () => paymentService.planningBudgetExperts(),
    enabled: data?.status === "budget_tl_review",
  });

  const budgetAvailabilityQuery = usePaymentTypeBudgetBalance(
    {
      payment_type_id: data?.payment_type_id ?? undefined,
      fiscal_year: data?.budget_year ?? undefined,
    },
    Boolean(data?.payment_type_id && data?.status === "budget_tl_review"),
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

  const isBudgetExpertStep =
    role === "planning-budget-experts" && status === "budget_expert_processing";

  const isBudgetTlForwardStep =
    role === "planning-budget-team-leader" && status === "budget_tl_review";

  const isRecordsStep = role === "records-office" && status === "records_processing";
  const isFinanceStep = (role === "finance-accountant" || role === "finance") && status === "sent_to_finance";

  useEffect(() => {
    if (!data) return;

    setOfficeCode(data.office_code ?? "");
    setBudgetYear(data.budget_year ?? "");
    setReferenceNo(data.reference_no ?? "");
    setOfficialDate(formatDate(data.official_date));
    setPaidAmount(String(data.paid_amount ?? data.amount ?? ""));
    setPaidDate(formatDate(data.paid_date) || new Date().toISOString().slice(0, 10));
    setVoucherNo(data.voucher_no ?? "");
    setFinanceRemark(data.finance_remark ?? "");

    const sourceItems = data.items?.length
      ? data.items
      : [{ invoice_no: "", description: "", total_price: 0 }];

    setEditableItems(
      sourceItems.map((item: any) => ({
        budget_code: item.budget_code ?? item.invoice_no ?? data.budget_code ?? "",
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

  function addEditableItem() {
    setEditableItems((current) => [
      ...current,
      { budget_code: "", description: "", amount: 0 },
    ]);
  }

  function removeEditableItem(index: number) {
    setEditableItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  const allowedActions = useMemo(() => {
    if (!data) return [];

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
  const paymentTypeWatermark = relationName(data.payment_type, data.request_type || "");

  function printPaper(copy: "remaining" | "exit" = "remaining") {
    setShowApprovalHistory(false);
    setPrintCopy(copy);

    if (isPerDiem) {
      document.body.classList.add("per-diem-printing");
      setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove("per-diem-printing"), 200);
      }, 50);
      return;
    }

    setTimeout(() => window.print(), 50);
  }

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
          #payment-print-area * {
            visibility: visible !important;
          }

          #payment-print-area {
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
          <Badge className="mb-2 capitalize">{data.status.replaceAll("_", " ")}</Badge>
          <h1 className="text-2xl font-bold">Payment Request Details</h1>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowApprovalHistory((value) => !value)}
          >
            <History className="mr-2 h-4 w-4" />
            Approval History
          </Button>

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
                Mana&nbsp; Hojii&nbsp; Keenyaaf Eyyamamee&nbsp; Irraa&nbsp; Kodii
                Mana Hojii
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
                    <th className="w-[8%] border border-black px-2 py-1">Lakk</th>
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
                        {money(item.total_price ?? item.unit_price ?? item.amount ?? 0)}
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
                    <td className="border border-black px-2 py-1">{money(total)}</td>
                    <td className="border border-black px-2 py-1" />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="relative mb-5 text-[17px] print:text-[11px]">
              <p>
                Qar.{" "}
                <span className="inline-block min-w-[80%] border-b border-black px-2">
                  {money(total)} ({data.description || ""})
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
                    <SignerImages signer={data.budget_expert_signer} align="start" />
                  </div>

                  <div className="absolute left-1/2 top-8 w-[230px] -translate-x-1/2 print:top-5 print:w-[185px]">
                    <SignerImages signer={finalBudgetTlSigner} align="center" />
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
                Hojii Bittaa fi Bulchiinsa Faayinaansi Itti Ogeessaa Herreegaatiin
                kan Guutamuu.
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
                    <p className="font-medium">{history.actor?.name ?? "System"}</p>
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

      {isBudgetExpertStep && isPerDiem ? <PerDiemExpertWorkspace payment={data} /> : null}


      {isBudgetExpertStep && !isPerDiem ? (
        <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
          <CardHeader>
            <CardTitle>Planning & Budget Experts Form</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  Kodii Mana Hojii / Office Code
                </label>
                <Input
                  value={officeCode}
                  onChange={(event) => setOfficeCode(event.target.value)}
                  placeholder="Enter office code"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Baajataa Bara / Budget Year (E.C)
                </label>
                <Input
                  value={budgetYear}
                  onChange={(event) => setBudgetYear(event.target.value)}
                  placeholder="2017"
                />
              </div>
            </div>

            {editableItems.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_1fr_1.4fr_auto]"
              >
                <Input
                  placeholder="Gulantaa Herregaa / Budget Code"
                  value={item.budget_code}
                  onChange={(event) =>
                    updateEditableItem(index, "budget_code", event.target.value)
                  }
                />

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
                    onChange={(event) => setSubmitReceiverId(event.target.value)}
                    disabled={approversQuery.isLoading}
                  >
                    <option value="">
                      {approversQuery.isLoading
                        ? "Loading approvers..."
                        : "Select Manager / Service Head / Development Head"}
                    </option>

                    {(approversQuery.data ?? []).map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {user.display_role ?? user.role ?? "Approver"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isBudgetTlForwardStep ? (
                <div className="grid gap-4">
                  <div className="rounded-xl border bg-blue-50/60 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Budget Availability Before Expert Assignment</p>
                        <p className="text-xs text-muted-foreground">
                          Balance Not Committed by BI Code for the selected payment type/account code.
                        </p>
                      </div>
                      <Badge variant="outline">
                        {relationName(data.payment_type, data.request_type || "Payment Type")}
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
                              <th className="px-3 py-2">BI Code / Office Code</th>
                              <th className="px-3 py-2">Account Code</th>
                              <th className="px-3 py-2">Account Name</th>
                              <th className="px-3 py-2 text-right">Adjusted Budget</th>
                              <th className="px-3 py-2 text-right">Debit</th>
                              <th className="px-3 py-2 text-right">Balance Not Committed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(budgetAvailabilityQuery.data?.data ?? []).map((budget: any) => (
                              <tr key={budget.id ?? `${budget.bi_code}-${budget.budget_code}`} className="border-t">
                                <td className="px-3 py-2">{budget.fiscal_year ?? data.budget_year ?? "-"}</td>
                                <td className="px-3 py-2 font-medium">{budget.bi_code ?? "-"}</td>
                                <td className="px-3 py-2">{budget.budget_code ?? "-"}</td>
                                <td className="px-3 py-2">{budget.account_name ?? "-"}</td>
                                <td className="px-3 py-2 text-right">{money(budget.allocated_amount)}</td>
                                <td className="px-3 py-2 text-right">{money(budget.used_amount)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{money(budget.remaining_amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t bg-muted/40 font-semibold">
                            <tr>
                              <td className="px-3 py-2" colSpan={4}>Total</td>
                              <td className="px-3 py-2 text-right">
                                {money(budgetAvailabilityQuery.data?.meta?.total_adjusted_budget)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(budgetAvailabilityQuery.data?.meta?.total_debit)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(budgetAvailabilityQuery.data?.meta?.total_balance_not_committed)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active budget balance found for this payment type/account code.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Planning & Budget Expert
                    </label>
                  <select
                    required
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={selectedExpertId}
                    onChange={(event) => setSelectedExpertId(event.target.value)}
                    disabled={planningBudgetExpertsQuery.isLoading}
                  >
                    <option value="">
                      {planningBudgetExpertsQuery.isLoading
                        ? "Loading Planning & Budget Experts..."
                        : "Select Planning & Budget Expert"}
                    </option>

                    {(planningBudgetExpertsQuery.data ?? []).map((expert: any) => (
                      <option key={expert.id} value={expert.id}>
                        {expert.name} —{" "}
                        {expert.display_role ??
                          expert.role ??
                          "Planning & Budget Expert"}
                      </option>
                    ))}
                  </select>

                  {!planningBudgetExpertsQuery.isLoading &&
                  (planningBudgetExpertsQuery.data ?? []).length === 0 ? (
                    <p className="text-xs text-destructive">
                      No active Planning & Budget Expert found. Assign the
                      planning-budget-experts role to at least one active user.
                    </p>
                  ) : null}
                  </div>
                </div>
              ) : null}

              {isRecordsStep ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      Lakk / Reference No
                    </label>
                    <Input
                      value={referenceNo}
                      onChange={(event) => setReferenceNo(event.target.value)}
                      placeholder="Enter reference number"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Guyyaa / Date</label>
                    <Input
                      type="date"
                      value={officialDate}
                      onChange={(event) => setOfficialDate(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {isFinanceStep ? (
                <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Approved Amount</p>
                      <p className="text-lg font-semibold">{money(data.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Balance Not Committed</p>
                      <p className="text-lg font-semibold">{money(data.budget?.remaining_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">BI / Account Code</p>
                      <p className="text-sm font-medium">{data.office_code || data.budget?.bi_code || "-"} / {data.budget_code || data.budget?.budget_code || "-"}</p>
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
                    <label className="text-sm font-medium">Finance Remark</label>
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
                        (item.action === "budget_tl_approve" && !selectedExpertId) ||
                        (item.action === "finance_complete" && (!paidAmount || !paidDate))
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
                            ...(item.action === "budget_tl_approve"
                              ? { expert_user_id: selectedExpertId }
                              : {}),
                            ...(item.action === "expert_complete"
                              ? {
                                  office_code: officeCode,
                                  budget_code: editableItems[0]?.budget_code ?? "",
                                  budget_year: budgetYear,
                                  items: editableItems,
                                }
                              : {}),
                            ...(item.action === "records_process"
                              ? {
                                  reference_no: referenceNo,
                                  official_date: officialDate,
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