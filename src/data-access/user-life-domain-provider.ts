import { UserLifeDomain } from '../models/user-life-domain';
import { getUserPoolProvider } from './user-pool-provider';

export class UserLifeDomainProvider {
    private static rowToUserLifeDomain(row: any): UserLifeDomain {
        return {
            userId: row.user_id,
            lifeDomainId: row.life_domain_id,
            priority: row.priority,
            desiredCadenceDays: row.desired_cadence_days,
            maxNudgesPerWeek: row.max_nudges_per_week,
            emotionalLoadTolerance: row.emotional_load_tolerance,
            allowedReminderStart: row.allowed_reminder_start,
            allowedReminderEnd: row.allowed_reminder_end,
            enabled: row.enabled,
            createdAt: row.created_at
        }
    }

    private static rowsToUserLifeDomains(rows: any[]): UserLifeDomain[] {
        const userLifeDomains: UserLifeDomain[] = [];

        for (const row of rows) {
            userLifeDomains.push(this.rowToUserLifeDomain(row));
        }

        return userLifeDomains;
    }

    public static async getByUserId(user_id: string): Promise<UserLifeDomain[]> {
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT user_id, life_domain_id, priority, desired_cadence_days, max_nudges_per_week,
                    emotional_load_tolerance, allowed_reminder_start, allowed_reminder_end, enabled, created_at
            FROM user_life_domains WHERE user_id=$1`, [ user_id ]
        );

        return this.rowsToUserLifeDomains(rows);
    }
}
