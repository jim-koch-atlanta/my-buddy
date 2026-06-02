export interface Memory {
    id: string;
    userId: string;
    memoryType: string;
    domain: string | null;
    sourceType: string | null;
    sourceId: string | null;
    content: string;
    importance: number;
    confidence: number;
    validFrom: Date;
    validUntil: Date | null;
    supersededBy: string | null;
    createdAt: Date;
}