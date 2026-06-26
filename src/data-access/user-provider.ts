import { User } from '../models/user';
import { getUserDb } from './user-scoped-db';

export class UserProvider {
    public static async getUserById(id: string): Promise<User | null> {
        const { rows } = await getUserDb(id).query(
            `SELECT id, email, name, timezone, cognito_sub, email_verified, status, created_at
            FROM users WHERE id=$1`, [ id ]
        );

        if (rows.length != 1) {
            return null;
        }

        return {
            id: rows[0].id,
            email: rows[0].email,
            name: rows[0].name,
            timezone: rows[0].timezone,
            cognitoSub: rows[0].cognito_sub,
            emailVerified: rows[0].email_verified,
            status: rows[0].status,
            createdAt: rows[0].created_at
        }
    }
}