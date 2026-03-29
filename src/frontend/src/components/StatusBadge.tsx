import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
    },
    under_process: {
      label: "In Progress",
      className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
    },
    completed: {
      label: "Completed",
      className:
        "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    },
  };

  const c = config[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs px-2.5 py-0.5",
        c.className,
        className,
      )}
    >
      {c.label}
    </Badge>
  );
}
