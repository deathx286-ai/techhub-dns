import { Order, OrderDetail, OrderStatus, AuditLog, TeamsNotification } from "../types/order";

function isoMinutesAgo(min: number) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

let orders: Order[] = [
  {
    id: "SO-10421",
    customer_name: "Physics Dept",
    location: "ZACH 420",
    address: "Zachry Engineering Education Complex, College Station, TX",
    status: OrderStatus.PRE_DELIVERY,
    building_code: "ZACH",
    extracted_location: "ZACH 420",
    remarks: "Deliver to ZACH 420 (front desk if closed)",
    updated_at: isoMinutesAgo(12),
    created_at: isoMinutesAgo(55),
  } as any,
  {
    id: "SO-10418",
    customer_name: "Facilities",
    location: "LAAH 224",
    address: "Langford A Architecture Building A, College Station, TX",
    status: OrderStatus.IN_DELIVERY,
    building_code: "LAAH",
    extracted_location: "LAAH 224",
    remarks: "Call on arrival",
    updated_at: isoMinutesAgo(46),
    created_at: isoMinutesAgo(90),
  } as any,
  {
    id: "SO-10397",
    customer_name: "Student Computing",
    location: "ACAD 110",
    address: "Academic Building, College Station, TX",
    status: OrderStatus.DELIVERED,
    building_code: "ACAD",
    extracted_location: "ACAD 110",
    updated_at: isoMinutesAgo(180),
    created_at: isoMinutesAgo(360),
  } as any,
  {
    id: "SO-10390",
    customer_name: "Chemistry",
    location: "CHEM",
    address: "Chemistry Building, College Station, TX",
    status: OrderStatus.ISSUE,
    building_code: "CHEM",
    extracted_location: "CHEM",
    remarks: "Room not accessible; needs contact",
    updated_at: isoMinutesAgo(95),
    created_at: isoMinutesAgo(200),
  } as any,
];

let auditByOrder: Record<string, AuditLog[]> = {};
let notificationsByOrder: Record<string, TeamsNotification[]> = {};

function pushAudit(orderId: string, action: string, details?: string) {
  auditByOrder[orderId] ??= [];
  auditByOrder[orderId].unshift({
    id: crypto.randomUUID(),
    order_id: orderId,
    action,
    details: details ?? "",
    changed_by: "StaticMode",
    created_at: new Date().toISOString(),
  } as any);
}

export function listOrders(params?: { status?: OrderStatus; search?: string }) {
  let out = [...orders];

  if (params?.status) out = out.filter(o => o.status === params.status);

  const q = params?.search?.trim().toLowerCase();
  if (q) {
    out = out.filter(o =>
      (o.id ?? "").toLowerCase().includes(q) ||
      ((o.customer_name ?? "") as string).toLowerCase().includes(q) ||
      ((o.address ?? "") as string).toLowerCase().includes(q) ||
      ((o.extracted_location ?? "") as string).toLowerCase().includes(q) ||
      ((o.building_code ?? "") as string).toLowerCase().includes(q)
    );
  }

  return out;
}

export function getOrderDetail(orderId: string): OrderDetail {
  const o = orders.find(x => x.id === orderId);
  if (!o) throw new Error("Order not found");

  const detail: OrderDetail = {
    ...(o as any),
    items: [
      { sku: "SKU-001", name: "Dell Dock WD22TB4", quantity: 1 },
      { sku: "SKU-002", name: "HDMI Cable 6ft", quantity: 2 },
    ],
    teams_notifications: notificationsByOrder[orderId] ?? [],
  } as any;

  return detail;
}

export function updateStatus(orderId: string, newStatus: OrderStatus, reason?: string) {
  const idx = orders.findIndex(x => x.id === orderId);
  if (idx === -1) throw new Error("Order not found");

  orders[idx] = {
    ...(orders[idx] as any),
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  pushAudit(orderId, "STATUS_CHANGE", reason ? `Reason: ${reason}` : `Set to ${newStatus}`);

  // Fake Teams notification when going In Delivery
  if (newStatus === OrderStatus.IN_DELIVERY) {
    notificationsByOrder[orderId] ??= [];
    notificationsByOrder[orderId].unshift({
      id: crypto.randomUUID(),
      order_id: orderId,
      status: "sent",
      message: `Order ${orderId} is now In Delivery`,
      created_at: new Date().toISOString(),
    } as any);
  }

  return orders[idx];
}

export function bulkTransition(orderIds: string[], status: OrderStatus, changedBy?: string) {
  const updated: Order[] = [];
  for (const id of orderIds) {
    try {
      const o = updateStatus(id, status, changedBy ? `Bulk by ${changedBy}` : "Bulk transition");
      updated.push(o as any);
    } catch {
      // ignore missing
    }
  }
  return updated;
}

export function getAudit(orderId: string) {
  return auditByOrder[orderId] ?? [];
}

export function retryTeams(orderId: string) {
  notificationsByOrder[orderId] ??= [];
  const notification_id = crypto.randomUUID();
  notificationsByOrder[orderId].unshift({
    id: notification_id,
    order_id: orderId,
    status: "sent",
    message: `Retried Teams notification for ${orderId}`,
    created_at: new Date().toISOString(),
  } as any);

  pushAudit(orderId, "TEAMS_RETRY", `Notification ${notification_id}`);
  return { success: true, notification_id };
}
