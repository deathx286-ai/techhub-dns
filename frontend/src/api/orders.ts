import apiClient from "./client";
import { Order, OrderDetail, OrderStatus, OrderStatusUpdate, BulkStatusUpdate, AuditLog, TeamsNotification } from "../types/order";

export const ordersApi = {
  getOrders: async (params?: {
    status?: OrderStatus;
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<Order[]>("/orders", { params });
    return response.data;
  },

  getOrder: async (orderId: string) => {
    const response = await apiClient.get<OrderDetail>(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId: string, update: OrderStatusUpdate, changedBy?: string) => {
    const response = await apiClient.patch<Order>(
      `/orders/${orderId}/status`,
      update,
      { params: { changed_by: changedBy } }
    );
    return response.data;
  },

  bulkUpdateStatus: async (update: BulkStatusUpdate, changedBy?: string) => {
    const response = await apiClient.post<Order[]>(
      "/orders/bulk-transition",
      update,
      { params: { changed_by: changedBy } }
    );
    return response.data;
  },

  getOrderAudit: async (orderId: string) => {
    const response = await apiClient.get<AuditLog[]>(`/orders/${orderId}/audit`);
    return response.data;
  },

  retryNotification: async (orderId: string) => {
    const response = await apiClient.post<{ success: boolean; notification_id: string }>(
      `/orders/${orderId}/retry-notification`
    );
    return response.data;
  },
};
