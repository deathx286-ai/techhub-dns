import apiClient from "./client";
import { InflowSyncResponse } from "../types/order";

export const inflowApi = {
  sync: async () => {
    const response = await apiClient.post<InflowSyncResponse>("/inflow/sync");
    return response.data;
  },

  getSyncStatus: async () => {
    const response = await apiClient.get("/inflow/sync-status");
    return response.data;
  },
};
