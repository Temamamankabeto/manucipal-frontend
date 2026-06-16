export function formatNumber(value?: number | string | null) { return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 }); }
export function formatMoney(value?: number | string | null) { return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
