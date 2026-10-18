import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function KpiCard({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  color = "indigo",
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
  };

  const positive = Number(change) >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${colors[color] || colors.indigo}`}>
            <Icon size={21} />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {positive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {Math.abs(Number(change))}%
          </span>
        )}
        <span className="text-slate-500">
          {subtitle || "Compared with previous period"}
        </span>
      </div>
    </div>
  );
}