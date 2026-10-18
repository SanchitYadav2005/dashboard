import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  leads,
  quotations,
  deals,
  orders,
  payments,
} from "./data/mokData";

import {
  filterByDate,
  formatCurrency,
  formatNumber,
  getDateRange,
  getPreviousRange,
  percentChange,
  downloadCSV,
} from "./utils/analytics";

import KpiCard from "./components/KpiCard";
import ChartPanel from "./components/ChartPanel";
import FilterBar from "./components/FilterBar";
import DataTable, { StatusBadge } from "./components/DataTable";
import DetailModal from "./components/DetailModal";

const NAVIGATION = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Leads", icon: Users },
  { label: "Quotations", icon: FileText },
  { label: "Deals & Revenue", icon: CircleDollarSign },
  { label: "Orders & Payments", icon: ClipboardList },
];

const CHART_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
];

const MONEY = (value) => formatCurrency(value);

function SectionHeading({ title, description, children }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      No data available for this period
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [preset, setPreset] = useState("30");
  const [customStart, setCustomStart] = useState("2026-10-01");
  const [customEnd, setCustomEnd] = useState("2026-10-18");
  const [ownerFilter, setOwnerFilter] = useState("All owners");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState(null);

  // Selected date range
  const range = useMemo(
    () => getDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  // Previous period for comparison
  const previousRange = useMemo(
    () => getPreviousRange(range.start, range.end),
    [range.start, range.end]
  );

  // FIX: Memoize filterRecords so its reference remains stable
  // until ownerFilter changes.
  const filterRecords = useCallback(
    (records, period) =>
      filterByDate(records, period.start, period.end).filter(
        (record) =>
          ownerFilter === "All owners" ||
          record.owner === ownerFilter
      ),
    [ownerFilter]
  );

  // Current-period records
  const current = useMemo(
    () => ({
      leads: filterRecords(leads, range),
      quotations: filterRecords(quotations, range),
      deals: filterRecords(deals, range),
      orders: filterRecords(orders, range),
      payments: filterRecords(payments, range),
    }),
    [range, filterRecords]
  );

  // Previous-period records
  const previous = useMemo(
    () => ({
      leads: filterRecords(leads, previousRange),
      quotations: filterRecords(quotations, previousRange),
      deals: filterRecords(deals, previousRange),
      orders: filterRecords(orders, previousRange),
      payments: filterRecords(payments, previousRange),
    }),
    [previousRange, filterRecords]
  );

  const owners = useMemo(
    () => [...new Set(leads.map((lead) => lead.owner))],
    []
  );

  const sum = (records, field) =>
    records.reduce(
      (total, record) => total + Number(record[field] || 0),
      0
    );

  const currentRevenue = sum(current.deals, "value");
  const previousRevenue = sum(previous.deals, "value");

  const currentCollected = sum(
    current.payments.filter(
      (payment) => payment.status === "Collected"
    ),
    "amount"
  );

  const previousCollected = sum(
    previous.payments.filter(
      (payment) => payment.status === "Collected"
    ),
    "amount"
  );

  const conversionRate = current.leads.length
    ? (
        (current.leads.filter(
          (lead) => lead.status === "Converted"
        ).length /
          current.leads.length) *
        100
      )
    : 0;

  const previousConversion = previous.leads.length
    ? (
        (previous.leads.filter(
          (lead) => lead.status === "Converted"
        ).length /
          previous.leads.length) *
        100
      )
    : 0;

  const outstanding = Math.max(
    0,
    currentRevenue - currentCollected
  );

  // Daily chart data
  const trendData = useMemo(() => {
    const days = [];
    const start = new Date(`${range.start}T12:00:00`);
    const end = new Date(`${range.end}T12:00:00`);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const key = date.toISOString().slice(0, 10);

      const label = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      days.push({
        date: key,
        day: label,

        leads: current.leads.filter(
          (item) => item.date === key
        ).length,

        revenue: current.deals
          .filter((item) => item.date === key)
          .reduce(
            (total, item) => total + Number(item.value || 0),
            0
          ),

        collections: current.payments
          .filter(
            (item) =>
              item.date === key &&
              item.status === "Collected"
          )
          .reduce(
            (total, item) =>
              total + Number(item.amount || 0),
            0
          ),
      });
    }

    return days;
  }, [current, range.start, range.end]);

  const leadStatusData = useMemo(() => {
    const statuses = [
      "New",
      "Qualified",
      "Converted",
      "Unqualified",
    ];

    return statuses.map((status) => ({
      name: status,
      value: current.leads.filter(
        (lead) => lead.status === status
      ).length,
    }));
  }, [current.leads]);

  const sourceData = useMemo(() => {
    const sources = [
      ...new Set(current.leads.map((lead) => lead.source)),
    ];

    return sources.map((source) => ({
      name: source,
      value: current.leads.filter(
        (lead) => lead.source === source
      ).length,
    }));
  }, [current.leads]);

  const serviceData = useMemo(() => {
    const services = [
      ...new Set([
        ...current.deals.map((deal) => deal.service),
        ...current.quotations.map((quote) => quote.service),
      ]),
    ];

    return services.map((service) => ({
      service,

      revenue: sum(
        current.deals.filter(
          (deal) => deal.service === service
        ),
        "value"
      ),

      quotations: current.quotations.filter(
        (quote) => quote.service === service
      ).length,
    }));
  }, [current.deals, current.quotations]);

  const priorityData = useMemo(
    () =>
      ["High", "Medium", "Low"].map((priority) => ({
        name: priority,
        value: current.deals.filter(
          (deal) => deal.priority === priority
        ).length,
      })),
    [current.deals]
  );

  const orderStatusData = useMemo(
    () =>
      ["Completed", "In Progress", "Pending"].map(
        (status) => ({
          name: status,
          value: current.orders.filter(
            (order) => order.status === status
          ).length,
        })
      ),
    [current.orders]
  );

  const allRecords = useMemo(
    () => [
      ...current.leads.map((record) => ({
        ...record,
        recordType: "Lead",
      })),

      ...current.quotations.map((record) => ({
        ...record,
        recordType: "Quotation",
      })),

      ...current.deals.map((record) => ({
        ...record,
        recordType: "Deal",
      })),

      ...current.orders.map((record) => ({
        ...record,
        recordType: "Order",
      })),

      ...current.payments.map((record) => ({
        ...record,
        recordType: "Payment",
      })),
    ],
    [current]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return allRecords;

    return allRecords.filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [allRecords, search]);

  const openDetails = (type, record) =>
    setSelected({ type, record });

  const relatedRecords = (type, record) => {
    if (type === "Lead") {
      return [
        ...quotations
          .filter((item) => item.leadId === record.id)
          .map((item) => ({
            type: "Quotation",
            record: item,
          })),

        ...deals
          .filter((item) => item.leadId === record.id)
          .map((item) => ({
            type: "Deal",
            record: item,
          })),
      ];
    }

    if (type === "Quotation") {
      return deals
        .filter((item) => item.quotationId === record.id)
        .map((item) => ({
          type: "Deal",
          record: item,
        }));
    }

    if (type === "Deal") {
      return [
        ...orders
          .filter((item) => item.dealId === record.id)
          .map((item) => ({
            type: "Order",
            record: item,
          })),

        ...payments
          .filter((item) => item.dealId === record.id)
          .map((item) => ({
            type: "Payment",
            record: item,
          })),
      ];
    }

    if (type === "Order") {
      return payments
        .filter((item) => item.orderId === record.id)
        .map((item) => ({
          type: "Payment",
          record: item,
        }));
    }

    if (type === "Payment") {
      return [
        ...orders
          .filter((item) => item.id === record.orderId)
          .map((item) => ({
            type: "Order",
            record: item,
          })),

        ...deals
          .filter((item) => item.id === record.dealId)
          .map((item) => ({
            type: "Deal",
            record: item,
          })),
      ];
    }

    return [];
  };

  const openRelated = (type, record) =>
    setSelected({ type, record });

  const resetFilters = () => {
    setPreset("30");
    setCustomStart("2026-10-01");
    setCustomEnd("2026-10-18");
    setOwnerFilter("All owners");
    setSearch("");
  };

  const exportCurrent = () => {
    const exportRecords =
      activeTab === "Leads"
        ? current.leads
        : activeTab === "Quotations"
        ? current.quotations
        : activeTab === "Deals & Revenue"
        ? current.deals
        : activeTab === "Orders & Payments"
        ? [...current.orders, ...current.payments]
        : allRecords;

    downloadCSV(
      exportRecords,
      `${activeTab.toLowerCase().replaceAll(" ", "-")}.csv`
    );
  };

  const dateLabel = `${range.start} — ${range.end}`;

  const columnsByTab = {
    Leads: [
      { key: "id", label: "Lead ID" },
      { key: "name", label: "Lead" },
      { key: "company", label: "Company" },
      { key: "source", label: "Source" },
      { key: "service", label: "Service" },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge status={value} />,
      },
      { key: "owner", label: "Owner" },
    ],

    Quotations: [
      { key: "id", label: "Quote ID" },
      { key: "client", label: "Client" },
      { key: "service", label: "Service" },
      {
        key: "value",
        label: "Quote value",
        render: (value) => MONEY(value),
      },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge status={value} />,
      },
      { key: "date", label: "Date" },
    ],

    "Deals & Revenue": [
      { key: "id", label: "Deal ID" },
      { key: "client", label: "Client" },
      { key: "service", label: "Service" },
      {
        key: "value",
        label: "Deal value",
        render: (value) => MONEY(value),
      },
      { key: "priority", label: "Priority" },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge status={value} />,
      },
      { key: "date", label: "Date" },
    ],

    "Orders & Payments": [
      { key: "id", label: "Order ID" },
      { key: "client", label: "Client" },
      { key: "service", label: "Service" },
      {
        key: "value",
        label: "Order value",
        render: (value) => MONEY(value),
      },
      {
        key: "paymentStatus",
        label: "Payment",
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: "status",
        label: "Progress",
        render: (value) => <StatusBadge status={value} />,
      },
    ],
  };

  const currentTabColumns = columnsByTab[activeTab];

  const paymentColumns = [
    { key: "id", label: "Payment ID" },
    { key: "client", label: "Client" },
    { key: "orderId", label: "Order ID" },
    { key: "method", label: "Method" },
    {
      key: "amount",
      label: "Amount",
      render: (value) => MONEY(value),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    { key: "date", label: "Date" },
  ];

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 25px rgba(15,23,42,0.08)",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {mobileMenu && (
          <button
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
            mobileMenu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <ChartNoAxesCombined size={22} />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                InsightFlow
              </h1>
              <p className="text-xs text-slate-500">
                Business Analytics
              </p>
            </div>

            <button
              className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenu(false)}
              aria-label="Close sidebar"
            >
              <X size={19} />
            </button>
          </div>

          <div className="px-4 pt-6">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Workspace
            </p>

            <nav className="space-y-1">
              {NAVIGATION.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.label;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveTab(item.label);
                      setMobileMenu(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                    {active && (
                      <ChevronRight
                        size={15}
                        className="ml-auto"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-2">
                <Activity
                  size={17}
                  className="text-indigo-300"
                />
                <span className="text-sm font-semibold">
                  Demo workspace
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-300">
                Sample business records for dashboard evaluation.
              </p>

              <div className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">
                Local demo · No backend
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setMobileMenu(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={21} />
                </button>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Workspace / Analytics
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                    {activeTab}
                  </h2>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search records..."
                    aria-label="Search all records"
                    className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    AD
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Admin
                    </p>
                    <p className="text-xs text-slate-500">
                      Administrator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <SectionHeading
              title={
                activeTab === "Overview"
                  ? "Business performance"
                  : activeTab
              }
              description="Track leads, quotations, deals, orders and collections in one place."
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Sample data
              </div>
            </SectionHeading>

            <FilterBar
              preset={preset}
              setPreset={setPreset}
              start={customStart}
              setStart={setCustomStart}
              end={customEnd}
              setEnd={setCustomEnd}
              onExport={exportCurrent}
              onReset={resetFilters}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <p>Selected period: {dateLabel}</p>

              <label className="flex items-center gap-2">
                <span>Owner</span>

                <select
                  value={ownerFilter}
                  onChange={(event) =>
                    setOwnerFilter(event.target.value)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option>All owners</option>

                  {owners.map((owner) => (
                    <option key={owner}>{owner}</option>
                  ))}
                </select>
              </label>
            </div>

            {activeTab === "Overview" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    title="Total leads"
                    value={formatNumber(current.leads.length)}
                    change={percentChange(
                      current.leads.length,
                      previous.leads.length
                    )}
                    icon={Users}
                    color="indigo"
                  />

                  <KpiCard
                    title="Qualified leads"
                    value={formatNumber(
                      current.leads.filter(
                        (lead) => lead.status === "Qualified"
                      ).length
                    )}
                    change={percentChange(
                      current.leads.filter(
                        (lead) => lead.status === "Qualified"
                      ).length,
                      previous.leads.filter(
                        (lead) => lead.status === "Qualified"
                      ).length
                    )}
                    icon={Target}
                    color="blue"
                  />

                  <KpiCard
                    title="Conversion rate"
                    value={`${conversionRate.toFixed(1)}%`}
                    change={Math.round(
                      conversionRate - previousConversion
                    )}
                    subtitle="Change in percentage points"
                    icon={CheckCircle2}
                    color="emerald"
                  />

                  <KpiCard
                    title="Quotation value"
                    value={MONEY(sum(current.quotations, "value"))}
                    change={percentChange(
                      sum(current.quotations, "value"),
                      sum(previous.quotations, "value")
                    )}
                    icon={FileText}
                    color="violet"
                  />

                  <KpiCard
                    title="Deal value"
                    value={MONEY(currentRevenue)}
                    change={percentChange(
                      currentRevenue,
                      previousRevenue
                    )}
                    icon={BriefcaseBusiness}
                    color="emerald"
                  />

                  <KpiCard
                    title="Collected payments"
                    value={MONEY(currentCollected)}
                    change={percentChange(
                      currentCollected,
                      previousCollected
                    )}
                    icon={CreditCard}
                    color="blue"
                  />

                  <KpiCard
                    title="Outstanding estimate"
                    value={MONEY(outstanding)}
                    subtitle="Deal value minus collections in period"
                    icon={CircleDollarSign}
                    color="amber"
                  />

                  <KpiCard
                    title="Orders"
                    value={formatNumber(current.orders.length)}
                    change={percentChange(
                      current.orders.length,
                      previous.orders.length
                    )}
                    icon={ClipboardList}
                    color="rose"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <ChartPanel
                      title="Daily revenue and collections"
                      subtitle="Revenue from deals compared with collected payments"
                    >
                      {trendData.length ? (
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <LineChart
                            data={trendData}
                            margin={{
                              top: 8,
                              right: 8,
                              left: 8,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              stroke="#e2e8f0"
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="day"
                              tick={{ fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              minTickGap={20}
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value) =>
                                `${Math.round(value / 1000)}k`
                              }
                            />
                            <Tooltip
                              formatter={(value) => MONEY(value)}
                              contentStyle={tooltipStyle}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              name="Deal value"
                              stroke="#4f46e5"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 5 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="collections"
                              name="Collected"
                              stroke="#10b981"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart />
                      )}
                    </ChartPanel>
                  </div>

                  <ChartPanel
                    title="Lead sources"
                    subtitle="Where your leads originate"
                  >
                    {sourceData.length ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={sourceData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                          >
                            {sourceData.map((item, index) => (
                              <Cell
                                key={item.name}
                                fill={
                                  CHART_COLORS[
                                    index % CHART_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend
                            verticalAlign="bottom"
                            height={38}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart />
                    )}
                  </ChartPanel>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChartPanel
                    title="Lead status funnel"
                    subtitle="Current lead distribution"
                  >
                    {leadStatusData.some(
                      (item) => item.value > 0
                    ) ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={leadStatusData}
                          layout="vertical"
                          margin={{ left: 12, right: 18 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            strokeDasharray="3 3"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={90}
                          />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="value"
                            name="Leads"
                            radius={[0, 6, 6, 0]}
                            barSize={22}
                          >
                            {leadStatusData.map((item, index) => (
                              <Cell
                                key={item.name}
                                fill={CHART_COLORS[index]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart />
                    )}
                  </ChartPanel>

                  <ChartPanel
                    title="Revenue by service"
                    subtitle="Deal value across service lines"
                  >
                    {serviceData.length ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={serviceData}
                          margin={{
                            top: 8,
                            right: 8,
                            left: 8,
                            bottom: 28,
                          }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="service"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            angle={-12}
                            textAnchor="end"
                            interval={0}
                            height={55}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                              `${Math.round(value / 1000)}k`
                            }
                          />
                          <Tooltip
                            formatter={(value) => MONEY(value)}
                            contentStyle={tooltipStyle}
                          />
                          <Bar
                            dataKey="revenue"
                            name="Revenue"
                            fill="#4f46e5"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart />
                    )}
                  </ChartPanel>
                </div>

                <DataTable
                  title="Recent leads"
                  records={[...current.leads]
                    .sort((a, b) =>
                      b.date.localeCompare(a.date)
                    )
                    .slice(0, 6)}
                  columns={columnsByTab.Leads}
                  onView={(record) =>
                    openDetails("Lead", record)
                  }
                />
              </>
            )}

            {activeTab === "Leads" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <KpiCard
                    title="Total leads"
                    value={current.leads.length}
                    icon={Users}
                  />
                  <KpiCard
                    title="Qualified"
                    value={current.leads.filter(
                      (lead) => lead.status === "Qualified"
                    ).length}
                    icon={Target}
                    color="blue"
                  />
                  <KpiCard
                    title="Unqualified"
                    value={current.leads.filter(
                      (lead) => lead.status === "Unqualified"
                    ).length}
                    icon={X}
                    color="rose"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChartPanel
                    title="Leads by source"
                    subtitle="Lead acquisition channel"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={sourceData}>
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                          dataKey="value"
                          name="Leads"
                          fill="#4f46e5"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel
                    title="Daily lead activity"
                    subtitle="New leads by date"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={trendData}>
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 11 }}
                          minTickGap={20}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line
                          type="monotone"
                          dataKey="leads"
                          name="New leads"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartPanel>
                </div>

                <DataTable
                  title="Lead register"
                  records={current.leads}
                  columns={columnsByTab.Leads}
                  onView={(record) =>
                    openDetails("Lead", record)
                  }
                />
              </>
            )}

            {activeTab === "Quotations" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <KpiCard
                    title="Total quotations"
                    value={current.quotations.length}
                    icon={FileText}
                  />
                  <KpiCard
                    title="Quotation value"
                    value={MONEY(
                      sum(current.quotations, "value")
                    )}
                    icon={CircleDollarSign}
                    color="emerald"
                  />
                  <KpiCard
                    title="Accepted quotations"
                    value={current.quotations.filter(
                      (quote) => quote.status === "Accepted"
                    ).length}
                    icon={CheckCircle2}
                    color="blue"
                  />
                </div>

                <ChartPanel
                  title="Quotation value by service"
                  subtitle="Total value of quotations issued"
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart data={serviceData}>
                      <CartesianGrid
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="service"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `${Math.round(value / 1000)}k`
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => MONEY(value)}
                        contentStyle={tooltipStyle}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Deal revenue"
                        fill="#4f46e5"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="quotations"
                        name="Quotation count"
                        fill="#06b6d4"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <DataTable
                  title="Quotation register"
                  records={current.quotations}
                  columns={columnsByTab.Quotations}
                  onView={(record) =>
                    openDetails("Quotation", record)
                  }
                />
              </>
            )}

            {activeTab === "Deals & Revenue" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    title="Deal count"
                    value={current.deals.length}
                    icon={BriefcaseBusiness}
                  />
                  <KpiCard
                    title="Total deal value"
                    value={MONEY(currentRevenue)}
                    icon={CircleDollarSign}
                    color="emerald"
                  />
                  <KpiCard
                    title="Won deals"
                    value={current.deals.filter(
                      (deal) => deal.status === "Won"
                    ).length}
                    icon={CheckCircle2}
                    color="blue"
                  />
                  <KpiCard
                    title="High priority"
                    value={current.deals.filter(
                      (deal) => deal.priority === "High"
                    ).length}
                    icon={Target}
                    color="rose"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChartPanel
                    title="Revenue by service"
                    subtitle="Deal value for selected period"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={serviceData}>
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="service"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `${Math.round(value / 1000)}k`
                          }
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value) => MONEY(value)}
                          contentStyle={tooltipStyle}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#4f46e5"
                          name="Revenue"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel
                    title="Deal priority"
                    subtitle="Deals grouped by priority"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={priorityData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={90}
                          label
                        >
                          {priorityData.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={CHART_COLORS[index]}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartPanel>
                </div>

                <DataTable
                  title="Deal register"
                  records={current.deals}
                  columns={columnsByTab["Deals & Revenue"]}
                  onView={(record) =>
                    openDetails("Deal", record)
                  }
                />
              </>
            )}

            {activeTab === "Orders & Payments" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    title="Orders"
                    value={current.orders.length}
                    icon={ClipboardList}
                  />
                  <KpiCard
                    title="Order value"
                    value={MONEY(sum(current.orders, "value"))}
                    icon={CircleDollarSign}
                    color="indigo"
                  />
                  <KpiCard
                    title="Collected"
                    value={MONEY(currentCollected)}
                    icon={CreditCard}
                    color="emerald"
                  />
                  <KpiCard
                    title="Pending payments"
                    value={MONEY(
                      sum(
                        current.payments.filter(
                          (payment) =>
                            payment.status === "Pending"
                        ),
                        "amount"
                      )
                    )}
                    icon={ArrowDownToLine}
                    color="amber"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChartPanel
                    title="Order progress"
                    subtitle="Orders by completion status"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={orderStatusData}>
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                          dataKey="value"
                          name="Orders"
                          fill="#06b6d4"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel
                    title="Daily collections"
                    subtitle="Successful payments by date"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={trendData}>
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 11 }}
                          minTickGap={20}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `${Math.round(value / 1000)}k`
                          }
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value) => MONEY(value)}
                          contentStyle={tooltipStyle}
                        />
                        <Line
                          type="monotone"
                          dataKey="collections"
                          name="Collected"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartPanel>
                </div>

                <DataTable
                  title="Order register"
                  records={current.orders}
                  columns={columnsByTab["Orders & Payments"]}
                  onView={(record) =>
                    openDetails("Order", record)
                  }
                />

                <DataTable
                  title="Payment history"
                  records={current.payments}
                  columns={paymentColumns}
                  onView={(record) =>
                    openDetails("Payment", record)
                  }
                />
              </>
            )}

            <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row">
              <p>
                InsightFlow · Business Performance Analytics
              </p>
              <p>
                Demonstration data only · No backend connected
              </p>
            </footer>
          </div>
        </main>
      </div>

      {selected && (
        <DetailModal
          type={selected.type}
          record={selected.record}
          related={relatedRecords(
            selected.type,
            selected.record
          )}
          onClose={() => setSelected(null)}
          onRelated={openRelated}
        />
      )}
    </div>
  );
}

export default App;