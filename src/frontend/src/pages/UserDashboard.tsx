import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ClipboardList,
  Clock,
  Construction,
  Droplets,
  Plus,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Category } from "../backend";
import type { Complaint } from "../backend";
import { ComplaintForm } from "../components/ComplaintForm";
import { StatusBadge } from "../components/StatusBadge";
import { useMyComplaints, useStats } from "../hooks/useQueries";

const CATEGORY_CARDS = [
  {
    category: Category.water_leakage,
    label: "Water Leakage",
    icon: Droplets,
    color: "bg-blue-500",
    textColor: "text-white",
  },
  {
    category: Category.drainage,
    label: "Drainage & Sewage",
    icon: Waves,
    color: "bg-cyan-400",
    textColor: "text-white",
  },
  {
    category: Category.road_damage,
    label: "Road Damage",
    icon: Construction,
    color: "bg-orange-400",
    textColor: "text-white",
  },
  {
    category: Category.garbage,
    label: "Garbage & Waste",
    icon: Trash2,
    color: "bg-emerald-500",
    textColor: "text-white",
  },
  {
    category: Category.electricity,
    label: "Electricity",
    icon: Zap,
    color: "bg-amber-400",
    textColor: "text-white",
  },
  {
    category: Category.other,
    label: "Other Issue",
    icon: AlertCircle,
    color: "bg-purple-500",
    textColor: "text-white",
  },
];

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface UserDashboardProps {
  userName: string;
  activePage: string;
  onNavigate: (page: string) => void;
}

export function UserDashboard({
  userName,
  activePage,
  onNavigate,
}: UserDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: complaints, isLoading: complaintsLoading } = useMyComplaints();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);

  const openForm = (category: Category) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  const statTiles = [
    {
      label: "Total",
      value: stats?.total ?? 0n,
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0n,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "In Progress",
      value: stats?.underProcess ?? 0n,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0n,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  if (activePage === "submit") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Submit a Complaint
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Describe the municipal issue in your area
          </p>
        </div>
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <ComplaintForm
              onSuccess={() => onNavigate("my-complaints")}
              onCancel={() => onNavigate("dashboard")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activePage === "my-complaints") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              My Complaints
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track all your submitted issues
            </p>
          </div>
          <Button
            data-ocid="my-complaints.primary_button"
            onClick={() => onNavigate("submit")}
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Complaint
          </Button>
        </div>

        {complaintsLoading ? (
          <div data-ocid="my-complaints.loading_state" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : !complaints?.length ? (
          <div
            data-ocid="my-complaints.empty_state"
            className="text-center py-16"
          >
            <ClipboardList className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No complaints yet
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Submit your first complaint to get started
            </p>
            <Button
              data-ocid="my-complaints.empty.primary_button"
              onClick={() => onNavigate("submit")}
            >
              Submit a Complaint
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c, i) => (
              <ComplaintCard
                key={c.id.toString()}
                complaint={c}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: dashboard
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-gradient rounded-2xl p-7 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome, {userName}! 👋</h1>
          <p className="text-white/85 text-base mb-5 max-w-lg">
            Help us improve your city. Report municipal issues and track
            resolutions — all in one place.
          </p>
          <Button
            data-ocid="dashboard.primary_button"
            onClick={() => onNavigate("submit")}
            className="bg-white text-primary hover:bg-white/90 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> Report an Issue
          </Button>
        </div>
        <div className="absolute right-6 top-0 bottom-0 flex items-center opacity-10">
          <Building2Size />
        </div>
      </motion.div>

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
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-3xl font-bold text-foreground">
                          {stats ? Number(s.value) : "—"}
                        </p>
                      )}
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

      {/* Category Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">
          Report an Issue
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORY_CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.category}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                data-ocid={`category.${c.category}.button`}
                onClick={() => openForm(c.category)}
                className={`${c.color} ${c.textColor} rounded-2xl p-5 flex flex-col items-start gap-3 hover:scale-[1.02] hover:shadow-card-hover transition-all text-left`}
              >
                <Icon className="w-8 h-8" />
                <span className="font-semibold text-sm leading-tight">
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recent complaints */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">
            Recent Complaints
          </h2>
          <Button
            variant="ghost"
            size="sm"
            data-ocid="dashboard.my-complaints.link"
            onClick={() => onNavigate("my-complaints")}
            className="text-primary"
          >
            View all
          </Button>
        </div>
        {complaintsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !complaints?.length ? (
          <Card className="card-shadow">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground text-sm">
                No complaints submitted yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.slice(0, 3).map((c, i) => (
              <ComplaintCard
                key={c.id.toString()}
                complaint={c}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit complaint dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg" data-ocid="complaint.dialog">
          <DialogHeader>
            <DialogTitle>Submit a Complaint</DialogTitle>
          </DialogHeader>
          <ComplaintForm
            defaultCategory={selectedCategory ?? undefined}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComplaintCard({
  complaint: c,
  index,
}: { complaint: Complaint; index: number }) {
  const catLabel: Record<string, string> = {
    water_leakage: "Water Leakage",
    drainage: "Drainage",
    road_damage: "Road Damage",
    garbage: "Garbage",
    electricity: "Electricity",
    other: "Other",
  };

  return (
    <Card
      data-ocid={`my-complaints.item.${index}`}
      className="card-shadow border-border hover:shadow-card-hover transition-shadow"
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-sm truncate">
              {c.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {catLabel[c.category] ?? c.category} · {c.area}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(c.createdAt)}
            </p>
          </div>
          <StatusBadge status={c.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function Building2Size() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
    >
      <rect x="40" y="60" width="120" height="130" rx="4" fill="white" />
      <rect
        x="55"
        y="80"
        width="25"
        height="25"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="90"
        y="80"
        width="25"
        height="25"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="125"
        y="80"
        width="25"
        height="25"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="55"
        y="120"
        width="25"
        height="25"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="90"
        y="120"
        width="25"
        height="25"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="125"
        y="120"
        width="25"
        height="25"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="80"
        y="155"
        width="40"
        height="35"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}
