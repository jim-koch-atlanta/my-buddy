// What a caller provides at create.
export interface NewMemory {
    memoryType: string;
    domain: string | null;
    sourceType: string | null;
    sourceId: string | null;
    content: string;
    importance: number;
    confidence: number;
    validFrom: Date;
    validUntil: Date | null;
}

// Everything insertable.
export interface ProtoMemory extends NewMemory {
    supersededBy: string | null;
}

// Full row, the read shape.
export interface Memory extends ProtoMemory {
    userId: string;
    id: string;
    createdAt: Date;
}