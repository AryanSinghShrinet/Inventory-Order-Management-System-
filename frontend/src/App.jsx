import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import AppShell from "./components/layout/AppShell.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Products = lazy(() => import("./pages/Products.jsx"));
const Customers = lazy(() => import("./pages/Customers.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const OrderDetail = lazy(() => import("./pages/OrderDetail.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
