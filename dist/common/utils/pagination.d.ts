export interface PaginationParams {
    page: number;
    pageSize: number;
}
export interface PageMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}
export declare function getPaginationParams(query: {
    page?: unknown;
    pageSize?: unknown;
}): PaginationParams;
export declare function buildPageMeta(params: PaginationParams, total: number): PageMeta;
