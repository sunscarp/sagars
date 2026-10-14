"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { orderTaxBreakdown } from "@/utils/tax";
import { generateInvoice } from "@/utils/generateInvoice";

type Order = {
  id: string;
  createdAt: any;
  userEmail: string;
  status?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    pinCode?: string;
    stateCity?: string;
  };
  total: number;
  shippingCharge?: number;
  items: any[];
};

type RangeKey = "today" | "month" | "lastmonth" | "quarter" | "fyear" | "all";

const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "month", label: "This Month" },
  { key: "lastmonth", label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "fyear", label: "This Year" },
  { key: "all", label: "All Time" },
];

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(key: RangeKey): { from: string; to: string } {
  const now = new Date();
  switch (key) {
    case "today":
      return { from: toDateStr(now), to: toDateStr(now) };
    case "month":
      return {
        from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "lastmonth":
      return {
        from: toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toDateStr(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: toDateStr(new Date(now.getFullYear(), q * 3, 1)),
        to: toDateStr(new Date(now.getFullYear(), q * 3 + 3, 0)),
      };
    }
    case "fyear": {
      return {
        from: toDateStr(new Date(now.getFullYear(), 0, 1)),
        to: toDateStr(now),
      };
    }
    default:
      return { from: "", to: "" };
  }
}

const fmt = (n: number | undefined | null) =>
  (Number(n || 0)).toLocaleString("en-MY", { maximumFractionDigits: 2 });

const fmtDate = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
    : ts
      ? new Date(ts).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
      : "";

export default function FinancesTab({ orders }: { orders: Order[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activePreset, setActivePreset] = useState<RangeKey | null>(null);
  const [status, setStatus] = useState<string>("all");

  const applyPreset = (key: RangeKey) => {
    const r = presetRange(key);
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(key);
  };

  const filtered = useMemo(() => {
    const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toMs = to ? new Date(to + "T23:59:59.999").getTime() : null;
    return orders
      .filter((o) => {
        const ts = o.createdAt?.toDate ? o.createdAt.toDate().getTime() : o.createdAt ? new Date(o.createdAt).getTime() : null;
        if (ts === null) return false;
        if (fromMs !== null && ts < fromMs) return false;
        if (toMs !== null && ts > toMs) return false;
        return true;
      })
      .filter((o) => status === "all" || (o.status || "placed") === status)
      .sort((a, b) => {
        const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return at - bt;
      });
  }, [orders, from, to, status]);

  const summary = useMemo(() => {
    let invoiceCount = 0;
    let taxable = 0;
    let sst = 0;
    let shippingTax = 0;
    let shipping = 0;
    let revenue = 0;
    filtered.forEach((o) => {
      const b = orderTaxBreakdown(o);
      invoiceCount += 1;
      taxable += b.taxableValue;
      sst += b.sst;
      shippingTax += b.shippingSst;
      shipping += Number(o.shippingCharge ?? 0);
      revenue += Number(o.total ?? 0);
    });
    return {
      invoiceCount,
      taxable: Math.round(taxable * 100) / 100,
      sst: Math.round(sst * 100) / 100,
      shippingTax: Math.round(shippingTax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
    };
  }, [filtered]);

  const exportToExcel = () => {
    const rows = filtered.map((o, i) => {
      const b = orderTaxBreakdown(o);
      const c = o.customer || {};
      return {
        "#": i + 1,
        "Invoice No": `TSDH-INV-${o.id.slice(-8).toUpperCase()}`,
        "Order ID": o.id,
        Date: fmtDate(o.createdAt),
        Status: o.status || "placed",
        Customer: c.name || "",
        Email: c.email || o.userEmail || "",
        "State/City": c.stateCity || "",
        "Taxable Value": b.taxableValue,
        "SST": b.sst,
        "Shipping Taxable": b.shippingTaxable,
        "Shipping Tax": b.shippingSst,
        "Shipping": Number(o.shippingCharge ?? 0),
        "Total Tax": b.totalTax,
        "Grand Total": Number(o.total ?? 0),
      };
    });

    const summaryRows = [
      {
        "#": 0,
        "Invoice No": "SUMMARY",
        "Order ID": "",
        Date: `${from || "Start"} to ${to || "End"}`,
        Status: `${filtered.length} invoices`,
        Customer: "",
        Email: "",
        "State/City": "",
        "Taxable Value": summary.taxable,
        "SST": summary.sst,
        "Shipping Taxable": Math.round((summary.shipping - summary.shippingTax) * 100) / 100,
        "Shipping Tax": summary.shippingTax,
        "Shipping": summary.shipping,
        "Total Tax": Math.round((summary.sst + summary.shippingTax) * 100) / 100,
        "Grand Total": summary.revenue,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(summaryRows.concat(rows));
    ws["!cols"] = [
      { wch: 4 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 20 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 10 },
      { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Register");
    XLSX.writeFile(wb, `sagars-invoices-${from || "all"}-to-${to || "all"}.xlsx`);
  };

  const stats = [
    { label: "Invoices", value: String(summary.invoiceCount), color: "text-[#171813]" },
    { label: "Taxable Value", value: `RM ${fmt(summary.taxable)}`, color: "text-[#171813]" },
    { label: "SST (Goods)", value: `RM ${fmt(summary.sst)}`, color: "text-emerald-600" },
    { label: "Service Tax (Shipping)", value: `RM ${fmt(summary.shippingTax)}`, color: "text-emerald-600" },
    { label: "Shipping", value: `RM ${fmt(summary.shipping)}`, color: "text-[#595B53]" },
    { label: "Revenue", value: `RM ${fmt(summary.revenue)}`, color: "text-blue-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#171813]">Finances</h2>
          <p className="text-sm text-[#595B53] mt-0.5">
            Invoice register for tax filing. Prices are SST-inclusive (Sales Tax 10% on goods, Service Tax 8% on shipping).
          </p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={filtered.length === 0}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#171813] text-white hover:bg-[#171813] disabled:opacity-50 transition-colors"
        >
          Export to Excel
        </button>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-[#595B53] mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setActivePreset(null); }}
              className="border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#171813]/30 focus:border-[#171813]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#595B53] mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setActivePreset(null); }}
              className="border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#171813]/30 focus:border-[#171813]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#595B53] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="placed">Placed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activePreset === p.key
                  ? "bg-[#171813] text-white border-[#171813]"
                  : "bg-white text-[#595B53] border-[#E1DFDC] hover:bg-[#F1EEE7]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E1DFDC] p-5">
            <p className="text-xs font-medium text-[#595B53] uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Register table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E1DFDC]">
          <p className="text-[#595B53]">No invoices in the selected range.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E1DFDC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1EEE7] bg-[#F1EEE7]">
                  <th className="text-left py-3 px-4 font-medium text-[#595B53]">Invoice No</th>
                  <th className="text-left py-3 px-4 font-medium text-[#595B53]">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-[#595B53]">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-[#595B53]">State/City</th>
                  <th className="text-right py-3 px-4 font-medium text-[#595B53]">Taxable Value</th>
                  <th className="text-right py-3 px-4 font-medium text-[#595B53]">SST</th>
                  <th className="text-right py-3 px-4 font-medium text-[#595B53]">Shipping Tax</th>
                  <th className="text-right py-3 px-4 font-medium text-[#595B53]">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-[#595B53]">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const b = orderTaxBreakdown(o);
                  return (
                    <tr key={o.id} className="border-b border-[#F1EEE7] hover:bg-[#F1EEE7]/50">
                      <td className="py-3 px-4 font-mono text-xs">TSDH-INV-{o.id.slice(-8).toUpperCase()}</td>
                      <td className="py-3 px-4 text-[#595B53] whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="py-3 px-4">{o.customer?.name || o.userEmail}</td>
                      <td className="py-3 px-4 text-[#595B53]">{o.customer?.stateCity || ""}</td>
                      <td className="py-3 px-4 text-right font-medium">{fmt(b.taxableValue)}</td>
                      <td className="py-3 px-4 text-right">{fmt(b.sst)}</td>
                      <td className="py-3 px-4 text-right">{fmt(b.shippingSst)}</td>
                      <td className="py-3 px-4 text-right font-bold">RM {fmt(o.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => generateInvoice(o)}
                          className="text-xs text-[#171813] hover:underline font-medium"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
