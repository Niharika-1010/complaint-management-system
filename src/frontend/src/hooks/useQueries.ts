import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Complaint, Stats, UserProfile, Worker } from "../backend";
import { UserRole } from "../backend";
import { useActor } from "./useActor";

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStats() {
  const { actor, isFetching } = useActor();
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor)
        return { total: 0n, pending: 0n, underProcess: 0n, completed: 0n };
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyComplaints() {
  const { actor, isFetching } = useActor();
  return useQuery<Complaint[]>({
    queryKey: ["myComplaints"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyComplaints();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllComplaints() {
  const { actor, isFetching } = useActor();
  return useQuery<Complaint[]>({
    queryKey: ["allComplaints"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllComplaints();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignedComplaints() {
  const { actor, isFetching } = useActor();
  return useQuery<Complaint[]>({
    queryKey: ["assignedComplaints"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAssignedComplaints();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWorkers() {
  const { actor, isFetching } = useActor();
  return useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["userRole"] });
    },
  });
}

export function useAssignComplaint() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      complaintId,
      workerId,
      workerName,
    }: { complaintId: bigint; workerId: string; workerName: string }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.assignComplaint(
        complaintId,
        Principal.fromText(workerId),
        workerName,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allComplaints"] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      complaintId,
      status,
    }: { complaintId: bigint; status: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateComplaintStatus(complaintId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignedComplaints"] });
      qc.invalidateQueries({ queryKey: ["allComplaints"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAddWorker() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      workerName,
    }: { workerId: string; workerName: string }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.addWorker(Principal.fromText(workerId), workerName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}
