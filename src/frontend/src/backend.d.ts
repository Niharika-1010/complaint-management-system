import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Stats {
    total: bigint;
    pending: bigint;
    completed: bigint;
    underProcess: bigint;
}
export interface ComplaintRequest {
    title: string;
    area: string;
    description: string;
    category: Category;
    photo?: ExternalBlob;
}
export interface Complaint {
    id: bigint;
    status: string;
    userName: string;
    title: string;
    area: string;
    userId: Principal;
    createdAt: bigint;
    description: string;
    assignedWorkerId?: Principal;
    updatedAt: bigint;
    category: string;
    photo?: ExternalBlob;
    assignedWorkerName?: string;
}
export interface Worker {
    principal: Principal;
    name: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum Category {
    other = "other",
    drainage = "drainage",
    garbage = "garbage",
    electricity = "electricity",
    road_damage = "road_damage",
    water_leakage = "water_leakage"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addWorker(workerId: Principal, workerName: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignComplaint(complaintId: bigint, workerId: Principal, workerName: string): Promise<void>;
    getAllComplaints(): Promise<Array<Complaint>>;
    getAssignedComplaints(): Promise<Array<Complaint>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComplaintById(id: bigint): Promise<Complaint | null>;
    getComplaintsByCategory(category: Category): Promise<Array<Complaint>>;
    getMyComplaints(): Promise<Array<Complaint>>;
    getStats(): Promise<Stats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkers(): Promise<Array<Worker>>;
    isCallerAdmin(): Promise<boolean>;
    removeWorker(workerId: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegister(): Promise<void>;
    submitComplaint(request: ComplaintRequest): Promise<bigint>;
    updateComplaintStatus(complaintId: bigint, status: string): Promise<void>;
}
