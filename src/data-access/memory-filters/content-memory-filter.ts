import { MemoryFilter } from "./memory-filters";

export class ContentMemoryFilter implements MemoryFilter {
    private readonly content: string;

    constructor(content: string) {
        this.content = content;
    }

    async getWhereClauseAndParams(originalParams: any[]): Promise<[string, any[]]> {
        const params: any[] = [ ...originalParams, this.content];
        const clause: string = `content LIKE $${params.length}`;

        return [clause, params];
    }
}