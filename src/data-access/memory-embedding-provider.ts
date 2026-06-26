import { getUserDb } from "./user-scoped-db";
import { MemoryEmbedding, ProtoMemoryEmbedding } from "../models/memory-embedding";
import { RetrievedMemoryEmbedding } from "../buddy-ai/types";
import { MemoryFilters } from "./memory-filters/memory-filters";

export class MemoryEmbeddingProvider {

    private static rowToMemoryEmbedding(row: any): MemoryEmbedding {
        return {
            id: row.id,
            userId: row.user_id,
            memoryId: row.memory_id,
            chunkIndex: row.chunk_index,
            chunkText: row.chunk_text,
            embedding: JSON.parse(row.embedding),
            embeddingModel: row.embedding_model,
            createdAt: row.created_at,
        }
    }

    private static rowsToMemoryEmbeddings(rows: any[]): MemoryEmbedding[] {
        const embeddings: MemoryEmbedding[] = [];

        for (const row of rows) {
            embeddings.push(this.rowToMemoryEmbedding(row));
        }

        return embeddings;
    }

    public static async getByUserId(user_id: string, limit: number | null = null): Promise<MemoryEmbedding[]> {
        let query = `SELECT id, user_id, memory_id, chunk_index, chunk_text, embedding, embedding_model, created_at
                    FROM memory_embeddings WHERE user_id=$1 ORDER BY created_at DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserDb(user_id).query(query, params);
        return this.rowsToMemoryEmbeddings(rows);
    }

    public static async getById(user_id: string, id: string): Promise<MemoryEmbedding | null> {
        const { rows } = await getUserDb(user_id).query(
            `SELECT id, user_id, memory_id, chunk_index, chunk_text, embedding, embedding_model, created_at
             FROM memory_embeddings WHERE id=$1`, [ id ]
        );

        if (rows.length != 1) {
            return null;
        }

        return this.rowToMemoryEmbedding(rows[0]);
    }

    private static rowToRetrievedMemoryEmbedding(row: any): RetrievedMemoryEmbedding {
        return {
            ...this.rowToMemoryEmbedding(row),
            similarity: row.similarity,
        }
    }

    public static async getRelatedMemories(user_id: string, embeddedQuery: number[], filters: MemoryFilters, limit: number): Promise<RetrievedMemoryEmbedding[]> {
        const embeddedQueryStr: string = this.embeddingToPostgresFormat(embeddedQuery);

        let query = `
            SELECT e.id, e.user_id, e.memory_id, e.chunk_index, e.chunk_text, e.embedding, e.embedding_model, e.created_at,
                1 - (e.embedding <=> $1) AS similarity   -- friendly 0..1, higher = better
            FROM memory_embeddings e
            JOIN memories m ON m.id = e.memory_id
            WHERE (m.valid_until IS NULL OR m.valid_until > now()) AND
            e.user_id=$2`;

        let params: any[] = [ embeddedQueryStr, user_id ];
        for (const filter of filters) {
            let [clause, updatedParams] = await filter.getWhereClauseAndParams(params);
            params = updatedParams;
            query += ` AND ${clause}`;
        }

        // Ascending, smallest distance first. Reuses $1 (the query vector) from the SELECT.
        query += ` ORDER BY e.embedding <=> $1`;

        params.push(limit);
        query += ` LIMIT $${params.length}`;

        const { rows } = await getUserDb(user_id).query(query, params);
        return rows.map((row) => this.rowToRetrievedMemoryEmbedding(row));
    }

    private static embeddingToPostgresFormat(embeddedChunk: number[]): string {
        // We need to convert from array of numbers to string format. For example:
        //   [0.1234, 0.5678, 0.9012] -> "[0.1234,0.5678,0.9012]"
        return `[${embeddedChunk.join(',')}]`;
    }

    public static async create(user_id: string, memoryEmbedding: ProtoMemoryEmbedding): Promise<MemoryEmbedding> {
        const query = `
            INSERT INTO memory_embeddings (
                user_id, memory_id, chunk_index,
                chunk_text, embedding, embedding_model
            )
            VALUES($1, $2, $3, $4, $5, $6)
            RETURNING *`;

         const params: any[] =
            [
                user_id, memoryEmbedding.memoryId, memoryEmbedding.chunkIndex,
                memoryEmbedding.chunkText, this.embeddingToPostgresFormat(memoryEmbedding.embedding), memoryEmbedding.embeddingModel
            ];

        const { rows } = await getUserDb(user_id).query(query, params);

        if (rows.length == 0) {
            throw new Error(`INSERT to memory_embeddings table returned no rows.`);
        } else if (rows.length > 1) {
            console.error(`Multiple rows returned on INSERT: ${ JSON.stringify(rows)}`);
        }

        return this.rowToMemoryEmbedding(rows[0]);
   }
}