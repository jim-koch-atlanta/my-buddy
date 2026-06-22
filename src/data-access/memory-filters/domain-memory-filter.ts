import { MemoryFilter } from "./memory-filters";

export class DomainMemoryFilter implements MemoryFilter {
    private readonly domain: string;

    constructor(domain: string) {
        this.domain = domain;
    }

    async getWhereClauseAndParams(originalParams: any[]): Promise<[string, any[]]> {
        const params: any[] = [ ...originalParams, this.domain];
        const clause: string = `domain = $${params.length}`;

        return [clause, params];
    }
}