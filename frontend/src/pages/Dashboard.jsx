import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package,
  Users,
  ReceiptText,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

import StatCard from "../components/ui/StatCard.jsx";
import Card, { CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import { Skeleton } from "../components/ui/PageLoader.jsx";
import { useDashboardSummary } from "../api/hooks.js";
import { formatCompactCurrency, formatCurrency, timeAgo } from "../lib/format.js";

function Sparkline({ data }) {
  if (!data?.length) return null;
  const values = data.map((d) => Number(d.count) || 0);
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 28;
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(height - (v / max) * height).toFixed(2)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboardSummary();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          An overview of your stock, customers, and order activity.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </>
        ) : isError ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardBody>
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="h-4.5 w-4.5" />
                <p className="text-sm">Could not reach the API. Is the backend up?</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <StatCard
              label="Total products"
              value={data.total_products}
              icon={Package}
              tone="accent"
              hint="Active SKUs in catalogue"
            />
            <StatCard
              label="Total customers"
              value={data.total_customers}
              icon={Users}
              tone="success"
              hint="Unique buyers on file"
            />
            <StatCard
              label="Total orders"
              value={data.total_orders}
              delta={`${data.pending_orders} pending`}
              icon={ReceiptText}
              tone="default"
              hint="Across the lifetime"
            />
            <StatCard
              label="Revenue"
              value={formatCompactCurrency(data.total_revenue)}
              icon={TrendingUp}
              tone="warning"
              hint="Net of cancelled orders"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Orders, last 14 days</CardTitle>
              <p className="mt-0.5 text-xs text-ink-muted">
                Daily order count. Hover is intentionally omitted — the data is small enough to read at a glance.
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Skeleton className="h-28" />
            ) : (
              <div className="text-accent-600">
                <Sparkline data={data?.orders_last_14_days} />
                <div className="mt-3 flex items-center justify-between text-2xs text-ink-muted">
                  <span>{data?.orders_last_14_days?.[0]?.date}</span>
                  <span className="num">
                    {data?.orders_last_14_days?.reduce(
                      (s, d) => s + Number(d.count || 0),
                      0
                    )}{" "}
                    orders
                  </span>
                  <span>{data?.orders_last_14_days?.at(-1)?.date}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <Badge tone="warning" withDot>
              {data?.low_stock_count ?? 0} SKUs
            </Badge>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ) : data?.low_stock_items?.length ? (
              <ul className="divide-y divide-surface-border">
                {data.low_stock_items.slice(0, 6).map((it) => (
                  <li key={it.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                      <p className="font-mono text-2xs text-ink-muted">{it.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm font-semibold text-ink">{it.stock_qty}</p>
                      <p className="text-2xs text-ink-muted">of {it.low_stock_threshold}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-center text-sm text-ink-muted">
                Everything is well stocked.
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link
              to="/orders"
              className="text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              All orders →
            </Link>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </div>
            ) : data?.orders_last_14_days?.length ? (
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
              >
                {data.orders_last_14_days
                  .filter((d) => Number(d.count) > 0)
                  .slice(-6)
                  .reverse()
                  .map((d) => (
                    <motion.li
                      key={d.date}
                      variants={{
                        hidden: { opacity: 0, y: 4 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="rounded-md border border-surface-border bg-surface-1 p-3"
                    >
                      <p className="text-2xs uppercase tracking-wide text-ink-muted">
                        {d.date}
                      </p>
                      <p className="num mt-1 text-base font-semibold text-ink">
                        {d.count} {d.count === "1" ? "order" : "orders"}
                      </p>
                      <p className="num text-2xs text-ink-muted">
                        {formatCurrency(d.revenue)} revenue
                      </p>
                    </motion.li>
                  ))}
              </motion.ul>
            ) : (
              <p className="text-sm text-ink-muted">No activity yet.</p>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
