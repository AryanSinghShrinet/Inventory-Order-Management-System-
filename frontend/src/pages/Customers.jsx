import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Mail, Phone, Building2, Users } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../components/ui/Button.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import CustomerForm from "../components/customers/CustomerForm.jsx";

import {
  useCustomers,
  useCreateCustomer,
  useDeleteCustomer,
} from "../api/hooks.js";
import { formatDate } from "../lib/format.js";

export default function Customers() {
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);

  const params = useMemo(() => ({ q: q || undefined }), [q]);
  const { data, isLoading } = useCustomers(params);
  const createMut = useCreateCustomer();
  const deleteMut = useDeleteCustomer();

  const openCreate = () => {
    setServerErrors({});
    setDrawerOpen(true);
  };
  const close = () => setDrawerOpen(false);

  const onSubmit = (values) => {
    setServerErrors({});
    createMut.mutate(values, {
      onSuccess: () => {
        toast.success("Customer added");
        close();
      },
      onError: (err) => {
        if (err?.fields) setServerErrors(err.fields);
        toast.error(err.message || "Could not add customer");
      },
    });
  };

  const onConfirmDelete = () => {
    if (!toDelete) return;
    deleteMut.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Customer removed");
        setToDelete(null);
      },
      onError: (err) => {
        toast.error(err.message || "Could not remove customer");
        setToDelete(null);
      },
    });
  };

  const customers = data || [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Customers</h1>
          <p className="text-sm text-ink-muted">
            Buyers on file, with contact details and order history.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add customer
        </Button>
      </header>

      <Card className="p-0">
        <div className="flex flex-col gap-2 border-b border-surface-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              placeholder="Search by name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface-1 py-1.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            />
          </div>
          <p className="text-2xs text-ink-muted">
            {isLoading
              ? "Loading…"
              : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-ink-muted">Loading customers…</div>
        ) : customers.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={q ? "No matches" : "No customers yet"}
              hint={
                q
                  ? "Try a different name or email."
                  : "Add a customer to start placing orders."
              }
              actionLabel={q ? undefined : "Add customer"}
              onAction={q ? undefined : openCreate}
              illustration={<Users className="h-6 w-6" />}
            />
          </div>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Contact</TH>
                <TH>Company</TH>
                <TH>Added</TH>
                <TH className="w-1" />
              </tr>
            </THead>
            <TBody>
              {customers.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-2xs font-semibold text-accent-700 dark:bg-accent-800/40 dark:text-accent-200">
                        {c.full_name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{c.full_name}</p>
                        <p className="text-2xs text-ink-muted">#{c.id}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-col gap-0.5 text-2xs">
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <Mail className="h-3.5 w-3.5 text-ink-subtle" />
                        {c.email}
                      </span>
                      {c.phone && (
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <Phone className="h-3.5 w-3.5" />
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </TD>
                  <TD>
                    {c.company ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-ink">
                        <Building2 className="h-3.5 w-3.5 text-ink-subtle" />
                        {c.company}
                      </span>
                    ) : (
                      <span className="text-2xs text-ink-muted">—</span>
                    )}
                  </TD>
                  <TD className="text-2xs text-ink-muted">{formatDate(c.created_at)}</TD>
                  <TD>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setToDelete(c)}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-2 hover:text-danger"
                        aria-label="Delete"
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
        title="Add customer"
        description="Capture the contact details for a new buyer."
        size="md"
      >
        <CustomerForm
          onSubmit={onSubmit}
          onCancel={close}
          busy={createMut.isPending}
          serverErrors={serverErrors}
        />
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Remove this customer?"
        description={
          toDelete
            ? `${toDelete.full_name} will be removed. Orders they placed will also be removed.`
            : ""
        }
        confirmLabel="Remove"
        busy={deleteMut.isPending}
        onConfirm={onConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
