import React from "react";
import { Eye } from "lucide-react";

export function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let style = "bg-slate-100 text-slate-700";
  if (["won", "completed", "collected", "paid", "accepted", "converted"].includes(value)) {
    style = "bg-emerald-50 text-emerald-700";
  } else if (["pending", "in progress", "negotiation", "partial", "sent"].includes(value)) {
    style = "bg-amber-50 text-amber-700";
  } else if (["failed", "rejected", "unqualified", "unpaid"].includes(value)) {
    style = "bg-rose-50 text-rose-700";
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status || "N/A"}
    </span>
  );
}

export default function DataTable({
  title,
  records = [],
  columns,
  onView,
  emptyMessage = "No records found for this period.",
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {records.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
              {onView && <th className="px-5 py-3">Details</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-5 py-4 text-slate-700">
                    {column.render
                      ? column.render(record[column.key], record)
                      : record[column.key] ?? "—"}
                  </td>
                ))}
                {onView && (
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onView(record)}
                      aria-label={`View ${record.id}`}
                      className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (onView ? 1 : 0)}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}