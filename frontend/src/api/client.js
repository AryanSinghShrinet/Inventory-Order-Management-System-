import axios from "axios";

/* global __API_URL__ */

const baseURL = (typeof __API_URL__ !== "undefined" && __API_URL__) || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

// Translate backend error envelopes to a normalized Error shape.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    const normalized = new Error(
      data?.detail || data?.message || error.message || "Request failed"
    );
    normalized.status = error?.response?.status;
    normalized.code = data?.code;
    normalized.fields = data?.fields || {};
    normalized.original = error;
    return Promise.reject(normalized);
  }
);

export default api;
