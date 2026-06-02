import { cn } from "../../lib/cn.js";

export function Skeleton({ className, ...rest }) {
  return <div className={cn("skeleton h-4 w-full", className)} {...rest} />;
}

export function SkeletonRow({ columns = 4 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-3.5 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function PageLoader() {
  return (
    <div className="flex flex-col gap-3">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-3.5 w-64" />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    </div>
  );
}
