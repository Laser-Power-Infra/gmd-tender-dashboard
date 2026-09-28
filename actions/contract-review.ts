"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const MAX_PAGE_SIZE = 200;
const FACET_LIMIT = 500;

export type ContractReviewRow = {
  id: string;
  [key: string]: string | string[] | null;
};

export type ContractReviewSort = {
  column: string;
  direction: "asc" | "desc";
} | null;

export type ContractReviewFilters = Record<string, string[]>;

export type ContractReviewSearch = Record<string, string>;

function clampInt(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(1, Math.trunc(n)));
}

/** Case-insensitive contains per column. Column keys never collide with filters. */
function buildSearch(
  search: ContractReviewSearch,
  skipColumn?: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [col, text] of Object.entries(search)) {
    if (!text || !text.trim() || col === skipColumn) continue;
    out[col] = { contains: text.trim(), mode: "insensitive" };
  }
  return out;
}

/**
 * AND-combines per-column filters. A value list maps to `IN`; the "(Blank)"
 * sentinel maps to null-or-empty-string. Each column contributes either one
 * plain field filter or one AND/OR group, so the keys never collide.
 */
function buildWhere(
  filters: ContractReviewFilters,
  skipColumn?: string,
): Record<string, unknown> {
  const fieldFilters: Record<string, unknown> = {};
  const groups: unknown[] = [];

  for (const [col, values] of Object.entries(filters)) {
    if (!values || values.length === 0 || col === skipColumn) continue;
    const nonBlank = values.filter((v) => v !== "(Blank)");
    const hasBlank = values.includes("(Blank)");

    const parts: unknown[] = [];
    if (nonBlank.length > 0) parts.push({ [col]: { in: nonBlank } });
    if (hasBlank) parts.push({ OR: [{ [col]: null }, { [col]: "" }] });

    if (parts.length === 0) continue;
    if (parts.length === 1) {
      const single = parts[0] as Record<string, unknown>;
      if ("OR" in single) groups.push(single);
      else Object.assign(fieldFilters, single);
    } else {
      groups.push({ AND: parts });
    }
  }

  return { ...fieldFilters, ...(groups.length > 0 ? { AND: groups } : {}) };
}

function buildOrderBy(
  sort: ContractReviewSort,
): { [key: string]: "asc" | "desc" }[] {
  if (!sort || !sort.column) return [{ contractNo: "asc" }];
  return [{ [sort.column]: sort.direction }];
}

export interface ContractReviewPageResult {
  rows: ContractReviewRow[];
  total: number;
  page: number;
  pageSize: number;
  /** Sum of balBillAgCont over the filtered set. */
  quantity: number;
}

export async function getContractReviewPage(params: {
  page: number;
  pageSize: number;
  sort: ContractReviewSort;
  filters: ContractReviewFilters;
  search: ContractReviewSearch;
}): Promise<ContractReviewPageResult> {
  const pageSize = clampInt(params.pageSize, 50, MAX_PAGE_SIZE);
  const page = clampInt(params.page, 1, Number.MAX_SAFE_INTEGER);
  const where = {
    ...buildWhere(params.filters),
    ...buildSearch(params.search),
  };

  const [rows, total, qtyRows] = await Promise.all([
    prisma.contractReview.findMany({
      where,
      orderBy: buildOrderBy(params.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contractReview.count({ where }),
    prisma.contractReview.findMany({
      where,
      select: { balBillAgCont: true },
    }),
  ]);

  let quantity = 0;
  for (const r of qtyRows) {
    if (r.balBillAgCont == null) continue;
    const n = parseFloat(String(r.balBillAgCont).replace(/[^\d.-]/g, ""));
    if (!Number.isNaN(n)) quantity += n;
  }

  return { rows: rows as unknown as ContractReviewRow[], total, page, pageSize, quantity };
}

export interface ContractReviewFacetResult {
  column: string;
  options: string[];
  overLimit: boolean;
  /** True when null/empty rows exist under the other filters. */
  hasBlank: boolean;
}

export async function getContractReviewFacet(params: {
  column: string;
  filters: ContractReviewFilters;
  search: ContractReviewSearch;
}): Promise<ContractReviewFacetResult> {
  const where = {
    ...buildWhere(params.filters, params.column),
    ...buildSearch(params.search, params.column),
  };
  const col = params.column as Prisma.ContractReviewScalarFieldEnum;

  // Single round trip: groupBy includes the null-key group, so blank
  // detection needs no second query.
  const groups = await prisma.contractReview.groupBy({
    by: [col],
    where,
    _count: { _all: true },
    orderBy: { [col]: "asc" } as Prisma.ContractReviewOrderByWithAggregationInput,
    take: FACET_LIMIT + 1,
  });

  let hasBlank = false;
  const options: string[] = [];
  for (const g of groups) {
    const v = (g as unknown as Record<string, string | null>)[col];
    if (v == null || v === "") {
      hasBlank = true;
      continue;
    }
    options.push(String(v));
  }

  return {
    column: params.column,
    options: options.slice(0, FACET_LIMIT),
    overLimit: options.length > FACET_LIMIT,
    hasBlank,
  };
}