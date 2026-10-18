const today = new Date("2026-10-18T12:00:00");

const dateOffset = (offset) => {
  const date = new Date(today);
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
};

const services = [
  "Web Development",
  "Mobile App",
  "UI/UX Design",
  "Digital Marketing",
];

const sources = ["Website", "Referral", "LinkedIn", "Campaign"];
const owners = ["Aarav Sharma", "Priya Singh", "Rahul Verma", "Neha Gupta"];

export const leads = Array.from({ length: 40 }, (_, i) => ({
  id: `L${String(i + 1).padStart(3, "0")}`,
  name:
    [
      "Amit Kumar",
      "Riya Sharma",
      "Vikram Singh",
      "Ananya Gupta",
      "Karan Patel",
      "Meera Joshi",
      "Arjun Verma",
      "Isha Rao",
    ][i % 8] + (i >= 8 ? ` ${Math.floor(i / 8) + 1}` : ""),
  company: ["Acme Solutions", "Bright Labs", "Nova Tech", "Vertex Digital"][
    i % 4
  ],
  email: `contact${i + 1}@example.com`,
  source: sources[i % sources.length],
  status: ["Qualified", "Converted", "New", "Unqualified"][i % 4],
  owner: owners[i % owners.length],
  department: "Sales",
  service: services[i % services.length],
  value: 15000 + (i % 9) * 8500,
  date: dateOffset((i * 2) % 30),
}));

export const quotations = Array.from({ length: 30 }, (_, i) => {
  const lead = leads[(i * 3) % leads.length];
  return {
    id: `Q${String(i + 1).padStart(3, "0")}`,
    leadId: lead.id,
    client: lead.name,
    service: lead.service,
    value: 20000 + (i % 8) * 12500,
    status: ["Sent", "Accepted", "Pending", "Rejected"][i % 4],
    owner: lead.owner,
    date: dateOffset((i * 3) % 30),
  };
});

export const deals = Array.from({ length: 20 }, (_, i) => {
  const lead = leads[(i * 2) % leads.length];
  const quotation = quotations.find((q) => q.leadId === lead.id);
  return {
    id: `D${String(i + 1).padStart(3, "0")}`,
    leadId: lead.id,
    quotationId: quotation?.id || null,
    client: lead.name,
    service: lead.service,
    value: 35000 + (i % 7) * 20000,
    priority: ["High", "Medium", "Low"][i % 3],
    status: ["In Progress", "Completed", "Negotiation", "Won"][i % 4],
    owner: lead.owner,
    date: dateOffset((i * 4) % 30),
    progress: [25, 50, 75, 100][i % 4],
  };
});

export const orders = Array.from({ length: 24 }, (_, i) => {
  const deal = deals[i % deals.length];
  return {
    id: `O${String(i + 1).padStart(3, "0")}`,
    dealId: deal.id,
    client: deal.client,
    service: deal.service,
    value: Math.round(deal.value / (1 + (i % 2))),
    status: ["Completed", "In Progress", "Pending"][i % 3],
    paymentStatus: ["Paid", "Partial", "Unpaid"][i % 3],
    owner: deal.owner,
    department: "Operations",
    date: dateOffset((i * 2) % 30),
    progress: [100, 60, 20][i % 3],
  };
});

export const payments = Array.from({ length: 28 }, (_, i) => {
  const order = orders[i % orders.length];
  return {
    id: `P${String(i + 1).padStart(3, "0")}`,
    dealId: order.dealId,
    orderId: order.id,
    client: order.client,
    amount: [5000, 12000, 18000, 25000][i % 4],
    method: ["Bank Transfer", "UPI", "Card"][i % 3],
    status: ["Collected", "Pending", "Failed", "Collected"][i % 4],
    date: dateOffset((i * 2) % 30),
  };
});

export const serviceCategories = services.map((service) => ({
  name: service,
  value: deals
    .filter((deal) => deal.service === service)
    .reduce((sum, deal) => sum + deal.value, 0),
}));
