import api from "@/lib/api";
import type { Product, ProductStatus } from "@/lib/types";

export interface ListProductsParams {
  category?: string;
  status?: ProductStatus;
}

export interface CreateProductPayload {
  name: string;
  image?: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock?: number;
  /** Optional admin-supplied custom product code. */
  productId?: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload> & {
  status?: ProductStatus;
};

export const productsService = {
  getProducts: async (params: ListProductsParams = {}): Promise<Product[]> => {
    const { data } = await api.get<{ items: Product[] }>("/products", { params });
    return data.items;
  },

  createProducts: async (payload: CreateProductPayload): Promise<Product> => {
    const { data } = await api.post<Product>("/products", payload);
    return data;
  },

  updateProducts: async (id: string, payload: UpdateProductPayload): Promise<Product> => {
    const { data } = await api.patch<Product>(`/products/${id}`, payload);
    return data;
  },

  deleteProducts: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
