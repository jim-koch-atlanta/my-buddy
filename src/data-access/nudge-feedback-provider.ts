import { NudgeFeedback } from '../models/nudge-feedback';
import { getUserPoolProvider } from './user-pool-provider';

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
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, user_id, nudge_id, feedback_type, notes, created_at
            FROM nudge_feedback WHERE nudge_id=$1 ORDER BY created_at DESC`, [ nudge_id ]
        );

        return this.rowsToNudgeFeedbacks(rows);
    }
}
