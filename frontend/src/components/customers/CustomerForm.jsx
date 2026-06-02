import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required").max(160),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(160).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
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

export default function CustomerForm({
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
  } = useForm({ defaultValues: { full_name: "", email: "", phone: "", company: "", address: "" } });

  Object.entries(serverErrors).forEach(([k, v]) => setError(k, { type: "server", message: v }));

  const submit = (values) => {
    const { values: clean, errors: zodErrors } = validate(values);
    if (!clean) {
      Object.entries(zodErrors).forEach(([k, v]) => setError(k, { type: "client", message: v }));
      return;
    }
    onSubmit({
      ...clean,
      phone: clean.phone || null,
      company: clean.company || null,
      address: clean.address || null,
    });
  };

  return (
    <form id="customer-form" onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Input
        label="Full name"
        placeholder="Riya Sharma"
        error={errors.full_name?.message}
        {...register("full_name")}
      />
      <Input
        label="Email"
        type="email"
        placeholder="riya@northwind.io"
        error={errors.email?.message}
        hint="Must be unique."
        {...register("email")}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Phone"
          type="tel"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Company"
          placeholder="Northwind Labs"
          error={errors.company?.message}
          {...register("company")}
        />
      </div>
      <Input
        label="Address"
        placeholder="12 MG Road, Bengaluru"
        error={errors.address?.message}
        {...register("address")}
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} type="button" disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}
