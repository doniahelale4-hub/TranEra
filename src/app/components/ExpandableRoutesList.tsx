import { useState } from "react";
import { Search, Calendar, ChevronDown, CheckSquare, Trash2, Play, Download, X, CheckCheck, AlertTriangle } from "lucide-react";

type Route = {
  code: string;
  name: string;
  meta: string;
  total: number;
  collected: number;
  startDate: string;
  endDate: string;
  selected?: boolean;
};

const fmt = (n: number) => n.toLocaleString("en-US");

type Props = {
  routes: Route[];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (name: string) => void;
};

type ConfirmAction = "delete" | "export" | null;

function ConfirmDialog({
  action,
  count,
  onConfirm,
  onCancel,
}: {
  action: ConfirmAction;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!action) return null;

  const isDelete = action === "delete";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ boxShadow: "0 24px 48px -12px rgba(15,23,43,0.22), 0 0 0 1px rgba(15,23,43,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon header */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isDelete ? "bg-rose-50" : "bg-blue-50"
            }`}
          >
            {isDelete ? (
              <AlertTriangle className="w-6 h-6 text-rose-500" strokeWidth={1.75} />
            ) : (
              <Download className="w-6 h-6 text-blue-500" strokeWidth={1.75} />
            )}
          </div>
          <h3 className="text-[17px] font-semibold text-[#0f172b] tracking-[-0.3px]">
            {isDelete ? "Delete routes?" : "Export routes?"}
          </h3>
          <p className="text-[14px] text-[#62748e] mt-1.5 leading-[20px]">
            {isDelete
              ? `This will permanently remove ${count} route${count === 1 ? "" : "s"} and all associated session data. This action cannot be undone.`
              : `This will export ${count} route${count === 1 ? "" : "s"} to a file. Make sure collected data is uploaded before exporting.`}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#f1f5f9] mx-6" />

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-[40px] rounded-[10px] border border-[#e2e8f0] bg-white text-[14px] font-medium text-[#45556c] hover:bg-[#f8fafc] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-[40px] rounded-[10px] text-[14px] font-semibold text-white transition-all shadow-sm ${
              isDelete
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isDelete ? `Delete ${count} route${count === 1 ? "" : "s"}` : `Export ${count} route${count === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExpandableRoutesList({ routes, search, onSearch, onSelect }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [checkedNames, setCheckedNames] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  function toggle(name: string) {
    setExpanded((prev) => (prev === name ? null : name));
  }

  function toggleCheck(name: string) {
    setCheckedNames((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleSelectAll() {
    if (checkedNames.size === routes.length) {
      setCheckedNames(new Set());
    } else {
      setCheckedNames(new Set(routes.map((r) => r.name)));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setCheckedNames(new Set());
  }

  function handleConfirm() {
    // Action confirmed — clear selection and exit select mode
    setConfirmAction(null);
    exitSelectMode();
  }

  const allChecked = routes.length > 0 && checkedNames.size === routes.length;
  const someChecked = checkedNames.size > 0;

  return (
    <div
      className="bg-white relative rounded-[14px] w-full max-h-[calc(100vh-190px)] overflow-hidden flex flex-col"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)" }}
    >
      {/* outer border overlay */}
      <div
        aria-hidden
        className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[14px]"
      />

      <div className="flex flex-col gap-4 items-start pt-[21px] px-[21px] relative rounded-[inherit] w-full h-full min-h-0 overflow-hidden">
        {/* Header row — search replaces the title */}
        <div className="flex h-11 items-center gap-3 w-full shrink-0">
          {/* Full-width search */}
          <div className="relative h-[38px] flex-1 group">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-[14px] h-[14px] text-[#90a1b9]" strokeWidth={1.75} />
            </div>
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search routes by name, code, area…"
              className="absolute inset-0 bg-white rounded-[10px] border border-[#e2e8f0] pl-[34px] pr-[34px] py-[9px] text-[14px] text-[#0f172b] placeholder:text-[#90a1b9] tracking-[-0.15px] focus:outline-none focus:border-[#93c5fd] focus:ring-2 focus:ring-[#dbeafe] focus:bg-white transition-all duration-150 w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearch("")}
                aria-label="Clear search"
                className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-[#62748e] transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Count chip */}
          <span className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-full bg-[#eff6ff] text-[#1d4ed8] text-[11px] font-semibold tabular-nums shrink-0">
            {routes.length}
          </span>

          {/* Select / Cancel button */}
          {!selectMode ? (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 h-[38px] px-3.5 rounded-[10px] border border-[#e2e8f0] bg-white text-[13px] font-medium text-[#45556c] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all shrink-0"
            >
              <CheckSquare className="w-[14px] h-[14px] text-[#62748e]" strokeWidth={1.75} />
              Select
            </button>
          ) : (
            <button
              type="button"
              onClick={exitSelectMode}
              className="flex items-center gap-1.5 h-[38px] px-3.5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] text-[13px] font-medium text-[#45556c] hover:bg-[#f1f5f9] transition-all shrink-0"
            >
              <X className="w-[14px] h-[14px] text-[#62748e]" strokeWidth={1.75} />
              Cancel
            </button>
          )}
        </div>

        {/* Bulk actions bar — visible when in select mode */}
        {selectMode && (
          <div className="flex items-center gap-2 w-full -mt-1 pb-1 flex-wrap">
            {/* Select all toggle */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-[#e2e8f0] bg-white text-[12px] font-medium text-[#45556c] hover:bg-[#f8fafc] transition-all"
            >
              <CheckCheck className="w-[13px] h-[13px]" strokeWidth={1.75} />
              {allChecked ? "Deselect all" : "Select all"}
            </button>

            {someChecked && (
              <>
                <div className="h-4 w-px bg-[#e2e8f0] mx-0.5" />

                {/* Selected count badge */}
                <span className="text-[12px] font-semibold text-[#1d4ed8] bg-[#eff6ff] h-[32px] px-3 rounded-[8px] flex items-center">
                  {checkedNames.size} selected
                </span>

                {/* Start selected */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium transition-all shadow-sm"
                >
                  <Play className="w-[12px] h-[12px]" fill="currentColor" strokeWidth={0} />
                  Start selected
                </button>

                {/* Export */}
                <button
                  type="button"
                  onClick={() => setConfirmAction("export")}
                  className="flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#45556c] text-[12px] font-medium transition-all"
                >
                  <Download className="w-[13px] h-[13px]" strokeWidth={1.75} />
                  Export
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setConfirmAction("delete")}
                  className="flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[12px] font-medium transition-all"
                >
                  <Trash2 className="w-[13px] h-[13px]" strokeWidth={1.75} />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Route rows */}
        <div className="flex flex-col gap-2.5 w-full pb-4 flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#cad5e2] [&::-webkit-scrollbar-thumb]:rounded-full">
          {routes.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center border border-dashed border-[#e2e8f0] rounded-[14px] bg-[#f8fafc]">
              <div className="w-11 h-11 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#90a1b9] shadow-sm">
                <Search className="w-4 h-4 text-[#90a1b9]" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0f172b]">No routes found</div>
                <div className="text-xs text-[#90a1b9] mt-0.5">
                  Nothing matches "{search}". Try a different name or code.
                </div>
              </div>
            </div>
          )}

          {routes.map((r) => {
            const isOpen = expanded === r.name;
            const isSelected = r.selected;
            const isChecked = checkedNames.has(r.name);
            const pct = r.total ? Math.round((r.collected / r.total) * 100) : 0;
            const status =
              pct === 0 ? "Not started" : pct >= 100 ? "Complete" : "In progress";
            const statusStyle =
              pct === 0
                ? "bg-[#f1f5f9] text-[#62748e]"
                : pct >= 100
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700";

            return (
              <div
                key={r.name}
                className={`relative rounded-[14px] w-full overflow-hidden group shrink-0 transition-[background-color,box-shadow,border-color] duration-200 ease-out ${
                  isChecked
                    ? "bg-[#f4f8ff]"
                    : isSelected
                    ? "bg-[#f4f8ff]"
                    : "bg-white hover:shadow-[0_2px_6px_-2px_rgba(15,23,43,0.08)]"
                }`}
                style={{
                  boxShadow: isChecked || isSelected ? "0 0 0 2px #60a5fa" : undefined,
                }}
              >
                {/* border overlay */}
                <div
                  aria-hidden
                  className={`absolute border border-solid inset-0 pointer-events-none rounded-[14px] transition-colors duration-200 ${
                    isChecked || isSelected ? "border-[#60a5fa]" : "border-[#e2e8f0] group-hover:border-[#cbd5e1]"
                  }`}
                />

                {/* Collapsed row */}
                <button
                  className={`flex flex-row items-center justify-between w-full text-left relative ${
                    isOpen || isSelected ? "min-h-[92px] px-5 py-4" : "min-h-[78px] px-4 py-3"
                  }`}
                  onClick={() => {
                    if (selectMode) {
                      toggleCheck(r.name);
                    } else {
                      onSelect(r.name);
                      toggle(r.name);
                    }
                  }}
                >
                  {/* Checkbox (select mode only) */}
                  {selectMode && (
                    <span
                      className={`shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition mr-3 ${
                        isChecked
                          ? "bg-blue-600 border-blue-600"
                          : "border-[#cad5e2] bg-white"
                      }`}
                    >
                      {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  )}

                  {/* Left: code badge + name/meta */}
                  <div className={`flex items-center min-w-0 flex-1 ${isOpen || isSelected ? "gap-5" : "gap-3"}`}>
                    <div
                      className={`relative rounded-[12px] shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isOpen || isSelected ? "size-[58px]" : "size-11"
                      } ${
                        isChecked || isSelected
                          ? "bg-[#d7e8ff]"
                          : "bg-[#f1f5f9] group-hover:bg-[#e2e8f0]"
                      }`}
                    >
                      <span
                        className={`font-semibold transition-colors ${
                          isChecked || isSelected ? "text-[#1d4ed8]" : "text-[#45556c]"
                        } ${isOpen || isSelected ? "text-[16px] leading-5" : "text-[12px] leading-[16px]"}`}
                      >
                        {r.code}
                      </span>
                      {(isChecked || isSelected) && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#3b82f6] border-2 border-white flex items-center justify-center">
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                            <path d="M1 3L2.5 4.5L5 1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-[2px] min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`font-semibold text-[#0f172b] tracking-[-0.15px] truncate ${
                          isOpen || isSelected ? "text-[20px] leading-7" : "text-[15px] leading-5"
                        }`}>
                          {r.name}
                        </p>
                        <span className={`hidden sm:inline-flex items-center rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                          isOpen || isSelected ? "px-2.5 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10px]"
                        } ${statusStyle}`}>
                          {status}
                        </span>
                      </div>
                      <p className={`font-medium text-[#62748e] tracking-[-0.1px] truncate ${
                        isOpen || isSelected ? "text-[16px] leading-6" : "text-[13px] leading-[18px]"
                      }`}>
                        {r.meta}
                      </p>
                      {/* Mini progress (collapsed state only) */}
                      <div className={`mt-1 flex items-center gap-2 transition-all duration-200 ${isOpen ? "opacity-0 max-h-0 -mt-0 overflow-hidden" : "opacity-100 max-h-3.5"}`}>
                        <div className="h-1 flex-1 rounded-full bg-[#f1f5f9] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                              pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-transparent"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums text-[#62748e] shrink-0">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: total + chevron (hide chevron in select mode) */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <div className="flex flex-col items-end">
                      <p className={`font-semibold text-[#0f172b] tracking-[-0.2px] tabular-nums ${
                        isOpen || isSelected ? "text-[28px] leading-8" : "text-[18px] leading-[22px]"
                      }`}>
                        {fmt(r.total)}
                      </p>
                      <p className={`font-medium text-[#90a1b9] uppercase ${
                        isOpen || isSelected ? "text-[13px] leading-5 tracking-[1.4px]" : "text-[9px] leading-3 tracking-[0.5px]"
                      }`}>
                        Total meters
                      </p>
                    </div>
                    {!selectMode && (
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                          isOpen
                            ? "bg-[#dbeafe] text-[#1d4ed8]"
                            : isSelected
                            ? "bg-white text-[#1d4ed8]"
                            : "bg-[#f8fafc] text-[#90a1b9] group-hover:bg-[#f1f5f9]"
                        }`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          strokeWidth={2}
                        />
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded details panel — only in normal mode */}
                {!selectMode && (
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[#dbe5f2] mx-5 mb-5 pt-5 grid grid-cols-3 gap-6">
                        {/* Collected */}
                        <div>
                          <div className="text-[12px] tracking-[1.4px] text-[#90a1b9] uppercase font-semibold">
                            Collected
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-[20px] font-semibold text-[#0f172b] tabular-nums">{fmt(r.collected)}</span>
                            <span className="text-[16px] text-[#90a1b9] tabular-nums">/ {fmt(r.total)}</span>
                            <span className={`ml-auto text-xs font-semibold tabular-nums ${pct >= 100 ? "text-emerald-600" : pct > 0 ? "text-amber-600" : "text-[#90a1b9]"}`}>{pct}%</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        {/* Start date */}
                        <div>
                          <div className="text-[12px] tracking-[1.4px] text-[#90a1b9] uppercase font-semibold">
                            Start date
                          </div>
                          <div className="flex items-center gap-2.5 mt-2 text-[16px] text-[#45556c] font-medium">
                            <span className="w-8 h-8 rounded-[10px] bg-[#f1f5f9] flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-[#62748e]" />
                            </span>
                            {r.startDate}
                          </div>
                        </div>
                        {/* End date */}
                        <div>
                          <div className="text-[12px] tracking-[1.4px] text-[#90a1b9] uppercase font-semibold">
                            End date
                          </div>
                          <div className="flex items-center gap-2.5 mt-2 text-[16px] text-[#45556c] font-medium">
                            <span className="w-8 h-8 rounded-[10px] bg-[#f1f5f9] flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-[#62748e]" />
                            </span>
                            {r.endDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        action={confirmAction}
        count={checkedNames.size}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
