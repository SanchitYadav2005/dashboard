import React from "react";
import { X } from "lucide-react";
import { formatCurrency } from "../utils/analytics";
import { StatusBadge } from "./DataTable";

export default function DetailModal({ record, type, related = [], onClose, onRelated }) {
  if (!record) return null;

  const currencyFields = ["value", "amount"];

  const labelize = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
              {type} details
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {record.id} · {record.client || record.name || "Record"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {Object.entries(record).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{labelize(key)}</p>
              <div className="mt-1 break-words text-sm font-medium text-slate-800">
                {key.toLowerCase() === "status" ||
                key.toLowerCase() === "paymentstatus" ? (
                  <StatusBadge status={value} />
                ) : currencyFields.includes(key) ? (
                  formatCurrency(Number(value))
                ) : (
                  String(value ?? "—")
                )}
              </div>
            </div>
          ))}
        </div>

        {related.length > 0 && (
          <div className="border-t border-slate-200 p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Related records</h3>
            <div className="space-y-2">
              {related.map((item) => (
                <button
                  key={`${item.type}-${item.record.id}`}
                  onClick={() => onRelated(item.type, item.record)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span>
                    <span className="block text-xs text-slate-500">{item.type}</span>
                    <span className="text-sm font-medium text-slate-800">
                      {item.record.id} · {item.record.client || item.record.name || "Record"}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">View</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}