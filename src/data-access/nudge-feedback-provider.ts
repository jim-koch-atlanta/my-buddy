import { NewNudgeFeedback, NudgeFeedback } from '../models/nudge-feedback';
import { getUserDb } from './user-scoped-db';

export class NudgeFeedbackProvider {
    private static rowToNudgeFeedback(row: any): NudgeFeedback {
        return {
            id: row.id,
            userId: row.user_id,
            nudgeId: row.nudge_id,
            feedbackType: row.feedback_type,
            notes: row.notes,
            createdAt: row.created_at
        }
    }

    private static rowsToNudgeFeedbacks(rows: any[]): NudgeFeedback[] {
        const nudgeFeedbacks: NudgeFeedback[] = [];

        for (const row of rows) {
            nudgeFeedbacks.push(this.rowToNudgeFeedback(row));
        }

        return nudgeFeedbacks;
    }

    public static async getByNudgeId(user_id: string, nudge_id: string): Promise<NudgeFeedback[]> {
        const { rows } = await getUserDb(user_id).query(
            `SELECT id, user_id, nudge_id, feedback_type, notes, created_at
            FROM nudge_feedback WHERE nudge_id=$1 ORDER BY created_at DESC`, [ nudge_id ]
        );

        return this.rowsToNudgeFeedbacks(rows);
    }

    public static async create(user_id: string, nudgeFeedback: NewNudgeFeedback) : Promise<NudgeFeedback> {
        const query = `
            INSERT INTO nudge_feedback (
                user_id, nudge_id, feedback_type, notes
            )
            VALUES($1, $2, $3, $4)
            RETURNING *`;

         const params: any[] =
            [
                user_id, nudgeFeedback.nudgeId, nudgeFeedback.feedbackType, nudgeFeedback.notes
            ];

        const { rows } = await getUserDb(user_id).query(query, params);

        if (rows.length == 0) {
            throw new Error(`INSERT to nudge_feedback table returned no rows.`);
        } else if (rows.length > 1) {
            console.error(`Multiple rows returned on INSERT: ${ JSON.stringify(rows)}`);
        }

        return this.rowToNudgeFeedback(rows[0]);
    }
}
