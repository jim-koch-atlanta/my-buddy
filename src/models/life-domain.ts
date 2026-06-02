// Shared catalog row. NOT tenant-scoped (no user_id, no RLS).
export interface LifeDomain {
    id: string; // uuid
    name: string;
    createdAt: Date;
}
