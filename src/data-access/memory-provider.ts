import { getUserPoolProvider } from "./user-pool-provider";
import { Memory } from "../models/memory";

export class MemoryProvider {
    private static rowToMemory(row: any): Memory {
        return {
            id: row.id,
            userId: row.user_id,
            memoryType: row.memory_type,
            domain: row.domain,
            sourceType: row.source_type,
            sourceId: row.source_id,
            content: row.content,
            importance: row.importance,
            confidence: row.confidence,
            validFrom: row.valid_from,
            validUntil: row.valid_until,
            supersededBy?: row.superseded_by,
            createdAt: row.created_at,
        }
    }

    private static rowsToMemories(rows: any[]): Memory[] {
        const memories: Memory[] = [];

        for (const row of rows) {
            memories.push(this.rowToMemory(row));
        }

        return memories;
    }

    public static async getByUserId(user_id: string, limit: number | null = null): Promise<Memory[]> {
        let query = `SELECT id, user_id, memory_type, domain, source_type, source_id, content, importance, confidence, valid_from, valid_until, superseded_by, created_at
                    FROM memories WHERE user_id=$1 ORDER BY plan_date DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserPoolProvider(user_id).query(query, params);
        return this.rowsToMemories(rows);
    }

    public static async getById(user_id: string, id: string): Promise<Memory | null> {
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, user_id, memory_type, domain, source_type, source_id, content, importance, confidence, valid_from, valid_until, superseded_by, created_at
            FROM memories WHERE id=$1`, [ id ]
        );

        if (rows.length != 1) {
            return null;
        }

        return this.rowToMemory(rows[0]);
    }
}