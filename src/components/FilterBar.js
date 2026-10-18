import React from "react";
import { CalendarDays, Download, RotateCcw } from "lucide-react";

export default function FilterBar({
  preset,
  setPreset,
  start,
  setStart,
  end,
  setEnd,
  onExport,
  onReset,
}) {
  const presets = [
    { label: "Today", value: "today" },
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays size={18} className="text-slate-500" />
          {presets.map((item) => (
            <button
              key={item.value}
              onClick={() => setPreset(item.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                preset === item.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Start date"
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <span className="text-slate-400">to</span>
            <input
              aria-label="End date"
              type="date"
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}