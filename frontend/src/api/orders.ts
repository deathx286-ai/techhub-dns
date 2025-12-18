import { Order, OrderDetail, OrderStatus, OrderStatusUpdate, BulkStatusUpdate, AuditLog } from "../types/order";
import { listOrders, getOrderDetail, updateStatus, bulkTransition, getAudit, retryTeams } from "../mock/store";

export const ordersApi = {
  getOrders: async (params?: { status?: OrderStatus; search?: string }): Promise<Order[]> => {
    return listOrders(params);
  },

  getOrder: async (orderId: string): Promise<OrderDetail> => {
    return getOrderDetail(orderId);
  },

  updateOrderStatus: async (orderId: string, update: OrderStatusUpdate, changedBy?: string): Promise<Order> => {
    return updateStatus(orderId, update.status, update.reason ?? changedBy);
  },

  bulkUpdateStatus: async (payload: BulkStatusUpdate): Promise<Order[]> => {
    return bulkTransition(payload.order_ids, payload.status, payload.changed_by);
  },

  getOrderAudit: async (orderId: string): Promise<AuditLog[]> => {
    return getAudit(orderId) as any;
  },

  retryNotification: async (orderId: string) => {
    return retryTeams(orderId);
  },
};
