import api from "@/lib/api";
import type {
  AnalyticsOverview,
  ProductFlowRow,
  WorkerAnalytics,
} from "@/lib/types";

export interface ProductFlowParams {
  from?: string;
  to?: string;
}

export const analyticsService = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const { data } = await api.get<AnalyticsOverview>("/analytics/overview");
    return data;
  },

  getWorkerAnalytics: async (workerId: string): Promise<WorkerAnalytics> => {
    const { data } = await api.get<WorkerAnalytics>(`/analytics/worker/${workerId}`);
    return data;
  },

  getProductFlow: async (
    params: ProductFlowParams = {}
  ): Promise<ProductFlowRow[]> => {
    const { data } = await api.get<{ items: ProductFlowRow[] }>(
      "/analytics/product-flow",
      { params }
    );
    return data.items;
  },
};
