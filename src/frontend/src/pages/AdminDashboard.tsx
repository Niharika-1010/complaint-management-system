import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  CheckCircle,
  ClipboardList,
  Clock,
  Filter,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Complaint, Worker } from "../backend";
import { StatusBadge } from "../components/StatusBadge";
import {
  useAddWorker,
  useAllComplaints,
  useAssignComplaint,
  useStats,
  useWorkers,
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

interface AdminDashboardProps {
  userName: string;
  activePage: string;
  onNavigate?: (page: string) => void;
}

export function AdminDashboard({
  userName,
  activePage,
  onNavigate: _onNavigate,
}: AdminDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: complaints, isLoading: complaintsLoading } = useAllComplaints();
  const { data: workers } = useWorkers();
  const assignMutation = useAssignComplaint();
  const addWorkerMutation = useAddWorker();

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignModal, setAssignModal] = useState<Complaint | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [addWorkerModal, setAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerId, setNewWorkerId] = useState("");

  const filteredComplaints = (complaints ?? []).filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    return true;
  });

  const handleAssign = async () => {
    if (!assignModal || !selectedWorker) return;
    const worker = workers?.find(
      (w) => w.principal.toString() === selectedWorker,
    );
    if (!worker) return;
    try {
      await assignMutation.mutateAsync({
        complaintId: assignModal.id,
        workerId: selectedWorker,
        workerName: worker.name,
      });
      toast.success("Complaint assigned successfully");
      setAssignModal(null);
      setSelectedWorker("");
    } catch {
      toast.error("Failed to assign complaint");
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim() || !newWorkerId.trim()) return;
    try {
      await addWorkerMutation.mutateAsync({
        workerId: newWorkerId.trim(),
        workerName: newWorkerName.trim(),
      });
      toast.success("Worker added successfully");
      setAddWorkerModal(false);
      setNewWorkerName("");
      setNewWorkerId("");
    } catch {
      toast.error("Failed to add worker. Check the principal ID.");
    }
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

  if (activePage === "workers") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workers</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage field workers
            </p>
          </div>
          <Button
            data-ocid="workers.primary_button"
            onClick={() => setAddWorkerModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Add Worker
          </Button>
        </div>

        {!workers?.length ? (
          <div data-ocid="workers.empty_state" className="text-center py-16">
            <Users className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workers yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add workers to assign complaints
            </p>
            <Button
              data-ocid="workers.empty.primary_button"
              onClick={() => setAddWorkerModal(true)}
            >
              Add First Worker
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {workers.map((w, i) => (
              <Card
                key={w.principal.toString()}
                data-ocid={`workers.item.${i + 1}`}
                className="card-shadow"
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{w.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {w.principal.toString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Worker</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Worker Modal */}
        <Dialog open={addWorkerModal} onOpenChange={setAddWorkerModal}>
          <DialogContent data-ocid="add-worker.dialog">
            <DialogHeader>
              <DialogTitle>Add Worker</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Worker Name</Label>
                <Input
                  data-ocid="add-worker.input"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Principal ID</Label>
                <Input
                  data-ocid="add-worker.principal.input"
                  value={newWorkerId}
                  onChange={(e) => setNewWorkerId(e.target.value)}
                  placeholder="e.g. aaaaa-aaaaa-aaaaa-..."
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  data-ocid="add-worker.cancel_button"
                  variant="outline"
                  onClick={() => setAddWorkerModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-ocid="add-worker.submit_button"
                  disabled={addWorkerMutation.isPending}
                >
                  {addWorkerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Add Worker
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Dashboard or complaints page
  return (
    <div className="space-y-6">
      {activePage === "dashboard" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="hero-gradient rounded-2xl p-7 text-white mb-6">
            <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
            <p className="text-white/80 text-sm">
              Welcome back, {userName}. Manage all complaints and workers.
            </p>
          </div>
        </motion.div>
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
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-3xl font-bold text-foreground">
                          {Number(s.value)}
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

      {/* Filters + Table */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">All Complaints</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  data-ocid="admin.status.select"
                  className="w-36 h-8 text-xs"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_process">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  data-ocid="admin.category.select"
                  className="w-36 h-8 text-xs"
                >
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {complaintsLoading ? (
            <div
              data-ocid="admin.complaints.loading_state"
              className="p-6 space-y-3"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !filteredComplaints.length ? (
            <div
              data-ocid="admin.complaints.empty_state"
              className="py-14 text-center"
            >
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                No complaints found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="admin.complaints.table">
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Area</TableHead>
                    <TableHead className="text-xs">Submitted By</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Worker</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((c, i) => (
                    <TableRow
                      key={c.id.toString()}
                      data-ocid={`admin.complaints.row.${i + 1}`}
                      className="border-border"
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {Number(c.id)}
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">
                        {c.title}
                      </TableCell>
                      <TableCell className="text-xs">
                        {CATEGORY_LABELS[c.category] ?? c.category}
                      </TableCell>
                      <TableCell className="text-xs">{c.area}</TableCell>
                      <TableCell className="text-xs">{c.userName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.assignedWorkerName ?? "—"}
                      </TableCell>
                      <TableCell>
                        {c.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.assign.button.${i + 1}`}
                            onClick={() => {
                              setAssignModal(c);
                              setSelectedWorker("");
                            }}
                            className="h-7 text-xs"
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Modal */}
      <Dialog
        open={!!assignModal}
        onOpenChange={(v) => !v && setAssignModal(null)}
      >
        <DialogContent data-ocid="assign.dialog">
          <DialogHeader>
            <DialogTitle>Assign Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {assignModal && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-sm">{assignModal.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {assignModal.area} · {CATEGORY_LABELS[assignModal.category]}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Select Worker</Label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger data-ocid="assign.worker.select">
                  <SelectValue placeholder="Choose a worker..." />
                </SelectTrigger>
                <SelectContent>
                  {workers?.map((w) => (
                    <SelectItem
                      key={w.principal.toString()}
                      value={w.principal.toString()}
                    >
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="assign.cancel_button"
              onClick={() => setAssignModal(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="assign.confirm_button"
              onClick={handleAssign}
              disabled={!selectedWorker || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
