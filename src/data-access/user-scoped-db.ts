import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.APPUSER_USER,
    password: process.env.APPUSER_PASSWORD,
    }
);

pool.on('error', (err) => console.error('[pool] error:', err));

class UserScopedDb {
    constructor(private userId: string) { }

    async query(
        queryTextOrConfig: string,
        values?: any[],
    ) {
        // Use a single pinned connection, borrowed from the shared pool.
        const client = await pool.connect();

        try {
            // 1. Start the transaction block
            await client.query('BEGIN');

            // 2. Set your local session variable (scoped only to this transaction)
            // Always use parameterized inputs or safe variables to prevent SQL injection
            await client.query("SELECT set_config('app.current_user_id', $1, true)", [this.userId]);

            // 3. Perform queries that rely on the variable (e.g., Row-Level Security policies)
            const result = await client.query(queryTextOrConfig, values);

            // 4. Commit changes to successfully close the transaction
            await client.query('COMMIT');
            
            return result;
        } catch (error) {
            console.error(error);

            // Rollback if any step fails to clean up state
            await client.query('ROLLBACK');
            throw error;
        } finally {
            await client.release();
        }
    }
}

export const getUserDb = (userId: string) => new UserScopedDb(userId);