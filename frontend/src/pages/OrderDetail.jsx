import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2, Calendar, Package } from "lucide-react";

import Card, { CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import { useOrder } from "../api/hooks.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";

const STATUS_TONE = {
  pending: "warning",
  fulfilled: "success",
  cancelled: "danger",
};

export default function OrderDetail() {
  const { id } = useParams();
  const { data, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return <div className="text-sm text-ink-muted">Loading order…</div>;
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-1 px-6 py-14 text-center">
        <p className="text-sm font-medium text-ink">Order not found</p>
        <p className="mt-1 text-xs text-ink-muted">It may have been cancelled.</p>
        <Link to="/orders" className="mt-3">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All orders
        </Link>
      </div>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-ink">
            Order{" "}
            <span className="font-mono text-base text-ink-muted">
              #INV-{String(data.id).padStart(5, "0")}
            </span>
          </h1>
          <p className="text-sm text-ink-muted">Placed {formatDateTime(data.created_at)}</p>
        </div>
        <Badge tone={STATUS_TONE[data.status] || "neutral"} withDot className="self-start text-sm">
          {data.status}
        </Badge>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-ink">{data.customer_name}</p>
            <p className="inline-flex items-center gap-1.5 text-2xs text-ink-muted">
              <Mail className="h-3.5 w-3.5" />
              {data.customer_email}
            </p>
            {data.notes && (
              <p className="mt-2 rounded-md border border-surface-border bg-surface-2 p-2 text-2xs text-ink-muted">
                Note: {data.notes}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 text-2xs">
            <div>
              <p className="uppercase tracking-wide text-ink-muted">Line items</p>
              <p className="num mt-0.5 text-base font-semibold text-ink">
                {data.items?.length || 0}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-ink-muted">Quantity</p>
              <p className="num mt-0.5 text-base font-semibold text-ink">
                {data.items?.reduce((s, i) => s + i.quantity, 0) || 0}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-ink-muted">Placed</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-ink">
                <Calendar className="h-3.5 w-3.5 text-ink-subtle" />
                {formatDateTime(data.created_at)}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-ink-muted">Total</p>
              <p className="num mt-0.5 text-base font-semibold text-ink">
                {formatCurrency(data.total_amount)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-600 text-white">
          <CardBody className="flex flex-col gap-1">
            <p className="text-2xs uppercase tracking-wide text-accent-100">Grand total</p>
            <p className="num text-3xl font-semibold">
              {formatCurrency(data.total_amount)}
            </p>
            <p className="text-2xs text-accent-100">
              Includes all line items, computed at order time.
            </p>
          </CardBody>
        </Card>
      </section>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <div className="p-4">
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH className="text-right">Unit price</TH>
                <TH className="text-right">Quantity</TH>
                <TH className="text-right">Subtotal</TH>
              </tr>
            </THead>
            <TBody>
              {data.items?.map((it) => (
                <TR key={it.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-ink-subtle" />
                      <div>
                        <p className="font-medium text-ink">{it.product_name}</p>
                        <p className="font-mono text-2xs text-ink-muted">{it.product_sku}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="num text-right">{formatCurrency(it.unit_price)}</TD>
                  <TD className="num text-right">{it.quantity}</TD>
                  <TD className="num text-right font-medium">
                    {formatCurrency(it.subtotal)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
