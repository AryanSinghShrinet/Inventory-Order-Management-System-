import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, ReceiptText, Eye } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../components/ui/Button.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table.jsx";
import Badge from "../components/ui/Badge.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import OrderItemsEditor from "../components/orders/OrderItemsEditor.jsx";

import {
  useOrders,
  useProducts,
  useCustomers,
  useCreateOrder,
  useDeleteOrder,
} from "../api/hooks.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";

const STATUS_TONE = {
  pending: "warning",
  fulfilled: "success",
  cancelled: "danger",
};

export default function Orders() {
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [serverErrors, setServerErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading } = useOrders();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const createMut = useCreateOrder();
  const deleteMut = useDeleteOrder();

  const openCreate = () => {
    setCustomerId("");
    setNotes("");
    setItems([{ product_id: "", quantity: 1 }]);
    setServerErrors({});
    setDrawerOpen(true);
  };
  const close = () => setDrawerOpen(false);

  const submit = () => {
    setServerErrors({});
    const cleanItems = items
      .map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }))
      .filter((i) => i.product_id && i.quantity > 0);
    if (!customerId) {
      setServerErrors({ customer_id: "Choose a customer" });
      return;
    }
    if (cleanItems.length === 0) {
      setServerErrors({ items: "Add at least one line item" });
      return;
    }
    createMut.mutate(
      { customer_id: Number(customerId), items: cleanItems, notes: notes || null },
      {
        onSuccess: () => {
          toast.success("Order placed. Stock updated.");
          close();
        },
        onError: (err) => {
          if (err?.fields) setServerErrors(err.fields);
          toast.error(err.message || "Could not place order");
        },
      }
    );
  };

  const onConfirmDelete = () => {
    if (!toDelete) return;
    deleteMut.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Order cancelled. Stock restored.");
        setToDelete(null);
      },
      onError: (err) => {
        toast.error(err.message || "Could not cancel order");
        setToDelete(null);
      },
    });
  };

  const orders = data || [];
  const filtered = useMemo(() => {
    if (!q) return orders;
    const ql = q.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).includes(ql) ||
        o.customer_name?.toLowerCase().includes(ql) ||
        o.customer_email?.toLowerCase().includes(ql)
    );
  }, [orders, q]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Orders</h1>
          <p className="text-sm text-ink-muted">
            Place orders for customers. Stock is deducted automatically.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New order
        </Button>
      </header>

      <Card className="p-0">
        <div className="flex flex-col gap-2 border-b border-surface-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              placeholder="Search by id, customer, or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface-1 py-1.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            />
          </div>
          <p className="text-2xs text-ink-muted">
            {isLoading ? "Loading…" : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-ink-muted">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={q ? "No matching orders" : "No orders yet"}
              hint={
                q
                  ? "Try a different id, name, or email."
                  : "Place your first order to start tracking fulfilment."
              }
              actionLabel={q ? undefined : "New order"}
              onAction={q ? undefined : openCreate}
              illustration={<ReceiptText className="h-6 w-6" />}
            />
          </div>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH className="text-right">Items</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
                <TH>Placed</TH>
                <TH className="w-1" />
              </tr>
            </THead>
            <TBody>
              {filtered.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link
                      to={`/orders/${o.id}`}
                      className="font-mono text-2xs text-accent-600 hover:underline"
                    >
                      #INV-{String(o.id).padStart(5, "0")}
                    </Link>
                  </TD>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">{o.customer_name}</span>
                      <span className="text-2xs text-ink-muted">{o.customer_email}</span>
                    </div>
                  </TD>
                  <TD className="num text-right">{o.items?.length || 0}</TD>
                  <TD className="num text-right font-medium">
                    {formatCurrency(o.total_amount)}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[o.status] || "neutral"} withDot>
                      {o.status}
                    </Badge>
                  </TD>
                  <TD className="text-2xs text-ink-muted">{formatDateTime(o.created_at)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/orders/${o.id}`}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
                        aria-label="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(o)}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-2 hover:text-danger"
                        aria-label="Cancel"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={close}
        title="New order"
        description="Add one or more products. The total is computed server-side from current prices."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={createMut.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={createMut.isPending}>
              {createMut.isPending ? "Placing…" : "Place order"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-2xs font-medium uppercase tracking-wide text-ink-muted">
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-surface-border bg-surface-1 px-2.5 py-1.5 text-sm text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            >
              <option value="">Select a customer…</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} · {c.email}
                </option>
              ))}
            </select>
            {serverErrors?.customer_id && (
              <p className="mt-1 text-2xs text-danger">{serverErrors.customer_id}</p>
            )}
          </div>

          <div>
            <label className="text-2xs font-medium uppercase tracking-wide text-ink-muted">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional — gift note, PO number, etc."
              className="mt-1.5 block w-full rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            />
          </div>

          <div>
            <p className="mb-2 text-2xs font-medium uppercase tracking-wide text-ink-muted">
              Line items
            </p>
            <OrderItemsEditor
              products={products || []}
              value={items}
              onChange={setItems}
              serverErrors={serverErrors}
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Cancel this order?"
        description={
          toDelete
            ? `Order #INV-${String(toDelete.id).padStart(5, "0")} will be cancelled and stock restored.`
            : ""
        }
        confirmLabel="Cancel order"
        busy={deleteMut.isPending}
        onConfirm={onConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
