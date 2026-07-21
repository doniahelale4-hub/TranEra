import { useEffect, useRef, useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import PortalHeader from "../../imports/PortalHeader";

export function AppHeader({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative h-full w-full">
      <PortalHeader />
      <div ref={ref} className="absolute right-[12px] top-0 h-full flex items-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 h-[44px] px-2 rounded-[8px] hover:bg-[#f9fafb] transition-colors"
          aria-label="Open profile menu"
        >
          <div className="w-[180px]" aria-hidden />
          <ChevronDown
            className={`w-4 h-4 text-[#90a1b9] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div
            className="absolute right-2 top-[56px] z-50 w-[220px] bg-white rounded-[10px] border border-[#e4e7ec] py-1.5"
            style={{ boxShadow: "0px 8px 24px rgba(16,24,40,0.12), 0px 2px 6px rgba(16,24,40,0.06)" }}
          >
            <div className="px-3 py-2 border-b border-[#f1f5f9]">
              <p className="text-[14px] font-semibold text-[#101828] leading-tight">Mohamed Ragab</p>
              <p className="text-[12px] text-[#475467] mt-0.5">Ragab@ERA.com</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-[14px] text-[#b42318] hover:bg-[#fef3f2] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
