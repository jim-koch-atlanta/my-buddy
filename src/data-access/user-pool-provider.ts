import { Pool, PoolConfig, QueryConfig, QueryConfigValues, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

export interface UserPoolConfig extends PoolConfig {
    userId: string
}

class UserPool extends Pool {
    private userId: string;

    constructor(config: UserPoolConfig) {
        super(config);
        this.userId = config?.userId;
    }

    async query<R extends QueryResultRow = any, I = any[]>(
        queryTextOrConfig: string | QueryConfig<I>,
        values?: QueryConfigValues<I>,
    ): Promise<QueryResult<R>> {

        // Use a single pinned connection.
        const client = await this.connect();

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

dotenv.config();

export const getUserPoolProvider = (userId: string) => {
    const userPool = new UserPool({
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DATABASE,
        port: Number(process.env.POSTGRES_PORT),
        user: process.env.APPUSER_USER,
        password: process.env.APPUSER_PASSWORD,
        userId: userId,
    });

    // Observability: a Pool emits 'error' for failures on idle clients and for
    // connection-level problems. Without a listener these can crash the process
    // with no context; this prints the full error to the console.
    userPool.on('error', (err) => {
        console.error('[UserPool] pool error:', err);
    });

    return userPool;
}
