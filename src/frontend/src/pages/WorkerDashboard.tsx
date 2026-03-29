import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  Loader2,
  MapPin,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Complaint } from "../backend";
import { StatusBadge } from "../components/StatusBadge";
import {
  useAssignedComplaints,
  useUpdateComplaintStatus,
} from "../hooks/useQueries";

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  water_leakage: "Water Leakage",
  drainage: "Drainage",
  road_damage: "Road Damage",
  garbage: "Garbage",
  electricity: "Electricity",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  water_leakage: "bg-blue-500",
  drainage: "bg-cyan-400",
  road_damage: "bg-orange-400",
  garbage: "bg-emerald-500",
  electricity: "bg-amber-400",
  other: "bg-purple-500",
};

interface WorkerDashboardProps {
  userName: string;
  activePage: string;
}

export function WorkerDashboard({
  userName,
  activePage,
}: WorkerDashboardProps) {
  const { data: complaints, isLoading } = useAssignedComplaints();
  const updateStatus = useUpdateComplaintStatus();

  const total = complaints?.length ?? 0;
  const underProcess =
    complaints?.filter((c) => c.status === "under_process").length ?? 0;
  const completed =
    complaints?.filter((c) => c.status === "completed").length ?? 0;
  const pending = complaints?.filter((c) => c.status === "pending").length ?? 0;

  const handleStatusUpdate = async (complaintId: bigint, status: string) => {
    try {
      await updateStatus.mutateAsync({ complaintId, status });
      toast.success(
        `Status updated to ${status === "under_process" ? "In Progress" : "Completed"}`,
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const displayComplaints =
    activePage === "assigned"
      ? (complaints ?? []).filter((c) => c.status !== "completed")
      : (complaints ?? []);

  const statTiles = [
    {
      label: "Assigned",
      value: total,
      icon: ClipboardList,
      color: "text-primary",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "In Progress",
      value: underProcess,
      icon: Wrench,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {activePage === "dashboard" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="hero-gradient rounded-2xl p-7 text-white">
            <h1 className="text-3xl font-bold mb-1">Worker Dashboard</h1>
            <p className="text-white/80 text-sm">
              Welcome, {userName}! Here are your assigned tasks.
            </p>
          </div>
        </motion.div>
      )}

      {activePage !== "dashboard" && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Assigned Tasks
          </h1>
          <p className="text-muted-foreground text-sm">
            Complaints assigned to you for resolution
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statTiles.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="card-shadow border-border">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {s.value}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {s.label}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Complaints list */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">
          {activePage === "assigned" ? "Active Tasks" : "Recent Assignments"}
        </h2>

        {isLoading ? (
          <div data-ocid="worker.loading_state" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : !displayComplaints.length ? (
          <div data-ocid="worker.empty_state" className="text-center py-16">
            <Wrench className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks assigned</h3>
            <p className="text-muted-foreground text-sm">
              Check back later for new assignments
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayComplaints.map((c, i) => (
              <WorkerComplaintCard
                key={c.id.toString()}
                complaint={c}
                index={i + 1}
                onUpdateStatus={handleStatusUpdate}
                isUpdating={updateStatus.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WorkerComplaintCardProps {
  complaint: Complaint;
  index: number;
  onUpdateStatus: (id: bigint, status: string) => void;
  isUpdating: boolean;
}

function WorkerComplaintCard({
  complaint: c,
  index,
  onUpdateStatus,
  isUpdating,
}: WorkerComplaintCardProps) {
  const catColor = CATEGORY_COLORS[c.category] ?? "bg-gray-500";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        data-ocid={`worker.item.${index}`}
        className="card-shadow border-border hover:shadow-card-hover transition-shadow"
      >
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${catColor} flex-shrink-0 mt-0.5`}
              />
              <div>
                <h3 className="font-semibold text-foreground">{c.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[c.category] ?? c.category}
                </p>
              </div>
            </div>
            <StatusBadge status={c.status} />
          </div>

          <p className="text-sm text-muted-foreground mb-3 pl-6 line-clamp-2">
            {c.description}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pl-6 mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {c.area}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> {formatDate(c.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              Reported by: <strong>{c.userName}</strong>
            </span>
          </div>

          {c.photo && (
            <div className="pl-6 mb-4">
              <img
                src={c.photo.getDirectURL()}
                alt="Evidence of the reported issue"
                className="rounded-lg max-h-48 object-cover border border-border"
              />
            </div>
          )}

          {c.status !== "completed" && c.status !== "rejected" && (
            <div className="flex gap-2 pl-6">
              {c.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid={`worker.in-progress.button.${index}`}
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(c.id, "under_process")}
                  className="text-xs"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  Mark In Progress
                </Button>
              )}
              {c.status === "under_process" && (
                <Button
                  size="sm"
                  data-ocid={`worker.complete.button.${index}`}
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(c.id, "completed")}
                  className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  Mark Completed
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
