import { MemoryFilter } from "./memory-filters";

export class CreationTimeMemoryFilter implements MemoryFilter {
    private readonly days: number;

    constructor(days: number) {
        this.days = days;
    }

    async getWhereClauseAndParams(originalParams: any[]): Promise<[string, any[]]> {
        const params: any[] = [ ...originalParams, this.getNowMinusDays(this.days)];
        const clause: string = `created_at > $${params.length}`;

        return [clause, params];
    }

    private getNowMinusDays(days: number): string {
        const targetDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        return targetDate.toISOString(); 
    }
}