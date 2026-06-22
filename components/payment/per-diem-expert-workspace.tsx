"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Edit3, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePaymentAction } from "@/hooks/payment/use-payment";
import {
  useBudgetAccountCodes,
  useBudgetBiCodes,
  useBudgetFiscalYears,
} from "@/hooks/budget/use-budget";
import { authService } from "@/services/auth/auth.service";
import type { PaymentRequest } from "@/types/payment/payment.type";
import type { Budget } from "@/types/budget/budget.type";

type CommonForm = {
  program: string;
  purpose: string;
  pi_code: string;
  budget_code: string;
  office_name: string;
  departure_location: string;
  destination: string;
  departure_date: string;
  return_date: string;
  daily_per_diem_rate: number;
  transport_allowance: number;
  approved_budget: number;
};

type EmployeeDraft = {
  local_id: string;
  selected: boolean;
  employee_name: string;
  salary_level: string;
  salary_amount: number;
  transportation_type: string;
  departure_location: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  number_of_days: number;
  daily_rate: number;
  breakfast_deduction: number;
  lunch_deduction: number;
  dinner_deduction: number;
  accommodation_deduction: number;
  transport_cost: number;
  fuel_cost: number;
  other_cost: number;
  work_description: string;
};

const emptyEmployee = (common?: Partial<CommonForm>): EmployeeDraft => ({
  local_id: crypto.randomUUID(),
  selected: true,
  employee_name: "",
  salary_level: "",
  salary_amount: 0,
  transportation_type: "",
  departure_location: common?.departure_location ?? "",
  destination: common?.destination ?? "",
  departure_date: common?.departure_date ?? "",
  departure_time: "",
  return_date: common?.return_date ?? "",
  return_time: "",
  number_of_days: 0,
  daily_rate: Number(common?.daily_per_diem_rate ?? 0),
  breakfast_deduction: 0,
  lunch_deduction: 0,
  dinner_deduction: 0,
  accommodation_deduction: 0,
  transport_cost: 0,
  fuel_cost: 0,
  other_cost: 0,
  work_description: "",
});

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

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function budgetLabel(budget: Budget) {
  return `${budget.budget_code} - ${budget.account_name}`;
}

function budgetAmount(value: number | string | null | undefined) {
  return Number(value || 0);
}

function dateOnly(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function calculate(employee: EmployeeDraft) {
  const deductions =
    Number(employee.breakfast_deduction || 0) +
    Number(employee.lunch_deduction || 0) +
    Number(employee.dinner_deduction || 0) +
    Number(employee.accommodation_deduction || 0);
  const perDiem = Math.max(
    0,
    Number(employee.number_of_days || 0) * Number(employee.daily_rate || 0) -
      deductions,
  );
  const total =
    perDiem +
    Number(employee.transport_cost || 0) +
    Number(employee.fuel_cost || 0) +
    Number(employee.other_cost || 0);
  return { perDiem, total };
}

function normalisePerDiemFromPayment(payment: PaymentRequest) {
  const perDiem = payment.per_diem;

  return {
    common: {
      program: perDiem?.program ?? "",
      purpose: perDiem?.purpose ?? payment.description ?? "",
      pi_code: perDiem?.pi_code ?? "",
      budget_code: perDiem?.budget_code ?? payment.budget_code ?? "",
      office_name:
        perDiem?.office_name ??
        payment.requesting_entity ??
        "W/ra Mana Qopheesaa B/M/Adaamaa",
      departure_location: perDiem?.departure_location ?? "Adaamaa",
      destination: perDiem?.destination ?? "",
      departure_date: dateOnly(perDiem?.departure_date),
      return_date: dateOnly(perDiem?.return_date),
      daily_per_diem_rate: Number(perDiem?.daily_per_diem_rate ?? 0),
      transport_allowance: Number(perDiem?.transport_allowance ?? 0),
      approved_budget: Number(perDiem?.approved_budget ?? 0),
    },
    employees: (perDiem?.employees ?? []).map((employee: any) => ({
      local_id: String(employee.id ?? crypto.randomUUID()),
      selected: true,
      employee_name: employee.employee_name ?? "",
      salary_level: employee.salary_level ?? "",
      salary_amount: Number(employee.salary_amount ?? 0),
      transportation_type: employee.transportation_type ?? "",
      departure_location: employee.departure_location ?? "",
      destination: employee.destination ?? "",
      departure_date: dateOnly(employee.departure_date),
      departure_time: String(employee.departure_time ?? "").slice(0, 5),
      return_date: dateOnly(employee.return_date),
      return_time: String(employee.return_time ?? "").slice(0, 5),
      number_of_days: Number(employee.number_of_days ?? 0),
      daily_rate: Number(employee.daily_rate ?? 0),
      breakfast_deduction: Number(employee.breakfast_deduction ?? 0),
      lunch_deduction: Number(employee.lunch_deduction ?? 0),
      dinner_deduction: Number(employee.dinner_deduction ?? 0),
      accommodation_deduction: Number(employee.accommodation_deduction ?? 0),
      transport_cost: Number(employee.transport_cost ?? 0),
      fuel_cost: Number(employee.fuel_cost ?? 0),
      other_cost: Number(employee.other_cost ?? 0),
      work_description: employee.work_description ?? "",
    })) as EmployeeDraft[],
  };
}

function SignatureImage({
  signer,
  type = "signature",
}: {
  signer?: any;
  type?: "signature" | "titer" | "stamp";
}) {
  const src = signerUrl(signer, type);
  if (!src) return null;

  const className =
    type === "titer"
      ? "mx-auto h-14 max-w-52 -rotate-[14deg] object-contain opacity-95 print:h-11 print:max-w-44"
      : type === "stamp"
        ? "mx-auto h-28 w-28 object-contain opacity-95 print:h-24 print:w-24"
        : "mx-auto h-8 max-w-28 object-contain print:h-6";

  return <img src={src} alt={type} className={className} />;
}

function SignatureLine({ label, signer }: { label: string; signer?: any }) {
  return (
    <div className="flex items-end gap-2 text-[13px] leading-5 print:text-[11px] print:leading-4">
      <span>{label}</span>
      <span className="min-w-48 flex-1 border-b border-black px-2">
        <SignatureImage signer={signer} type="titer" />
      </span>
      <span>Mallattoo</span>
      <span className="min-w-32 flex-1 border-b border-black px-2">
        <SignatureImage signer={signer} />
      </span>
    </div>
  );
}

function normaliseRole(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function isRecordsOfficeUser() {
  const roles = authService.getStoredRoles?.() ?? [];
  const userRole = authService.getStoredUser?.()?.role;

  return [...roles, userRole]
    .map((role) => normaliseRole(role))
    .some((role) =>
      ["records-office", "record-office", "record-officer"].includes(role),
    );
}

function printedStorageKey(paymentId: string | number, employeeId: string) {
  return `per_diem_printed:${paymentId}:${employeeId}`;
}

function readPrintedAt(paymentId: string | number, employeeId: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(printedStorageKey(paymentId, employeeId)) || "";
}

function formatPrintedAt(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function RecordOfficePageHeader({
  signer,
  referenceNo,
  officialDate,
  showReference = false,
  showTiter = true,
}: {
  signer?: any;
  referenceNo?: string;
  officialDate?: string;
  showReference?: boolean;
  showTiter?: boolean;
}) {
  const titer = signerUrl(signer, "titer");

  return (
    <div className="relative mb-3 min-h-24 print:mb-2 print:min-h-20">
      {showTiter && titer ? (
        <img
          src={titer}
          alt="records office titer"
          className="pointer-events-none absolute left-6 top-1 z-20 h-28 max-w-[250px] -rotate-[14deg] object-contain opacity-95 print:left-3 print:top-0 print:h-24 print:max-w-[220px]"
        />
      ) : null}

      {showReference ? (
        <div className="absolute right-0 top-0 space-y-2 text-[15px] font-semibold print:text-[11px]">
          <div>
            Lakk{" "}
            <span className="inline-block min-w-36 border-b border-black px-2 font-normal">
              {referenceNo}
            </span>
          </div>
          <div>
            Guyyaa{" "}
            <span className="inline-block min-w-32 border-b border-black px-2 font-normal">
              {officialDate}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecordOfficeStampOverlay({ signer }: { signer?: any }) {
  const stamp = signerUrl(signer, "stamp");

  if (!stamp) return null;

  return (
    <img
      src={stamp}
      alt="records office stamp"
      className="pointer-events-none absolute left-1/2 bottom-1 h-28 w-28 -translate-x-1/2 object-contain opacity-95 print:h-24 print:w-24"
    />
  );
}

function PerDiemExactEmployeeForm({
  payment,
  common,
  employee,
  index,
}: {
  payment: PaymentRequest;
  common: CommonForm;
  employee: EmployeeDraft;
  index: number;
}) {
  const calc = calculate(employee);
  const recordsSigner = (payment as any).records_signer;
  const expertSigner = (payment as any).budget_expert_signer;
  const budgetTlSigner = (payment as any).budget_tl_final_signer;
  const managerSigner = (payment as any).manager_final_signer;
  const referenceNo = (payment as any).reference_no ?? payment.payment_no ?? "";
  const officialDate = dateOnly((payment as any).official_date);

  return (
    <div className="per-diem-print-page bg-white font-serif text-black">
      <section className="per-diem-a4-page relative mx-auto min-h-[1120px] w-[794px] bg-white p-8 text-[14px] leading-6 print:min-h-[277mm] print:w-[190mm] print:p-0 print:text-[11px] print:leading-4">
        <RecordOfficePageHeader
          signer={recordsSigner}
          referenceNo={referenceNo}
          officialDate={officialDate}
          showReference
        />

        <div className="pt-3 text-center text-[17px] font-bold print:pt-2 print:text-[13px]">
          Uunka 1: Durgoo Olmaa Guyyaa Hojjattoota Motummaa Itti gaafatamu fi
          Hayyamamu
        </div>

        <table className="mt-5 w-full border-collapse border border-black text-[13px] print:mt-3 print:text-[10px]">
          <thead>
            <tr>
              <th className="w-10 border border-black p-1">Lakk</th>
              <th className="border border-black p-1">
                Durgoo Oolmaa guyyaa itti hayyamamu fi gaafatamu
              </th>
              <th className="border border-black p-1">Gosa kaffaltii</th>
              <th className="border border-black p-1">Hanga kaffaltii</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "1",
                "Maqaa mana hojii:-",
                common.office_name || "W/ra Mana Qopheesaa",
                "Dursee kan kaffalame",
                "--",
              ],
              [
                "2",
                "Sagantaa / Adeemsa hojii:-",
                common.program,
                "Durgoo olmaaf qarshii",
                money(calc.perDiem),
              ],
              [
                "3",
                "Maqaa fi Koodii pi-",
                common.pi_code,
                "Durgoo gammoojjiif",
                money(employee.other_cost),
              ],
              [
                "4",
                "Kaayyoo / sababa bobba’insa dirree:-",
                common.purpose,
                "hojiif Dibataaf qarshii",
                "---",
              ],
              [
                "5",
                "Ka’umsa bobba’insa:-",
                employee.departure_location || common.departure_location,
                "Of-eeggannoof qarshii",
                "---",
              ],
              [
                "6",
                "Gahinsa bobba’insa:-",
                employee.destination || common.destination,
                "Baasii waliigalaa kaffalame",
                money(calc.total),
              ],
              [
                "7",
                "Guyyaa ka’umsaa:-",
                employee.departure_date || common.departure_date,
                "",
                "",
              ],
              [
                "8",
                "Baasii geejjibaa:-",
                money(employee.transport_cost),
                "",
                "",
              ],
              [
                "9",
                "Baay’ina guyyaa durgoo kaffalamu",
                String(employee.number_of_days || ""),
                "",
                "",
              ],
            ].map((row) => (
              <tr key={row[0]}>
                <td className="border border-black p-1 text-center">
                  {row[0]}
                </td>
                <td className="border border-black p-1">
                  <span className="font-medium">{row[1]}</span>{" "}
                  <span>{row[2]}</span>
                </td>
                <td className="border border-black p-1">{row[3]}</td>
                <td className="border border-black p-1 text-right">{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="relative mt-6 min-h-[150px] pb-24 print:min-h-[120px] print:pb-20">
          <div className="space-y-3">
            <SignatureLine
              label="Maqaa Hojjatichaa"
              signer={{ name: employee.employee_name }}
            />
            <SignatureLine
              label="Maqaa namaa karoorri hojii fi baajatni jiraachuu Mirkaneesse"
              signer={budgetTlSigner}
            />
            <SignatureLine
              label="Maqaa nama herregicha mirkaneesse"
              signer={expertSigner}
            />
            <SignatureLine
              label="Maqaa Itti gaafatamaa mana Hojii"
              signer={managerSigner}
            />
          </div>
          <RecordOfficeStampOverlay signer={recordsSigner} />
        </div>
      </section>

      <section className="per-diem-a4-page relative mx-auto mt-6 min-h-[1120px] w-[794px] bg-white p-8 text-[14px] leading-6 print:mt-0 print:min-h-[277mm] print:w-[190mm] print:break-before-page print:p-0 print:text-[11px] print:leading-4">
        <RecordOfficePageHeader signer={recordsSigner} showTiter={false} />

        <h2 className="text-center text-[18px] font-bold print:text-[14px]">
          Uunka 2:- Kaffaltii Durgoo Oolmaa Hojjattoota Mootummaa Itti Buufamu
        </h2>

        <div className="mt-4 space-y-1 text-[15px] print:text-[11px]">
          <p>
            1. Maqaa mana hojii{" "}
            <span className="inline-block min-w-72 border-b border-black px-1">
              {common.office_name || "W/ra Mana Qopheesaa B/M/Adaamaa"}
            </span>
          </p>
          <p>
            2. Sagantaa /Adeemsa /{" "}
            <span className="inline-block min-w-72 border-b border-black px-1">
              {common.program}
            </span>
          </p>
          <p>
            3. Maqaa Hojjataa{" "}
            <span className="inline-block min-w-72 border-b border-black px-1">
              {employee.employee_name}
            </span>
          </p>
          <p>
            4. <em>Hanga Mindaa</em>{" "}
            <span className="inline-block min-w-32 border-b border-black px-1">
              {money(employee.salary_amount)}
            </span>
          </p>
          <p>
            5. <em>Gosa Geejibaa</em>{" "}
            <span className="inline-block min-w-48 border-b border-black px-1">
              {employee.transportation_type}
            </span>
          </p>
          <p>6. Gabatee Haala Kaffalti Durgoo Oolmaa</p>
          <p>
            A. Durgoo Ciree , Laaqanaa fi Irbaata Iddoo Hojjatichi Hojiirra Ture
            Itti Ibsamu:
          </p>
        </div>

        <table className="mt-3 w-full border-collapse border border-black text-[11px] print:text-[8px]">
          <thead>
            <tr>
              <th className="border border-black p-1" rowSpan={2}>
                Lak
              </th>
              <th className="border border-black p-1" colSpan={3}>
                Ka’umsa
              </th>
              <th className="border border-black p-1" colSpan={5}>
                Iddoo gahee
              </th>
              <th className="border border-black p-1" colSpan={4}>
                Ogeessa Faayinaansii qofaan kan gutamu
              </th>
            </tr>
            <tr>
              <th className="border border-black p-1">Iddoo</th>
              <th className="border border-black p-1">Guyyaa</th>
              <th className="border border-black p-1">Sa’a</th>
              <th className="border border-black p-1">Guyyaa</th>
              <th className="border border-black p-1">Ciree</th>
              <th className="border border-black p-1">Laqana</th>
              <th className="border border-black p-1">Irbaata</th>
              <th className="border border-black p-1">Siree</th>
              <th className="border border-black p-1">Baay’i naguyyaa</th>
              <th className="border border-black p-1">Hanga durgoo oolma</th>
              <th className="border border-black p-1">Durgoo geejjibaa</th>
              <th className="border border-black p-1">Durgoo gammoojjii</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1 text-center">1</td>
              <td className="border border-black p-1">
                {employee.departure_location || common.departure_location}
              </td>
              <td className="border border-black p-1">
                {employee.departure_date || common.departure_date}
              </td>
              <td className="border border-black p-1">
                {employee.departure_time}
              </td>
              <td className="border border-black p-1">
                {employee.return_date || common.return_date}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.breakfast_deduction)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.lunch_deduction)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.dinner_deduction)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.accommodation_deduction)}
              </td>
              <td className="border border-black p-1 text-center">
                {employee.number_of_days}
              </td>
              <td className="border border-black p-1 text-right">
                {money(calc.perDiem)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.transport_cost)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.other_cost)}
              </td>
            </tr>
            {[1, 2, 3].map((blank) => (
              <tr key={blank}>
                {Array.from({ length: 13 }).map((_, i) => (
                  <td key={i} className="h-6 border border-black p-1" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-5">B. Gabatee ibsa Hojjataa Dirree Irra Turee</p>
        <table className="mt-2 w-full border-collapse border border-black text-[11px] print:text-[8px]">
          <thead>
            <tr>
              <th className="border border-black p-1">Lakk</th>
              <th className="border border-black p-1">Guyyaa</th>
              <th className="border border-black p-1">
                Iddoo hojiiif bulee / Naannoo/Godina/Aanaa/Magaala
              </th>
              <th className="border border-black p-1">Baay’ina</th>
              <th className="border border-black p-1">
                Hojilee ijoo hojjataman gabaabinaan
              </th>
              <th className="border border-black p-1">Durgoo olmaa</th>
              <th className="border border-black p-1">Durgoo Gammoojjii</th>
              <th className="border border-black p-1">Ida’ama</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1 text-center">1</td>
              <td className="border border-black p-1">
                {employee.departure_date || common.departure_date}
              </td>
              <td className="border border-black p-1">
                {employee.destination || common.destination}
              </td>
              <td className="border border-black p-1 text-center">
                {employee.number_of_days}
              </td>
              <td className="border border-black p-1">
                {employee.work_description}
              </td>
              <td className="border border-black p-1 text-right">
                {money(calc.perDiem)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(employee.other_cost)}
              </td>
              <td className="border border-black p-1 text-right">
                {money(calc.total)}
              </td>
            </tr>
            {[1, 2, 3].map((blank) => (
              <tr key={blank}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <td key={i} className="h-6 border border-black p-1" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-5">
          C. Gabatee waliigalaa Kaffaltii Durgoo Oolmaa fi Boba’aa Itti
          Cuunfamu:
        </p>
        <table className="mt-2 w-full border-collapse border border-black text-[12px] print:text-[9px]">
          <thead>
            <tr>
              <th className="border border-black p-1">Lakk</th>
              <th className="border border-black p-1">Gosa kaffaltii</th>
              <th className="border border-black p-1">
                Kaffaltii dura Raawwat e
              </th>
              <th className="border border-black p-1">
                Kaffaltii dabalataa /Boba’aa
              </th>
              <th className="border border-black p-1">Qarshii deebi’uu</th>
              <th className="border border-black p-1">Ida’ama/Garaagarummaa</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["1", "Durgoo oolmaa", "---", "---", "--", money(calc.perDiem)],
              [
                "2",
                "Gatii Boba’aa",
                "---",
                money(employee.fuel_cost),
                "--",
                money(employee.fuel_cost),
              ],
              ["3", "Kan Suphaa", "---", "---", "--", "--"],
              [
                "4",
                "Kan Biroo",
                "---",
                money(employee.other_cost + employee.transport_cost),
                "--",
                money(employee.other_cost + employee.transport_cost),
              ],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className="border border-black p-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border border-black p-1" />
              <td className="border border-black p-1 font-bold">
                Baasii Waliigalaa
              </td>
              <td className="border border-black p-1" />
              <td className="border border-black p-1" />
              <td className="border border-black p-1" />
              <td className="border border-black p-1 text-right font-bold">
                {money(calc.total)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="relative mt-6 min-h-[150px] pb-24 text-[13px] print:min-h-[120px] print:pb-20 print:text-[10px]">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <SignatureLine
              label="Maqaa hojjataa"
              signer={{ name: employee.employee_name }}
            />
            <SignatureLine
              label="Maqaa hojjataa Herrega qopheesse"
              signer={expertSigner}
            />
            <SignatureLine label="Hogganaa Mirkanessee" signer={managerSigner} />
            <SignatureLine
              label="Hogganaa Heerrega Mirkanessee"
              signer={budgetTlSigner}
            />
          </div>
          <RecordOfficeStampOverlay signer={recordsSigner} />
        </div>
      </section>
    </div>
  );
}

export function PerDiemExpertWorkspace({
  payment,
}: {
  payment: PaymentRequest;
}) {
  const initial = useMemo(
    () => normalisePerDiemFromPayment(payment),
    [payment],
  );
  const [tab, setTab] = useState<"uunka1" | "uunka2" | "draft">("uunka1");
  const [common, setCommon] = useState<CommonForm>(initial.common);
  const [employee, setEmployee] = useState<EmployeeDraft>(
    emptyEmployee(initial.common),
  );
  const [drafts, setDrafts] = useState<EmployeeDraft[]>(initial.employees);
  const [editingId, setEditingId] = useState<string | null>(null);
  const actionMutation = usePaymentAction(() =>
    toast.success("Per diem form completed"),
  );

  const [budgetYear, setBudgetYear] = useState(payment.budget_year ?? "");
  const [biCode, setBiCode] = useState(payment.office_code ?? "");
  const [budgetId, setBudgetId] = useState<string>(
    payment.budget_id ? String(payment.budget_id) : "",
  );

  const fiscalYearsQuery = useBudgetFiscalYears();
  const biCodesQuery = useBudgetBiCodes(
    { fiscal_year: budgetYear },
    Boolean(budgetYear),
  );
  const accountCodesQuery = useBudgetAccountCodes(
    {
      fiscal_year: budgetYear,
      bi_code: biCode,
      payment_type_id: payment.payment_type_id ?? undefined,
    },
    Boolean(budgetYear && biCode),
  );

  const accountCodes = accountCodesQuery.data ?? [];
  const selectedBudget = (
    accountCodes.find((budget) => String(budget.id) === String(budgetId)) ??
    (payment.budget as Budget | undefined) ??
    null
  ) as Budget | null;

  const selectedDrafts = drafts.filter((draft) => draft.selected);
  const total = selectedDrafts.reduce(
    (sum, draft) => sum + calculate(draft).total,
    0,
  );
  const employeeCalc = calculate(employee);
  const selectedBudgetBalance = budgetAmount(selectedBudget?.remaining_amount);
  const selectedBudgetDebit = budgetAmount(selectedBudget?.used_amount);
  const selectedBudgetAdjusted = budgetAmount(selectedBudget?.allocated_amount);

  function handleFiscalYearChange(value: string) {
    setBudgetYear(value);
    setBiCode("");
    setBudgetId("");
    setCommon((current) => ({ ...current, budget_code: "", pi_code: "" }));
  }

  function handleBiCodeChange(value: string) {
    setBiCode(value);
    setBudgetId("");
    setCommon((current) => ({ ...current, office_name: value, pi_code: value, budget_code: "" }));
  }

  function handleBudgetChange(value: string) {
    setBudgetId(value);
    const budget = accountCodes.find((item) => String(item.id) === String(value));

    if (budget) {
      setCommon((current) => ({
        ...current,
        budget_code: budget.budget_code,
        approved_budget: budgetAmount(budget.remaining_amount),
      }));
    }
  }

  function requireBudgetSelection() {
    if (!budgetYear) {
      toast.error("Please select Budget Year / Fiscal Year");
      return false;
    }

    if (!biCode) {
      toast.error("Please select BI Code / Office Code");
      return false;
    }

    if (!budgetId || !selectedBudget) {
      toast.error("Please select Budget Code / Account Code");
      return false;
    }

    return true;
  }

  function updateCommon(key: keyof CommonForm, value: string) {
    setCommon((current) => ({
      ...current,
      [key]: [
        "daily_per_diem_rate",
        "transport_allowance",
        "approved_budget",
      ].includes(key)
        ? Number(value || 0)
        : value,
    }));
  }

  function updateEmployee(key: keyof EmployeeDraft, value: string | boolean) {
    setEmployee((current) => ({
      ...current,
      [key]:
        typeof value === "boolean"
          ? value
          : [
                "salary_amount",
                "number_of_days",
                "daily_rate",
                "breakfast_deduction",
                "lunch_deduction",
                "dinner_deduction",
                "accommodation_deduction",
                "transport_cost",
                "fuel_cost",
                "other_cost",
              ].includes(key)
            ? Number(value || 0)
            : value,
    }));
  }

  function addToDraft() {
    if (!employee.employee_name.trim()) {
      toast.error("Maqaa hojjetaa galchi");
      return;
    }

    if (!requireBudgetSelection()) {
      return;
    }

    if (employeeCalc.total > selectedBudgetBalance) {
      toast.error("Insufficient budget balance for the selected BI Code and Account Code");
      return;
    }

    const completedEmployee = {
      ...employee,
      daily_rate: Number(
        employee.daily_rate || common.daily_per_diem_rate || 0,
      ),
      departure_location:
        employee.departure_location || common.departure_location,
      destination: employee.destination || common.destination,
      departure_date: employee.departure_date || common.departure_date,
      return_date: employee.return_date || common.return_date,
      transport_cost: Number(
        employee.transport_cost || common.transport_allowance || 0,
      ),
    };

    if (editingId) {
      setDrafts((current) =>
        current.map((draft) =>
          draft.local_id === editingId
            ? { ...completedEmployee, local_id: editingId }
            : draft,
        ),
      );
      setEditingId(null);
    } else {
      setDrafts((current) => [
        ...current,
        { ...completedEmployee, local_id: crypto.randomUUID(), selected: true },
      ]);
    }

    setEmployee(emptyEmployee(common));
    setTab("draft");
  }

  function editDraft(draft: EmployeeDraft) {
    setEmployee(draft);
    setEditingId(draft.local_id);
    setTab("uunka1");
  }

  function completePerDiem() {
    if (selectedDrafts.length === 0) {
      toast.error("Please select at least one drafted employee per diem form");
      return;
    }

    if (!requireBudgetSelection()) {
      return;
    }

    if (total > selectedBudgetBalance) {
      toast.error("Insufficient budget balance for the selected BI Code and Account Code");
      return;
    }

    actionMutation.mutate({
      id: payment.id,
      payload: {
        action: "expert_complete",
        note: `Completed per diem forms for ${selectedDrafts.length} employee(s)`,
        budget_id: budgetId,
        office_code: biCode,
        budget_code: selectedBudget?.budget_code ?? common.budget_code,
        budget_year: budgetYear,
        per_diem: {
          common: {
            ...common,
            office_name: biCode || common.office_name,
            pi_code: biCode || common.pi_code,
            budget_code: selectedBudget?.budget_code ?? common.budget_code,
            approved_budget: selectedBudgetBalance,
          },
          employees: selectedDrafts.map((draft) => ({
            ...draft,
            is_selected: draft.selected,
          })),
        },
      },
    });
  }

  const tableInputClass =
    "h-8 border-0 bg-transparent px-1 text-[15px] shadow-none focus-visible:ring-1 print:h-6 print:text-[11px]";
  const tableNumberInputClass = `${tableInputClass} text-right`;

  return (
    <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Per Diem Government Form</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill Uunka 1 and Uunka 2 exactly as the official per diem form,
              then add each employee to draft.
            </p>
          </div>
          <Badge variant="outline">
            {drafts.length} draft employee form(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-950">
            Planning & Budget Expert Budget Allocation
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Budget Year / Fiscal Year</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={budgetYear}
                onChange={(event) => handleFiscalYearChange(event.target.value)}
              >
                <option value="">Select Fiscal Year</option>
                {(fiscalYearsQuery.data ?? []).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                {budgetYear && !(fiscalYearsQuery.data ?? []).includes(budgetYear) ? (
                  <option value={budgetYear}>{budgetYear}</option>
                ) : null}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">BI Code / Office Code</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={biCode}
                onChange={(event) => handleBiCodeChange(event.target.value)}
                disabled={!budgetYear || biCodesQuery.isLoading}
              >
                <option value="">
                  {biCodesQuery.isLoading ? "Loading BI Codes..." : "Select BI Code"}
                </option>
                {(biCodesQuery.data ?? []).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
                {biCode && !(biCodesQuery.data ?? []).includes(biCode) ? (
                  <option value={biCode}>{biCode}</option>
                ) : null}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Budget Code / Account Code</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={budgetId}
                onChange={(event) => handleBudgetChange(event.target.value)}
                disabled={!biCode || accountCodesQuery.isLoading}
              >
                <option value="">
                  {accountCodesQuery.isLoading ? "Loading Account Codes..." : "Select Account Code"}
                </option>
                {accountCodes.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budgetLabel(budget)}
                  </option>
                ))}
                {selectedBudget && !accountCodes.some((budget) => String(budget.id) === String(selectedBudget.id)) ? (
                  <option value={selectedBudget.id}>{budgetLabel(selectedBudget)}</option>
                ) : null}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-white/80 p-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Adjusted Budget</p>
              <p className="font-semibold">{money(selectedBudgetAdjusted)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Debit</p>
              <p className="font-semibold">{money(selectedBudgetDebit)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance Not Committed</p>
              <p className="font-semibold">{money(selectedBudgetBalance)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Per Diem Total</p>
              <p className="font-semibold">{money(total + employeeCalc.total)}</p>
            </div>
          </div>

          {selectedBudget && selectedBudgetBalance < 5000 ? (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Budget recharge required. Balance Not Committed is less than 5,000 Birr.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-2">
          {[
            ["uunka1", "1. Uunka 1"],
            ["uunka2", "2. Uunka 2"],
            ["draft", "3. Draft & complete"],
          ].map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={tab === value ? "default" : "outline"}
              onClick={() => setTab(value as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {tab === "uunka1" ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border bg-white p-4">
              <div className="mb-4 text-center font-serif text-xl font-bold text-black">
                Uunka 1: Durgoo Olmaa Guyyaa Hojjattoota Motummaa Itti gaafatamu
                fi Hayyamamu
              </div>
              <table className="w-full min-w-[900px] border-collapse border border-black font-serif text-[16px] text-black">
                <thead>
                  <tr>
                    <th className="w-14 border border-black px-2 py-1 text-left font-normal">
                      Lakk
                    </th>
                    <th className="w-[48%] border border-black px-2 py-1 text-left font-normal">
                      DurgooOolmaaguyyaaittihayyamamu&nbsp; fi
                      <br />
                      gaafatamu
                    </th>
                    <th className="w-[28%] border border-black px-2 py-1 text-left font-normal">
                      Gosaakaffaltii
                    </th>
                    <th className="w-[16%] border border-black px-2 py-1 text-left font-normal">
                      Hangakaffaltii
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1">1</td>
                    <td className="border border-black px-2 py-1">
                      Maqaamanahojii:-{" "}
                      <Input
                        className={tableInputClass}
                        value={common.office_name}
                        onChange={(e) =>
                          updateCommon("office_name", e.target.value)
                        }
                      />
                    </td>
                    <td className="border border-black px-2 py-1">
                      Durseekankaffalame
                    </td>
                    <td className="border border-black px-2 py-1">--</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">2</td>
                    <td className="border border-black px-2 py-1">
                      Sagantaa /Adeemsahojii:-{" "}
                      <Input
                        className={tableInputClass}
                        value={common.program}
                        onChange={(e) =>
                          updateCommon("program", e.target.value)
                        }
                      />
                    </td>
                    <td className="border border-black px-2 py-1">
                      Durgoo olmaafqarshii
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {money(employeeCalc.perDiem)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">3</td>
                    <td className="border border-black px-2 py-1">
                      Maqaa fi Koodii&nbsp; pi-{" "}
                      <Input
                        className={tableInputClass}
                        value={common.pi_code}
                        onChange={(e) =>
                          updateCommon("pi_code", e.target.value)
                        }
                      />
                    </td>
                    <td className="border border-black px-2 py-1">
                      Durgoogammoojjiif
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {money(employee.other_cost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">4</td>
                    <td className="border border-black px-2 py-1">
                      Kaayyoo /sabababobba’insadirre:-{" "}
                      <Input
                        className={tableInputClass}
                        value={common.purpose}
                        onChange={(e) =>
                          updateCommon("purpose", e.target.value)
                        }
                      />
                    </td>
                    <td className="border border-black px-2 py-1">
                      hojiif Dibataafqarshii
                    </td>
                    <td className="border border-black px-2 py-1">---</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">5</td>
                    <td className="border border-black px-2 py-1">
                      Ka’umsa bobba’insa:-{" "}
                      <Input
                        className={tableInputClass}
                        value={
                          employee.departure_location ||
                          common.departure_location
                        }
                        onChange={(e) => {
                          updateEmployee("departure_location", e.target.value);
                          updateCommon("departure_location", e.target.value);
                        }}
                      />
                    </td>
                    <td className="border border-black px-2 py-1">
                      Of-eeggannoofqarshii
                    </td>
                    <td className="border border-black px-2 py-1">---</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">6</td>
                    <td className="border border-black px-2 py-1">
                      Gahinsa bobba’insa:-{" "}
                      <Input
                        className={tableInputClass}
                        value={employee.destination || common.destination}
                        onChange={(e) => {
                          updateEmployee("destination", e.target.value);
                          updateCommon("destination", e.target.value);
                        }}
                      />
                    </td>
                    <td className="border border-black px-2 py-1">
                      Baasiiwaliigalaafkaffalame
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {money(employeeCalc.total)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">7</td>
                    <td className="border border-black px-2 py-1">
                      Guyyaa ka’umsaa:-{" "}
                      <Input
                        type="date"
                        className={tableInputClass}
                        value={employee.departure_date || common.departure_date}
                        onChange={(e) => {
                          updateEmployee("departure_date", e.target.value);
                          updateCommon("departure_date", e.target.value);
                        }}
                      />
                    </td>
                    <td className="border border-black px-2 py-1" />
                    <td className="border border-black px-2 py-1" />
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">8</td>
                    <td className="border border-black px-2 py-1">
                      Baasii geejjibaa:-{" "}
                      <Input
                        type="number"
                        className={tableNumberInputClass}
                        value={
                          employee.transport_cost || common.transport_allowance
                        }
                        onChange={(e) => {
                          updateEmployee("transport_cost", e.target.value);
                          updateCommon("transport_allowance", e.target.value);
                        }}
                      />
                    </td>
                    <td className="border border-black px-2 py-1" />
                    <td className="border border-black px-2 py-1" />
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">9</td>
                    <td className="border border-black px-2 py-1">
                      Baay’inaguyyadurgoo kaffalamu&nbsp;{" "}
                      <Input
                        type="number"
                        className={tableNumberInputClass}
                        value={employee.number_of_days}
                        onChange={(e) =>
                          updateEmployee("number_of_days", e.target.value)
                        }
                      />
                    </td>
                    <td className="border border-black px-2 py-1" />
                    <td className="border border-black px-2 py-1" />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Maqaa Hojjatichaa</label>
                <Input
                  value={employee.employee_name}
                  onChange={(e) =>
                    updateEmployee("employee_name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Durgoo Guyyaa Tokkoo
                </label>
                <Input
                  type="number"
                  value={employee.daily_rate || common.daily_per_diem_rate}
                  onChange={(e) => {
                    updateEmployee("daily_rate", e.target.value);
                    updateCommon("daily_per_diem_rate", e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Guyyaa Deebi'umsaa
                </label>
                <Input
                  type="date"
                  value={employee.return_date || common.return_date}
                  onChange={(e) => {
                    updateEmployee("return_date", e.target.value);
                    updateCommon("return_date", e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setTab("uunka2")}>
                Continue to Uunka 2
              </Button>
            </div>
          </div>
        ) : null}

        {tab === "uunka2" ? (
          <div className="space-y-5">
            <div className="rounded-xl border bg-white p-4 font-serif text-black">
              <h2 className="mb-4 text-center text-xl font-bold">
                Uunka 2:- Kaffaltii Durgoo Oolmaa Hojjattoota Mootummaa Itti
                Buufamu
              </h2>
              <div className="mb-4 space-y-2 text-[16px]">
                <p>
                  1. Maqaamanahojii{" "}
                  <Input
                    className="inline-flex h-8 w-80 border-0 border-b border-black bg-transparent shadow-none"
                    value={common.office_name}
                    onChange={(e) =>
                      updateCommon("office_name", e.target.value)
                    }
                  />
                </p>
                <p>
                  2. Sagantaa /Adeemsa /{" "}
                  <Input
                    className="inline-flex h-8 w-80 border-0 border-b border-black bg-transparent shadow-none"
                    value={common.program}
                    onChange={(e) => updateCommon("program", e.target.value)}
                  />
                </p>
                <p>
                  3. Maqaa Hojjataa{" "}
                  <Input
                    className="inline-flex h-8 w-80 border-0 border-b border-black bg-transparent shadow-none"
                    value={employee.employee_name}
                    onChange={(e) =>
                      updateEmployee("employee_name", e.target.value)
                    }
                  />
                </p>
                <p>
                  4. <em>HangaMindaa</em>{" "}
                  <Input
                    type="number"
                    className="inline-flex h-8 w-40 border-0 border-b border-black bg-transparent shadow-none"
                    value={employee.salary_amount}
                    onChange={(e) =>
                      updateEmployee("salary_amount", e.target.value)
                    }
                  />
                </p>
                <p>
                  5. <em>GosaGeejibaa</em>
                  <Input
                    className="inline-flex h-8 w-56 border-0 border-b border-black bg-transparent shadow-none"
                    value={employee.transportation_type}
                    onChange={(e) =>
                      updateEmployee("transportation_type", e.target.value)
                    }
                  />
                </p>
                <p>6. GabateeHaalaKaffalti DurgooOolmaa</p>
                <p>
                  A. DurgooCiree , Laaqanaa fi
                  IrbaataIddooHojjatichiHojiirraTureIttiIbsamu:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse border border-black text-[14px]">
                  <thead>
                    <tr>
                      <th className="border border-black p-1" rowSpan={2}>
                        Lak
                      </th>
                      <th className="border border-black p-1" colSpan={3}>
                        Ka’umsa
                      </th>
                      <th className="border border-black p-1" colSpan={5}>
                        Iddoogahee
                      </th>
                      <th className="border border-black p-1" colSpan={4}>
                        OgeessaFaayinaansii qofaan kangutamu
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-black p-1">Iddoo</th>
                      <th className="border border-black p-1">Guyyaa</th>
                      <th className="border border-black p-1">Sa’a</th>
                      <th className="border border-black p-1">Guyyaa</th>
                      <th className="border border-black p-1">Ciree</th>
                      <th className="border border-black p-1">Laqana</th>
                      <th className="border border-black p-1">Irbaata</th>
                      <th className="border border-black p-1">Siree</th>
                      <th className="border border-black p-1">
                        Baay’i naguyyaa
                      </th>
                      <th className="border border-black p-1">
                        Hanga durgoo oolma
                      </th>
                      <th className="border border-black p-1">
                        Durgoo geejjibaa
                      </th>
                      <th className="border border-black p-1">
                        Durgoo gammoojjii
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 text-center">1</td>
                      <td className="border border-black p-1">
                        <Input
                          className={tableInputClass}
                          value={
                            employee.departure_location ||
                            common.departure_location
                          }
                          onChange={(e) =>
                            updateEmployee("departure_location", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="date"
                          className={tableInputClass}
                          value={
                            employee.departure_date || common.departure_date
                          }
                          onChange={(e) =>
                            updateEmployee("departure_date", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="time"
                          className={tableInputClass}
                          value={employee.departure_time}
                          onChange={(e) =>
                            updateEmployee("departure_time", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="date"
                          className={tableInputClass}
                          value={employee.return_date || common.return_date}
                          onChange={(e) =>
                            updateEmployee("return_date", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.breakfast_deduction}
                          onChange={(e) =>
                            updateEmployee(
                              "breakfast_deduction",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.lunch_deduction}
                          onChange={(e) =>
                            updateEmployee("lunch_deduction", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.dinner_deduction}
                          onChange={(e) =>
                            updateEmployee("dinner_deduction", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.accommodation_deduction}
                          onChange={(e) =>
                            updateEmployee(
                              "accommodation_deduction",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.number_of_days}
                          onChange={(e) =>
                            updateEmployee("number_of_days", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-right">
                        {money(employeeCalc.perDiem)}
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.transport_cost}
                          onChange={(e) =>
                            updateEmployee("transport_cost", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.other_cost}
                          onChange={(e) =>
                            updateEmployee("other_cost", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                    {[1, 2, 3].map((blank) => (
                      <tr key={blank}>
                        {Array.from({ length: 13 }).map((_, i) => (
                          <td key={i} className="h-8 border border-black p-1" />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-5 text-[16px]">
                B. GabateeibsaHojjataaDirreeIrraTuree
              </p>
              <div className="overflow-x-auto">
                <table className="mt-2 w-full min-w-[900px] border-collapse border border-black text-[14px]">
                  <thead>
                    <tr>
                      <th className="border border-black p-1">Lakk</th>
                      <th className="border border-black p-1">Guyyaa</th>
                      <th className="border border-black p-1">
                        Iddoohojiifbulee / Naannoo/Godina/Aanaa/Magaala
                      </th>
                      <th className="border border-black p-1">Baay’ina</th>
                      <th className="border border-black p-1">
                        Hojileeijoohojjatamangabaabinaan
                      </th>
                      <th className="border border-black p-1">Durgoooolmaa</th>
                      <th className="border border-black p-1">
                        DurgooGammoojjii
                      </th>
                      <th className="border border-black p-1">Ida’ama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 text-center">1</td>
                      <td className="border border-black p-1">
                        <Input
                          type="date"
                          className={tableInputClass}
                          value={
                            employee.departure_date || common.departure_date
                          }
                          onChange={(e) =>
                            updateEmployee("departure_date", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          className={tableInputClass}
                          value={employee.destination || common.destination}
                          onChange={(e) =>
                            updateEmployee("destination", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.number_of_days}
                          onChange={(e) =>
                            updateEmployee("number_of_days", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">
                        <Input
                          className={tableInputClass}
                          value={employee.work_description}
                          onChange={(e) =>
                            updateEmployee("work_description", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-right">
                        {money(employeeCalc.perDiem)}
                      </td>
                      <td className="border border-black p-1 text-right">
                        {money(employee.other_cost)}
                      </td>
                      <td className="border border-black p-1 text-right">
                        {money(employeeCalc.total)}
                      </td>
                    </tr>
                    {[1, 2, 3].map((blank) => (
                      <tr key={blank}>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <td key={i} className="h-8 border border-black p-1" />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-5 text-[16px]">
                C. GabateewaliigalaaKaffaltiiDurgooOolmaa fi
                Boba’aaIttiCuunfamu:
              </p>
              <div className="overflow-x-auto">
                <table className="mt-2 w-full min-w-[850px] border-collapse border border-black text-[14px]">
                  <thead>
                    <tr>
                      <th className="border border-black p-1">Lakk</th>
                      <th className="border border-black p-1">Gosakaffaltii</th>
                      <th className="border border-black p-1">
                        KaffaltiiduraRaawwat e
                      </th>
                      <th className="border border-black p-1">
                        Kaffaltiidabalataa /Boba’aa
                      </th>
                      <th className="border border-black p-1">
                        Qarshiideebi’uu
                      </th>
                      <th className="border border-black p-1">
                        Ida’ama/Garaagarummaa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1">1</td>
                      <td className="border border-black p-1">Durgoooolmaa</td>
                      <td className="border border-black p-1">---</td>
                      <td className="border border-black p-1">---</td>
                      <td className="border border-black p-1">--</td>
                      <td className="border border-black p-1 text-right">
                        {money(employeeCalc.perDiem)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1">2</td>
                      <td className="border border-black p-1">GatiiBoba’aa</td>
                      <td className="border border-black p-1">---</td>
                      <td className="border border-black p-1">
                        <Input
                          type="number"
                          className={tableNumberInputClass}
                          value={employee.fuel_cost}
                          onChange={(e) =>
                            updateEmployee("fuel_cost", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-black p-1">--</td>
                      <td className="border border-black p-1 text-right">
                        {money(employee.fuel_cost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1">3</td>
                      <td className="border border-black p-1">KanSuphaa</td>
                      <td className="border border-black p-1">---</td>
                      <td className="border border-black p-1">---</td>
                      <td className="border border-black p-1">--</td>
                      <td className="border border-black p-1">--</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1">4</td>
                      <td className="border border-black p-1">KanBiroo</td>
                      <td className="border border-black p-1">---</td>
                      <td className="border border-black p-1 text-right">
                        {money(
                          Number(employee.other_cost || 0) +
                            Number(employee.transport_cost || 0),
                        )}
                      </td>
                      <td className="border border-black p-1">--</td>
                      <td className="border border-black p-1 text-right">
                        {money(
                          Number(employee.other_cost || 0) +
                            Number(employee.transport_cost || 0),
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1" />
                      <td className="border border-black p-1 font-bold">
                        BaasiiWaligalaa
                      </td>
                      <td className="border border-black p-1" />
                      <td className="border border-black p-1" />
                      <td className="border border-black p-1" />
                      <td className="border border-black p-1 text-right font-bold">
                        {money(employeeCalc.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              <p>
                Durgoo Oolmaa: <strong>{money(employeeCalc.perDiem)}</strong>
              </p>
              <p>
                Baasii Waliigalaa: <strong>{money(employeeCalc.total)}</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={addToDraft}>
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? "Update Draft" : "Add To Draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmployee(emptyEmployee(common));
                  setEditingId(null);
                  setTab("uunka1");
                }}
              >
                Clear Form
              </Button>
            </div>
          </div>
        ) : null}

        {tab === "draft" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDrafts((current) =>
                      current.map((item) => ({ ...item, selected: true })),
                    )
                  }
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDrafts((current) =>
                      current.map((item) => ({ ...item, selected: false })),
                    )
                  }
                >
                  Clear Selection
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Selected total: <strong>{money(total)}</strong>
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Select</th>
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-left">Days</th>
                    <th className="p-2 text-left">Durgoo</th>
                    <th className="p-2 text-left">Geejjiba</th>
                    <th className="p-2 text-left">Boba'aa</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr key={draft.local_id} className="border-t">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={draft.selected}
                          onChange={(e) =>
                            setDrafts((current) =>
                              current.map((item) =>
                                item.local_id === draft.local_id
                                  ? { ...item, selected: e.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-2 font-medium">{draft.employee_name}</td>
                      <td className="p-2">{draft.number_of_days}</td>
                      <td className="p-2">{money(calculate(draft).perDiem)}</td>
                      <td className="p-2">{money(draft.transport_cost)}</td>
                      <td className="p-2">{money(draft.fuel_cost)}</td>
                      <td className="p-2 font-semibold">
                        {money(calculate(draft).total)}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => editDraft(draft)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDrafts((current) =>
                              current.filter(
                                (item) => item.local_id !== draft.local_id,
                              ),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {drafts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-6 text-center text-muted-foreground"
                      >
                        No drafted employee per diem form yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              disabled={actionMutation.isPending || selectedDrafts.length === 0}
              onClick={completePerDiem}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Per Diem Form & Approve
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PerDiemPrintableEmployees({
  payment,
}: {
  payment: PaymentRequest;
}) {
  const initial = useMemo(
    () => normalisePerDiemFromPayment(payment),
    [payment],
  );
  const employees = initial.employees;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [printedState, setPrintedState] = useState<Record<string, string>>({});
  const canPrint = isRecordsOfficeUser();

  const selectedEmployee =
    employees.find((employee) => employee.local_id === selectedEmployeeId) ?? null;

  function printedAt(employee: EmployeeDraft) {
    return printedState[employee.local_id] || readPrintedAt(payment.id, employee.local_id);
  }

  function printEmployee(employee: EmployeeDraft) {
    if (!canPrint) return;

    const alreadyPrintedAt = printedAt(employee);
    if (alreadyPrintedAt) return;

    document.body.classList.add("per-diem-printing");
    setTimeout(() => {
      window.print();
      const value = new Date().toISOString();
      window.localStorage.setItem(printedStorageKey(payment.id, employee.local_id), value);
      setPrintedState((current) => ({ ...current, [employee.local_id]: value }));
      setTimeout(() => {
        document.body.classList.remove("per-diem-printing");
      }, 200);
    }, 50);
  }

  if (employees.length === 0) {
    return (
      <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
        <CardHeader>
          <CardTitle>Official Per Diem Employee Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No Per Diem employee form has been completed yet. Use the Per Diem Employee Forms section below to fill Uunka 1 and Uunka 2, then add employees to the draft.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media screen {
          #per-diem-print-area {
            position: absolute !important;
            left: -99999px !important;
            top: 0 !important;
            width: 190mm !important;
          }
        }

        @media print {
          body.per-diem-printing * {
            visibility: hidden !important;
          }

          body.per-diem-printing #payment-print-area,
          body.per-diem-printing #payment-print-area * {
            visibility: hidden !important;
          }

          body.per-diem-printing #per-diem-print-area,
          body.per-diem-printing #per-diem-print-area * {
            visibility: visible !important;
          }

          body.per-diem-printing #per-diem-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            background: white !important;
          }
        }
      `}</style>

      <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Per Diem Employees</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                All completed per diem employees are listed below. Open View to see and print the official Uunka 1 and Uunka 2 form for one employee.
              </p>
            </div>
            <Badge variant="outline">{employees.length} employee(s)</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Maqaa Hojjataa</th>
                  <th className="p-2 text-left">Ka'umsa</th>
                  <th className="p-2 text-left">Gahinsa</th>
                  <th className="p-2 text-left">Guyyaa</th>
                  <th className="p-2 text-right">Durgoo</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-left">Print Status</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => {
                  const calc = calculate(employee);
                  const printed = printedAt(employee);

                  return (
                    <tr key={employee.local_id ?? index} className="border-t">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 font-medium">
                        {employee.employee_name || `Employee ${index + 1}`}
                      </td>
                      <td className="p-2">{employee.departure_location || initial.common.departure_location || "-"}</td>
                      <td className="p-2">{employee.destination || initial.common.destination || "-"}</td>
                      <td className="p-2">{employee.number_of_days || "-"}</td>
                      <td className="p-2 text-right">{money(calc.perDiem)}</td>
                      <td className="p-2 text-right font-semibold">{money(calc.total)}</td>
                      <td className="p-2">
                        {printed ? (
                          <Badge variant="outline">Printed</Badge>
                        ) : (
                          <Badge variant="secondary">Not Printed</Badge>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEmployeeId(employee.local_id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee ? (
        <Card className="rounded-2xl border bg-card shadow-sm print:hidden">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>
                  {selectedEmployee.employee_name || "Employee Per Diem Form"}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Official Uunka 1 and Uunka 2 form for this employee.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedEmployeeId(null)}
                >
                  Back to list
                </Button>
                {canPrint ? (
                  printedAt(selectedEmployee) ? (
                    <Badge variant="outline" className="px-3 py-2">
                      This employee per diem was printed on {formatPrintedAt(printedAt(selectedEmployee))}.
                    </Badge>
                  ) : (
                    <Button type="button" onClick={() => printEmployee(selectedEmployee)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print This Employee
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PerDiemExactEmployeeForm
              payment={payment}
              common={initial.common}
              employee={selectedEmployee}
              index={employees.findIndex((item) => item.local_id === selectedEmployee.local_id)}
            />
          </CardContent>
        </Card>
      ) : null}

      {selectedEmployee ? (
        <div id="per-diem-print-area" className="space-y-6">
          <PerDiemExactEmployeeForm
            payment={payment}
            common={initial.common}
            employee={selectedEmployee}
            index={employees.findIndex((item) => item.local_id === selectedEmployee.local_id)}
          />
        </div>
      ) : null}
    </>
  );
}
