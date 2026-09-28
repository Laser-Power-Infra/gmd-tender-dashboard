"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, Eraser, ChevronDown, ChevronUp } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  loadContractReviewPage,
  loadContractReviewFacet,
  setPage,
  setPageSize,
  setSort,
  toggleFilter,
  clearFilter,
  clearAllFilters,
  setColumnSearch,
} from "@/lib/slices/contractReviewSlice";
import "@/app/SupplyHistory.css";
import "@/components/TenderTable.css";
import {
  CONTRACT_REVIEW_COLUMN_GROUPS,
  GROUP_HEADER_TO_ACCESSOR,
  type ContractReviewColumn,
} from "@/lib/contractReviewColumns";

type Column = ContractReviewColumn;

const COLUMNS: Column[] = [
  { header: "Contract / PO NO", accessor: "grp-0", defaultWidth: 240, sticky: true, children: CONTRACT_REVIEW_COLUMN_GROUPS[0].children },
  { header: "Item Code", accessor: "itemCode", defaultWidth: 120, sortable: true },
  { header: "MC No", accessor: "mcNo", defaultWidth: 110 },
  { header: "Item Names/Party Item Names", accessor: "grp-1", defaultWidth: 300, children: CONTRACT_REVIEW_COLUMN_GROUPS[1].children },
  { header: "CV", accessor: "cv", defaultWidth: 100 },
  { header: "Order Qty", accessor: "orderQty", defaultWidth: 110, align: "right" },
  { header: "Free Stock", accessor: "freeStock", defaultWidth: 110, align: "right" },
  { header: "Final Req", accessor: "finalReq", defaultWidth: 110, align: "right" },
  { header: "MC Qty", accessor: "mcQty", defaultWidth: 100, align: "right" },
  { header: "Balance MC", accessor: "balanceMc", defaultWidth: 110, align: "right" },
  { header: "Prod Ord Qty", accessor: "prodOrdQty", defaultWidth: 120, align: "right" },
  { header: "Balance To Prod Ord", accessor: "balanceToProdOrd", defaultWidth: 140, align: "right" },
  { header: "Balance To Prod Ent", accessor: "balanceToProdEnt", defaultWidth: 140, align: "right" },
  { header: "DI Qty", accessor: "diQty", defaultWidth: 100, align: "right" },
  { header: "Billed Qty", accessor: "billedQty", defaultWidth: 110, align: "right" },
  { header: "Bal Bill Ag MC", accessor: "balBillAgMc", defaultWidth: 120, align: "right" },
  { header: "Bal Bill Ag Cont", accessor: "balBillAgCont", defaultWidth: 130, align: "right" },
  { header: "Item / Size / PN RATING", accessor: "grp-2", defaultWidth: 340, children: CONTRACT_REVIEW_COLUMN_GROUPS[2].children },
  { header: "Date Of Contract", accessor: "dateOfContract", defaultWidth: 140, align: "center" },
  { header: "Clearance Status", accessor: "clearanceStatus", defaultWidth: 150 },
  { header: "Actuator / RM Code for Actuator", accessor: "grp-3", defaultWidth: 260, children: CONTRACT_REVIEW_COLUMN_GROUPS[3].children },
  { header: "RM Code For GB", accessor: "rmCodeForGb", defaultWidth: 140 },
  { header: "Payment Terms", accessor: "paymentTerms", defaultWidth: 140 },
  { header: "LC / RTGS / Issuing bank name", accessor: "grp-4", defaultWidth: 420, children: CONTRACT_REVIEW_COLUMN_GROUPS[4].children },
  { header: "BOM Formula Trial", accessor: "bomFormulaTrial", defaultWidth: 150 },
  { header: "ERP Party Name", accessor: "erpPartyNameFromGmdSupplyHistory", defaultWidth: 200 },
  { header: "Item Type", accessor: "itemType", defaultWidth: 110 },
  { header: "Job Code", accessor: "jobCode", defaultWidth: 120 },
  { header: "Bal DI Qty", accessor: "balDiQty", defaultWidth: 110, align: "right" },
  { header: "Bal MC Val", accessor: "balMcVal", defaultWidth: 120, align: "right" },
  { header: "Bal Prod Ord Val", accessor: "balProdOrdVal", defaultWidth: 130, align: "right" },
  { header: "Bal To Prod Ent Val", accessor: "balToProdOrdEntVal", defaultWidth: 150, align: "right" },
  { header: "Bal Bill Ag MC Val", accessor: "balBillAgMcVal", defaultWidth: 140, align: "right" },
  { header: "Bal Bill Ag Cont Val", accessor: "balBillAgContVal", defaultWidth: 150, align: "right" },
  { header: "Bal DI Val", accessor: "balDiVal", defaultWidth: 120, align: "right" },
  { header: "DI Val", accessor: "diVal", defaultWidth: 110, align: "right" },
  { header: "IC Qty", accessor: "icQty", defaultWidth: 100, align: "right" },
  { header: "BOM Id", accessor: "bomId", defaultWidth: 100 },
  { header: "Status", accessor: "status", defaultWidth: 120 },
  { header: "MC Received Pending", accessor: "mcReceivedPending", defaultWidth: 160 },
  { header: "Inspection", accessor: "inspection", defaultWidth: 120 },
  { header: "Offer Pending Done", accessor: "offerPendingDone", defaultWidth: 150 },
  { header: "Remarks", accessor: "remarks", defaultWidth: 200 },
  { header: "Cost From Quotation", accessor: "costfromQuotation", defaultWidth: 150 },
  { header: "Production Order No", accessor: "productionOrderNumber", defaultWidth: 150 },
];

function DebouncedColumnSearch({
  accessor,
  value,
  placeholder,
}: {
  accessor: string;
  value: string;
  placeholder: string;
}) {
  const dispatch = useAppDispatch();
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (val: string) => {
    setLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Only search from 3 chars; shorter input clears the column filter.
      dispatch(setColumnSearch({ accessor, value: val.trim().length >= 3 ? val : "" }));
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      type="text"
      className="column-search-input"
      placeholder={placeholder}
      value={local}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}

function SidebarFilter({ accessor, label }: { accessor: string; label: string }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.contractReview.filters);
  const facets = useAppSelector((s) => s.contractReview.facets);
  const searches = useAppSelector((s) => s.contractReview.searches);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) dispatch(loadContractReviewFacet({ column: accessor, filters, search: searches }));
  }, [open, filters, searches, accessor, dispatch]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedCount = filters[accessor]?.length ?? 0;

  return (
    <div ref={ref} style={{ marginBottom: 12, position: "relative" }}>
      <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", color: "#333", border: "none", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        <span>{selectedCount > 0 ? `${selectedCount} Selected` : "All"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {selectedCount > 0 && (
            <span style={{ background: "var(--color-brand)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{selectedCount}</span>
          )}
          <ChevronDown size={12} />
        </span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, marginTop: 2, maxHeight: 260, overflowY: "auto", boxShadow: "0 6px 16px rgba(0,0,0,0.2)" }}>
          <div className="multiselect-actions">
            <button className="multiselect-action-btn" onClick={() => dispatch(clearFilter(accessor))}>Clear All</button>
            <button
              className="multiselect-action-btn"
              onClick={() => {
                const opts = (facets[accessor]?.options ?? []).slice();
                if (facets[accessor]?.hasBlank) opts.push("(Blank)");
                opts.forEach((v) => {
                  const cur = filters[accessor] ?? [];
                  if (!cur.includes(v)) dispatch(toggleFilter({ column: accessor, value: v }));
                });
              }}
            >
              Select All
            </button>
          </div>
          <div className="multiselect-options-list">
            {facets[accessor]?.status === "loading" && (
              <div style={{ padding: 8, fontSize: 12, color: "#888" }}>Loading options...</div>
            )}
            {facets[accessor]?.status === "error" && (
              <div style={{ padding: 8, fontSize: 12, color: "#c5221f" }}>Failed to load options</div>
            )}
            {(facets[accessor]?.options ?? []).map((val) => (
              <label key={val} className="multiselect-option-label">
                <input
                  type="checkbox"
                  checked={filters[accessor]?.includes(val) ?? false}
                  onChange={() => dispatch(toggleFilter({ column: accessor, value: val }))}
                />
                <span title={val}>{val}</span>
              </label>
            ))}
            {facets[accessor]?.hasBlank && (
              <label className="multiselect-option-label">
                <input
                  type="checkbox"
                  checked={filters[accessor]?.includes("(Blank)") ?? false}
                  onChange={() => dispatch(toggleFilter({ column: accessor, value: "(Blank)" }))}
                />
                <span>(Blank)</span>
              </label>
            )}
            {facets[accessor]?.overLimit && (
              <div style={{ padding: "6px 8px", fontSize: 11, color: "#888" }}>
                Only first {facets[accessor]?.options.length} values shown
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractReviewPage() {
  const dispatch = useAppDispatch();
  const { rows, total, page, pageSize, sort, filters, searches, facets, status, error, quantity } =
    useAppSelector((s) => s.contractReview);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    COLUMNS.forEach((c) => (m[c.accessor] = c.defaultWidth));
    return m;
  });

  const resizingColumnRef = useRef<string | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(loadContractReviewPage({ page, pageSize, sort, filters, search: searches }));
  }, [dispatch, page, pageSize, sort, filters, searches]);

  useEffect(() => {
    if (openDropdown) {
      dispatch(loadContractReviewFacet({ column: openDropdown, filters, search: searches }));
    }
  }, [dispatch, openDropdown, filters, searches]);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      const el = dropdownRefs.current[openDropdown];
      if (el && !el.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const handleResizeStart = (e: React.MouseEvent, accessor: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColumnRef.current = accessor;
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    const onMove = (ev: MouseEvent) => {
      if (!resizingColumnRef.current) return;
      const diff = ev.clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + diff);
      setColumnWidths((prev) => ({ ...prev, [resizingColumnRef.current!]: newWidth }));
    };
    const onUp = () => {
      resizingColumnRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "default";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
  };

  const handleSort = (col: Column) => {
    if (!col.sortable) return;
    if (sort?.column === col.accessor) {
      dispatch(setSort({ column: col.accessor, direction: sort.direction === "asc" ? "desc" : "asc" }));
    } else {
      dispatch(setSort({ column: col.accessor, direction: "desc" }));
    }
  };

  const stickyLeftOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let acc = 0;
    for (const col of COLUMNS) {
      if (col.sticky) {
        offsets[col.accessor] = acc;
        acc += columnWidths[col.accessor] ?? col.defaultWidth;
      }
    }
    return offsets;
  }, [columnWidths]);

  const totalPages = Math.ceil(total / pageSize) || 1;
  const activePage = Math.min(page, totalPages);

  if (status === "loading" && rows.length === 0) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "500px", color: "var(--color-brand)", fontWeight: 700, flexDirection: "column", gap: "15px" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #e1e6eb", borderTopColor: "var(--color-brand-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
        <span style={{ fontSize: "16px", letterSpacing: "0.5px" }}>Loading Contract Review...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "12px" }}>
        <p style={{ color: "#c5221f", fontWeight: 600 }}>Failed to load Contract Review: {error}</p>
        <button onClick={() => dispatch(loadContractReviewPage({ page, pageSize, sort, filters, search: searches }))} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "var(--color-brand)", color: "white", borderRadius: "6px", fontWeight: 600 }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="supply-layout-container" style={{ height: "calc(100vh - 42px)" }}>
      <aside className="supply-sidebar" style={{ position: "relative", zIndex: 20 }}>
        <div className="supply-sidebar-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Contract Review</span>
          <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.12)", padding: "2px 6px", borderRadius: "10px" }}>{total} rows</span>
        </div>
        <div className="supply-sidebar-body">
          <SidebarFilter accessor="status" label="Status" />
          <SidebarFilter accessor="clearanceStatus" label="Clearance Status" />
          <SidebarFilter accessor="item" label="Item" />
          <SidebarFilter accessor="size" label="Size" />
          <SidebarFilter accessor="pnRating" label="PN Rating" />
          <SidebarFilter accessor="mcReceivedPending" label="MC Received/Pending" />
          <SidebarFilter accessor="inspection" label="Inspection" />
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 14px", marginTop: 4 }}>
            <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Quantity</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 4 }}>{quantity.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </aside>

      <div className="supply-workspace">
        <main className="supply-body" style={{ padding: "12px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="tender-table-container" style={{ flex: 1, minHeight: 0 }}>
              <div className="tender-table-toolbar">
                <div className="toolbar-left">
                  <h2 className="table-title">CONTRACT REVIEW</h2>
                  <span className="record-count-badge" style={{ background: "#fff", color: "var(--color-brand)" }}>{total} Records</span>
                </div>
                <div className="toolbar-right">
                  {sort && (
                    <button className="export-btn" onClick={() => dispatch(setSort(null))}>
                      Clear Sort
                    </button>
                  )}
                  <button className="export-btn" onClick={() => dispatch(clearAllFilters())} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Eraser size={14} /> Clear Filters
                  </button>
                </div>
              </div>

              <div className="tender-table-wrapper" ref={scrollContainerRef} style={{ maxHeight: "none" }}>
                <table className="tender-data-table">
                  <thead>
                    <tr>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.accessor}
                          className={col.sticky ? "sticky-col" : undefined}
                          style={{
                            width: `${columnWidths[col.accessor]}px`,
                            minWidth: `${columnWidths[col.accessor]}px`,
                            ...(col.sticky ? { left: stickyLeftOffsets[col.accessor], zIndex: openDropdown === col.accessor ? 100 : 3 } : {}),
                            ...(openDropdown === col.accessor || (col.children && col.children.some((c) => GROUP_HEADER_TO_ACCESSOR[c.header] === openDropdown)) ? { zIndex: 100 } : {}),
                          }}
                        >
                          <div className="header-content" onClick={() => handleSort(col)} style={{ cursor: col.sortable ? "pointer" : "default" }}>
                            <span>{col.header}</span>
                            {sort?.column === col.accessor && (
                              <span className="sort-indicator" style={{ display: "inline-flex", alignItems: "center" }}>
                                {sort.direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </span>
                            )}
                          </div>
                          {col.children
                            ? col.children.map((child) => {
                                const childAccessor = GROUP_HEADER_TO_ACCESSOR[child.header];
                                return (
                                  <div key={child.header}>
                                  <div
                                    className="custom-multiselect-container"
                                    ref={(el) => { dropdownRefs.current[childAccessor] = el; }}
                                  >
                                    <button
                                      className="multiselect-trigger-btn"
                                      onClick={() => setOpenDropdown(openDropdown === childAccessor ? null : childAccessor)}
                                    >
                                      {(!filters[childAccessor] || filters[childAccessor].length === 0)
                                        ? child.label
                                        : `${filters[childAccessor].length} Selected`}
                                      <span className="dropdown-arrow" style={{ display: "inline-flex", alignItems: "center" }}><ChevronDown size={12} /></span>
                                    </button>
                                    {openDropdown === childAccessor && (
                                      <div className="multiselect-dropdown-panel">
                                        <div className="multiselect-actions">
                                          <button className="multiselect-action-btn" onClick={() => dispatch(clearFilter(childAccessor))}>Clear All</button>
                                          <button
                                            className="multiselect-action-btn"
                                            onClick={() => {
                                              const opts = (facets[childAccessor]?.options ?? []).slice();
                                              if (facets[childAccessor]?.hasBlank) opts.push("(Blank)");
                                              opts.forEach((v) => {
                                                const cur = filters[childAccessor] ?? [];
                                                if (!cur.includes(v)) dispatch(toggleFilter({ column: childAccessor, value: v }));
                                              });
                                            }}
                                          >
                                            Select All
                                          </button>
                                        </div>
                                        <div className="multiselect-options-list">
                                          {facets[childAccessor]?.status === "loading" && (
                                            <div style={{ padding: "8px", fontSize: "12px", color: "#888" }}>Loading options...</div>
                                          )}
                                          {facets[childAccessor]?.status === "error" && (
                                            <div style={{ padding: "8px", fontSize: "12px", color: "#c5221f" }}>Failed to load options</div>
                                          )}
                                          {(facets[childAccessor]?.options ?? []).map((val) => (
                                            <label key={val} className="multiselect-option-label">
                                              <input
                                                type="checkbox"
                                                checked={filters[childAccessor]?.includes(val) ?? false}
                                                onChange={() => dispatch(toggleFilter({ column: childAccessor, value: val }))}
                                              />
                                              <span title={val}>{val}</span>
                                            </label>
                                          ))}
                                          {facets[childAccessor]?.hasBlank && (
                                            <label className="multiselect-option-label">
                                              <input
                                                type="checkbox"
                                                checked={filters[childAccessor]?.includes("(Blank)") ?? false}
                                                onChange={() => dispatch(toggleFilter({ column: childAccessor, value: "(Blank)" }))}
                                              />
                                              <span>(Blank)</span>
                                            </label>
                                          )}
                                          {facets[childAccessor]?.overLimit && (
                                            <div style={{ padding: "6px 8px", fontSize: "11px", color: "#888" }}>
                                              Only first {facets[childAccessor]?.options.length} values shown
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <DebouncedColumnSearch
                                    accessor={childAccessor}
                                    value={searches[childAccessor] ?? ""}
                                    placeholder={`Search ${child.label.replace(/\s*-\s*$/, "").trim()}...`}
                                  />
                                  </div>
                                );
                              })
                            : (
                          <div
                            className="custom-multiselect-container"
                            ref={(el) => { dropdownRefs.current[col.accessor] = el; }}
                          >
                            <button
                              className="multiselect-trigger-btn"
                              onClick={() => setOpenDropdown(openDropdown === col.accessor ? null : col.accessor)}
                            >
                              {(!filters[col.accessor] || filters[col.accessor].length === 0)
                                ? `All ${col.header}`
                                : `${filters[col.accessor].length} Selected`}
                              <span className="dropdown-arrow" style={{ display: "inline-flex", alignItems: "center" }}><ChevronDown size={12} /></span>
                            </button>
                            {openDropdown === col.accessor && (
                              <div className="multiselect-dropdown-panel">
                                <div className="multiselect-actions">
                                  <button className="multiselect-action-btn" onClick={() => dispatch(clearFilter(col.accessor))}>Clear All</button>
                                  <button
                                    className="multiselect-action-btn"
                                    onClick={() => {
                                      const opts = (facets[col.accessor]?.options ?? []).slice();
                                      if (facets[col.accessor]?.hasBlank) opts.push("(Blank)");
                                      opts.forEach((v) => {
                                        const cur = filters[col.accessor] ?? [];
                                        if (!cur.includes(v)) dispatch(toggleFilter({ column: col.accessor, value: v }));
                                      });
                                    }}
                                  >
                                    Select All
                                  </button>
                                </div>
                                <div className="multiselect-options-list">
                                  {facets[col.accessor]?.status === "loading" && (
                                    <div style={{ padding: "8px", fontSize: "12px", color: "#888" }}>Loading options...</div>
                                  )}
                                  {facets[col.accessor]?.status === "error" && (
                                    <div style={{ padding: "8px", fontSize: "12px", color: "#c5221f" }}>Failed to load options</div>
                                  )}
                                  {(facets[col.accessor]?.options ?? []).map((val) => (
                                    <label key={val} className="multiselect-option-label">
                                      <input
                                        type="checkbox"
                                        checked={filters[col.accessor]?.includes(val) ?? false}
                                        onChange={() => dispatch(toggleFilter({ column: col.accessor, value: val }))}
                                      />
                                      <span title={val}>{val}</span>
                                    </label>
                                  ))}
                                  {facets[col.accessor]?.hasBlank && (
                                    <label className="multiselect-option-label">
                                      <input
                                        type="checkbox"
                                        checked={filters[col.accessor]?.includes("(Blank)") ?? false}
                                        onChange={() => dispatch(toggleFilter({ column: col.accessor, value: "(Blank)" }))}
                                      />
                                      <span>(Blank)</span>
                                    </label>
                                  )}
                                  {facets[col.accessor]?.overLimit && (
                                    <div style={{ padding: "6px 8px", fontSize: "11px", color: "#888" }}>
                                      Only first {facets[col.accessor]?.options.length} values shown
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          )}
                          {!col.children && (
                                <DebouncedColumnSearch
                                  accessor={col.accessor}
                                  value={searches[col.accessor] ?? ""}
                                  placeholder={`Search ${col.header}...`}
                                />
                              )}
                          <div className="column-resizer" onMouseDown={(e) => handleResizeStart(e, col.accessor, columnWidths[col.accessor])} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length} style={{ textAlign: "center", padding: "40px", color: "rgba(0,0,0,0.4)" }}>
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={String(row.id)} className="tender-row">
                          {COLUMNS.map((col) => {
                            if (col.children) {
                              return (
                                <td
                                  key={col.accessor}
                                  className={`${col.sticky ? "sticky-col" : ""}`}
                                  style={col.sticky ? { left: stickyLeftOffsets[col.accessor], background: "#fff" } : {}}
                                >
                                  <div className="cell-scroll-wrap" style={{ height: "auto", maxHeight: "96px", overflowY: "auto", overflowX: "auto" }}>
                                    {col.children.map((child) => {
                                      const accessor = GROUP_HEADER_TO_ACCESSOR[child.header];
                                      const raw = accessor ? (row as Record<string, unknown>)[accessor] : undefined;
                                      const value = raw == null || String(raw).trim() === "" ? "-" : String(raw);
                                      return (
                                        <div key={child.header} style={{ display: "flex", alignItems: "flex-start", marginBottom: "2px" }}>
                                          <span style={{ color: "#8a919a", flexShrink: 0, marginRight: "4px", whiteSpace: "nowrap" }}>{child.label}</span>
                                          <span style={{ border: "1px solid #e5e7eb", borderRadius: "4px", padding: "2px 4px", whiteSpace: "normal", wordBreak: "break-word", minWidth: 0, flex: 1, lineHeight: 1.4 }}>
                                            {value === "-" ? <span style={{ color: "#b0b8c1" }}>-</span> : value}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            }
                            const raw = (row as Record<string, unknown>)[col.accessor];
                            const display = raw == null || String(raw).trim() === "" ? "-" : String(raw);
                            const alignClass = col.align === "right" ? "col-currency" : col.align === "center" ? "col-center" : "";
                            return (
                              <td
                                key={col.accessor}
                                className={`${alignClass} ${col.sticky ? "sticky-col" : ""}`}
                                style={col.sticky ? { left: stickyLeftOffsets[col.accessor], background: "#fff" } : {}}
                                title={display}
                              >
                                <div className="cell-scroll-wrap" style={{ height: "auto", maxHeight: "96px", overflowY: "auto", overflowX: "auto", whiteSpace: "nowrap" }}>
                                  {display === "-" ? <span style={{ color: "#b0b8c1" }}>{display}</span> : display}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="tender-table-footer">
                <div className="footer-left">
                  <span>Rows per page:</span>
                  <select className="rows-per-page-select" value={pageSize} onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <div className="footer-center">
                  {total === 0 ? "No records" : `${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, total)} of ${total}`}
                </div>
                <div className="footer-right">
                  <button className="page-btn" disabled={activePage <= 1} onClick={() => dispatch(setPage(activePage - 1))}>Prev</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (activePage <= 4) pageNum = i + 1;
                    else if (activePage >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = activePage - 3 + i;
                    return (
                      <button key={pageNum} className={`page-btn ${activePage === pageNum ? "active" : ""}`} onClick={() => dispatch(setPage(pageNum))}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button className="page-btn" disabled={activePage >= totalPages} onClick={() => dispatch(setPage(activePage + 1))}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}