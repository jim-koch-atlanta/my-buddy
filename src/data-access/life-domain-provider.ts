import { LifeDomain } from '../models/life-domain';
import { getUserPoolProvider } from './user-pool-provider';

// life_domains is a SHARED catalog: no user_id, no RLS. The userId argument is used
// ONLY to obtain a database connection via getUserPoolProvider — these queries are
// unaffected by the tenant context because the table has no RLS policy.
export class LifeDomainProvider {
    private static rowToLifeDomain(row: any): LifeDomain {
        return {
            id: row.id,
            name: row.name,
            createdAt: row.created_at
        }
    }

    private static rowsToLifeDomains(rows: any[]): LifeDomain[] {
        const lifeDomains: LifeDomain[] = [];

        for (const row of rows) {
            lifeDomains.push(this.rowToLifeDomain(row));
        }

        return lifeDomains;
    }

    public static async getAll(user_id: string): Promise<LifeDomain[]> {
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, name, created_at
            FROM life_domains ORDER BY name`
        );

        return this.rowsToLifeDomains(rows);
    }

    public static async getByName(user_id: string, name: string): Promise<LifeDomain | null> {
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, name, created_at
            FROM life_domains WHERE name=$1`, [ name ]
        );

        if (rows.length != 1) {
            return null;
        }

        return this.rowToLifeDomain(rows[0]);
    }
}
