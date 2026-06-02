import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import Button from "../ui/Button.jsx";
import { formatCurrency } from "../../lib/format.js";

export default function OrderItemsEditor({ products, value, onChange, serverErrors = {} }) {
  const [items, setItems] = useState(() => {
    if (Array.isArray(value) && value.length) return value;
    return [{ product_id: "", quantity: 1 }];
  });

  useEffect(() => {
    onChange?.(items);
  }, [items, onChange]);

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of products || []) map.set(String(p.id), p);
    return map;
  }, [products]);

  const updateAt = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeAt = (idx) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const addRow = () => setItems((prev) => [...prev, { product_id: "", quantity: 1 }]);

  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = productById.get(String(it.product_id));
      if (!p) return sum;
      const q = Number(it.quantity) || 0;
      return sum + Number(p.price) * q;
    }, 0);
  }, [items, productById]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-surface-border">
        <div className="hidden grid-cols-12 gap-2 border-b border-surface-border bg-surface-2/60 px-3 py-2 text-2xs font-medium uppercase tracking-wide text-ink-muted sm:grid">
          <div className="col-span-6">Product</div>
          <div className="col-span-2 text-right">Unit price</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Line total</div>
        </div>
        {items.map((it, idx) => {
          const p = productById.get(String(it.product_id));
          const lineTotal = p ? Number(p.price) * (Number(it.quantity) || 0) : 0;
          const overStock = p && Number(it.quantity) > p.stock_qty;
          return (
            <div
              key={idx}
              className="grid grid-cols-12 items-center gap-2 border-b border-surface-border px-3 py-2 last:border-b-0"
            >
              <div className="col-span-12 sm:col-span-6">
                <select
                  value={it.product_id}
                  onChange={(e) => updateAt(idx, { product_id: e.target.value })}
                  className="w-full rounded-md border border-surface-border bg-surface-1 px-2.5 py-1.5 text-sm text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
                >
                  <option value="">Select a product…</option>
                  {products?.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} · stock {prod.stock_qty}
                    </option>
                  ))}
                </select>
                {p && overStock && (
                  <p className="mt-1 text-2xs text-danger">
                    Only {p.stock_qty} in stock.
                  </p>
                )}
              </div>
              <div className="col-span-4 text-right text-2xs text-ink-muted sm:col-span-2 sm:text-sm">
                {p ? formatCurrency(p.price) : "—"}
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => updateAt(idx, { quantity: e.target.value })}
                  className="num w-full rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-right text-sm text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
                />
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2 sm:col-span-2">
                <span className="num text-sm font-medium text-ink">
                  {formatCurrency(lineTotal)}
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  disabled={items.length === 1}
                  className="rounded p-1 text-ink-muted hover:bg-surface-2 hover:text-danger disabled:opacity-30"
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {serverErrors?.items && (
        <p className="text-2xs text-danger">{serverErrors.items}</p>
      )}
      {serverErrors?.detail && (
        <p className="text-2xs text-danger">{serverErrors.detail}</p>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" type="button" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          Add line
        </Button>
        <div className="text-right">
          <p className="text-2xs uppercase tracking-wide text-ink-muted">
            Computed total
          </p>
          <p className="num text-lg font-semibold text-ink">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
