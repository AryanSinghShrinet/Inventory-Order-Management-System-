import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../components/ui/Button.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Table, THead, TBody, TR, TH, TD, TEmpty } from "../components/ui/Table.jsx";
import Badge from "../components/ui/Badge.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import ProductForm from "../components/products/ProductForm.jsx";

import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../api/hooks.js";
import { formatCurrency, formatDateTime, stockLabel } from "../lib/format.js";

export default function Products() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);

  const params = useMemo(() => ({ q: q || undefined }), [q]);
  const { data, isLoading } = useProducts(params);
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  const openCreate = () => {
    setEditing(null);
    setServerErrors({});
    setDrawerOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setServerErrors({});
    setDrawerOpen(true);
  };
  const close = () => setDrawerOpen(false);

  const onSubmit = (values) => {
    setServerErrors({});
    const onError = (err) => {
      if (err?.fields) setServerErrors(err.fields);
      toast.error(err.message || "Could not save product");
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, body: values },
        {
          onSuccess: () => {
            toast.success("Product updated");
            close();
          },
          onError,
        }
      );
    } else {
      createMut.mutate(values, {
        onSuccess: () => {
          toast.success("Product created");
          close();
        },
        onError,
      });
    }
  };

  const onConfirmDelete = () => {
    if (!toDelete) return;
    deleteMut.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Product deleted");
        setToDelete(null);
      },
      onError: (err) => {
        toast.error(err.message || "Could not delete product");
        setToDelete(null);
      },
    });
  };

  const products = data || [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Products</h1>
          <p className="text-sm text-ink-muted">
            Catalogue of SKUs, prices, and stock levels.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </header>

      <Card className="p-0">
        <div className="flex flex-col gap-2 border-b border-surface-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              placeholder="Search by name or SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface-1 py-1.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            />
          </div>
          <p className="text-2xs text-ink-muted">
            {isLoading ? "Loading…" : `${products.length} item${products.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-ink-muted">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={q ? "No products match that search" : "No products yet"}
              hint={
                q
                  ? "Try a different name or SKU."
                  : "Add your first SKU to start tracking inventory."
              }
              actionLabel={q ? undefined : "Add product"}
              onAction={q ? undefined : openCreate}
              illustration={<Package className="h-6 w-6" />}
            />
          </div>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>SKU</TH>
                <TH className="text-right">Price</TH>
                <TH className="text-right">Stock</TH>
                <TH>Status</TH>
                <TH>Updated</TH>
                <TH className="w-1" />
              </tr>
            </THead>
            <TBody>
              {products.map((p) => {
                const stock = stockLabel(p.stock_qty, p.low_stock_threshold);
                return (
                  <TR key={p.id}>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">{p.name}</span>
                        {p.category && (
                          <span className="text-2xs text-ink-muted">{p.category}</span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <span className="font-mono text-2xs text-ink-muted">{p.sku}</span>
                    </TD>
                    <TD className="num text-right font-medium">
                      {formatCurrency(p.price)}
                    </TD>
                    <TD className="num text-right">
                      {p.stock_qty}
                      <span className="ml-1 text-2xs text-ink-muted">/ {p.low_stock_threshold}</span>
                    </TD>
                    <TD>
                      <Badge tone={stock.tone} withDot>
                        {stock.label}
                      </Badge>
                    </TD>
                    <TD className="text-2xs text-ink-muted">{formatDateTime(p.updated_at)}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(p)}
                          className="rounded p-1.5 text-ink-muted hover:bg-surface-2 hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={close}
        title={editing ? "Edit product" : "Add product"}
        description={
          editing
            ? "Update price, stock, and details for this SKU."
            : "Add a new SKU to your catalogue."
        }
        size="md"
      >
        <ProductForm
          initial={editing}
          onSubmit={onSubmit}
          onCancel={close}
          busy={createMut.isPending || updateMut.isPending}
          serverErrors={serverErrors}
        />
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this product?"
        description={
          toDelete
            ? `${toDelete.name} will be removed. Active orders will block deletion.`
            : ""
        }
        confirmLabel="Delete"
        busy={deleteMut.isPending}
        onConfirm={onConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
