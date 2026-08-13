"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
exports.buildPageMeta = buildPageMeta;
function getPaginationParams(query) {
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize ?? '20'), 10) || 20));
    return { page, pageSize };
}
function buildPageMeta(params, total) {
    const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize);
    return {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages,
        hasMore: params.page < totalPages,
    };
}
//# sourceMappingURL=pagination.js.map