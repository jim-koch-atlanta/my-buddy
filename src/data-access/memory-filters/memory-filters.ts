export interface MemoryFilter {
  getWhereClauseAndParams(currentParams: any[]): Promise<[string, any[]]>;
};

export type MemoryFilters = MemoryFilter[];
