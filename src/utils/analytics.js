export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN").format(value);

export const percentChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const filterByDate = (records, start, end) =>
  records.filter((record) => record.date >= start && record.date <= end);

export const getDateRange = (preset, customStart, customEnd) => {
  const end = new Date("2026-10-18T12:00:00");
  const start = new Date(end);

  if (preset === "custom") {
    return { start: customStart, end: customEnd };
  }

  const days = preset === "today" ? 1 : preset === "7" ? 7 : 30;
  start.setDate(start.getDate() - days + 1);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export const getPreviousRange = (start, end) => {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const days =
    Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  endDate.setDate(startDate.getDate() - 1);
  startDate.setDate(startDate.getDate() - days);

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
};

export const downloadCSV = (records, filename = "report.csv") => {
  if (!records.length) return;

  const headers = Object.keys(records[0]);
  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escapeCSV).join(","),
    ...records.map((record) =>
      headers.map((header) => escapeCSV(record[header])).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};