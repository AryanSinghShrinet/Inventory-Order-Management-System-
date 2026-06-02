import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(64)
    .transform((v) => v.trim().toUpperCase()),
  description: z.string().max(2000).optional().or(z.literal("")),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().min(0, "Price cannot be negative")),
  stock_qty: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int("Must be a whole number").min(0, "Stock cannot be negative")),
  low_stock_threshold: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0)),
  category: z.string().max(80).optional().or(z.literal("")),
});

function validate(values) {
  const result = schema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = issue.message;
  }
  return { values: null, errors };
}

export default function ProductForm({
  initial,
  onSubmit,
  onCancel,
  busy = false,
  serverErrors = {},
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initial?.name ?? "",
      sku: initial?.sku ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? "",
      stock_qty: initial?.stock_qty ?? 0,
      low_stock_threshold: initial?.low_stock_threshold ?? 5,
      category: initial?.category ?? "",
    },
  });

  // Surface server-side field errors returned in `fields` envelopes.
  Object.entries(serverErrors).forEach(([k, v]) => {
    setError(k, { type: "server", message: v });
  });

  const submit = (values) => {
    const { values: clean, errors: zodErrors } = validate(values);
    if (!clean) {
      Object.entries(zodErrors).forEach(([k, v]) => setError(k, { type: "client", message: v }));
      return;
    }
    onSubmit({
      ...clean,
      description: clean.description || null,
      category: clean.category || null,
    });
  };

  return (
    <form id="product-form" onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Input
        label="Product name"
        placeholder="Apex Cotton Tee — Black / M"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="SKU / code"
        placeholder="TSHRT-CTN-BLK-M"
        error={errors.sku?.message}
        hint="Uppercase, unique across the catalogue."
        {...register("sku")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Price (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="1299.00"
          error={errors.price?.message}
          {...register("price")}
        />
        <Input
          label="Stock quantity"
          type="number"
          min="0"
          placeholder="0"
          error={errors.stock_qty?.message}
          {...register("stock_qty")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Low-stock alert"
          type="number"
          min="0"
          placeholder="5"
          error={errors.low_stock_threshold?.message}
          {...register("low_stock_threshold")}
        />
        <Input
          label="Category"
          placeholder="Apparel"
          error={errors.category?.message}
          {...register("category")}
        />
      </div>
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide text-ink-muted">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="A short description shown to operators…"
          className="mt-1.5 block w-full rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-2xs text-danger">{errors.description.message}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} type="button" disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
