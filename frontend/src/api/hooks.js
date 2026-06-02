import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

const KEYS = {
  products: ["products"],
  product: (id) => ["products", id],
  customers: ["customers"],
  customer: (id) => ["customers", id],
  orders: ["orders"],
  order: (id) => ["orders", id],
  dashboard: ["dashboard", "summary"],
};

/* -------- Products -------- */
export function useProducts(params = {}) {
  return useQuery({
    queryKey: [...KEYS.products, params],
    queryFn: async () => (await api.get("/products", { params })).data,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/products", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.products });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.put(`/products/${id}`, body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.products });
      qc.setQueryData(KEYS.product(data.id), data);
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.products });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

/* -------- Customers -------- */
export function useCustomers(params = {}) {
  return useQuery({
    queryKey: [...KEYS.customers, params],
    queryFn: async () => (await api.get("/customers", { params })).data,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/customers", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.customers });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.customers });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

/* -------- Orders -------- */
export function useOrders(params = {}) {
  return useQuery({
    queryKey: [...KEYS.orders, params],
    queryFn: async () => (await api.get("/orders", { params })).data,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: KEYS.order(id),
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/orders", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.orders });
      qc.invalidateQueries({ queryKey: KEYS.products });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.orders });
      qc.invalidateQueries({ queryKey: KEYS.products });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

/* -------- Dashboard -------- */
export function useDashboardSummary() {
  return useQuery({
    queryKey: KEYS.dashboard,
    queryFn: async () => (await api.get("/dashboard/summary")).data,
    refetchInterval: 60_000,
  });
}
