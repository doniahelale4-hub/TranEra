import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { LoginScreen } from "./components/LoginScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { ExpandableRoutesList } from "./components/ExpandableRoutesList";
import PortalHeader from "../imports/PortalHeader";
import waterMeterDevice from "../imports/water-meter-device.png";
import { AppHeader } from "./components/AppHeader";
import { motion } from "motion/react";
import {
  Droplet,
  Map,
  RefreshCw,
  Upload,
  Server,
  Settings,
  Play,
  Pause,
  Square,
  Search,
  X,
  Download,
  FileDown,
  FileText,
  Loader2,
  ArrowLeft,
  Crosshair,
  Layers,
  Sliders,
  Wifi,
  Satellite,
  Radio,
  Navigation,
  MessageSquarePlus,
  Camera,
  PencilLine,
  CheckCircle2,
  Check,
  ListFilter,
  ChevronDown,
  Plus as PlusIcon,
  Minus,
  Clock,
  Bluetooth,
  Link2Off,
  Inbox,
  FolderUp,
  LayoutGrid,
  Waypoints,
  Trophy,
  Sparkles,
  TrendingUp,
  Timer,
  Zap,
} from "lucide-react";

type NavKey = "dashboard" | "routes" | "uploads" | "settings";

const navItems: { key: NavKey; icon: typeof Map; label: string }[] = [
  { key: "dashboard", icon: LayoutGrid, label: "Dashboard" },
  { key: "routes", icon: Waypoints, label: "Routes" },
  { key: "uploads", icon: Upload, label: "Uploads" },
  { key: "settings", icon: Settings, label: "Settings" },
];

function BottomNav({ active, onNav }: { active: NavKey; onNav: (k: NavKey) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      {/* Ambient cyan glow under the bar */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -inset-y-6 rounded-[40px] blur-2xl opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 60%, rgba(34,211,238,0.35) 0%, rgba(56,189,248,0.15) 50%, transparent 80%)",
        }}
      />

      <div
        className="relative flex items-center gap-1 p-[10px] rounded-[22px] border border-white/60 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,249,255,0.92) 100%)",
          boxShadow:
            "0 24px 48px -20px rgba(14,116,144,0.35), 0 6px 14px -6px rgba(14,116,144,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={`relative flex items-center gap-2.5 h-[48px] px-5 rounded-full ${
                isActive ? "text-white" : "text-[#475467] hover:text-[#0e7490]"
              }`}
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "#2563eb",
                    boxShadow:
                      "0 10px 24px -8px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
                  }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center">
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
              </span>

              <span
                className={`relative z-10 text-[17px] tracking-tight ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600"
                  style={{ boxShadow: "0 0 8px rgba(37,99,235,0.9)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type CheckpointStatus = "pending" | "collected" | "missed";

type Meter = {
  id: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  read: boolean;
  recent?: boolean;
  areaId: string;
  lastReading: number;
  lastSeen: string;
  status?: CheckpointStatus;
  tHome?: number;
};

// Parametric closed route used for the driver path and checkpoint distribution.
// viewBox is 0-100 and dot positions use the same coordinate system as percent.
function samplePath(t: number): { x: number; y: number } {
  const a = (((t % 1) + 1) % 1) * Math.PI * 2;
  const x = 50 + 32 * Math.cos(a) + 6 * Math.sin(a * 3);
  const y = 48 + 22 * Math.sin(a) + 5 * Math.cos(a * 2);
  return { x, y };
}
function pathHeading(t: number): number {
  const a = samplePath(t);
  const b = samplePath(t + 0.002);
  return Math.atan2(b.y - a.y, b.x - a.x);
}
function pathCurvature(t: number): number {
  const h1 = pathHeading(t);
  const h2 = pathHeading(t + 0.01);
  let d = h2 - h1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}
const ROUTE_PATH_D = (() => {
  const N = 220;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const p = samplePath(i / N);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
})();

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

type ImportSource = "routes" | "manager" | "file" | "manual";

const initialRoutes: Route[] = [];

const managerRoutes: Route[] = [
  {
    code: "RC03",
    name: "RC03_202605_20260514",
    meta: "Code 9KX72LMN13 · 22 areas · Olaya sector",
    total: 8420,
    collected: 1630,
    startDate: "14 May 2026",
    endDate: "02 Jun 2026",
  },
  {
    code: "RC07",
    name: "RC07_202605_20260510",
    meta: "Code 4TY88QRS21 · 9 areas · Al Malaz",
    total: 3210,
    collected: 0,
    startDate: "10 May 2026",
    endDate: "20 May 2026",
  },
  {
    code: "RC14",
    name: "RC14_202604_20260428",
    meta: "Code XZ22HJK503 · 31 areas · Diriyah extension",
    total: 17905,
    collected: 0,
    startDate: "28 Apr 2026",
    endDate: "30 May 2026",
  },
  {
    code: "RC22",
    name: "RC22_202605_20260518",
    meta: "Code MN91WERT55 · 5 areas · Industrial zone",
    total: 1240,
    collected: 0,
    startDate: "18 May 2026",
    endDate: "25 May 2026",
  },
  {
    code: "RC09",
    name: "RC09_202605_20260520",
    meta: "Code BV66POIU88 · 18 areas · Al Nakheel",
    total: 6584,
    collected: 0,
    startDate: "20 May 2026",
    endDate: "10 Jun 2026",
  },
];

const fmt = (n: number) => n.toLocaleString("en-US");

const deviceRows: { label: string; value: string; dot?: "green" | null }[] = [
  { label: "Drive-by receiver", value: "Sensus SIRT · COM8", dot: "green" },
  { label: "Antenna 1 / 2", value: "External · Internal" },
  { label: "GPS receiver", value: "GlobalSat BU-353 · COM4", dot: "green" },
  { label: "GPS tracking", value: "Required (enforced)" },
  { label: "Map provider", value: "Google Maps" },
];

export default function App() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [emptyImportOpen, setEmptyImportOpen] = useState(false);
  const [selectedImportSource, setSelectedImportSource] = useState<ImportSource>("routes");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"types" | "configure" | "map" | "settings" | "dashboard" | "packets">("types");
  const [authed, setAuthed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const activeRoute = routes.find((r) => r.selected);
  const importOptions = [
    { key: "routes", label: "Import Routes", description: "Choose source", icon: Download },
    { key: "manager", label: "From Manager", description: "Sync over network", icon: Download },
    { key: "file", label: "From file", description: "Upload .rt3 / .csv", icon: FileDown },
    { key: "manual", label: "Manual entry", description: "Type route details", icon: FileText },
  ] as const;
  const selectedImportOption =
    importOptions.find((option) => option.key === selectedImportSource) ?? importOptions[0];
  const HeaderImportIcon = selectedImportOption.icon;
  const importSourceOptions = importOptions.filter((option) => option.key !== "routes");

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.meta.toLowerCase().includes(q)
    );
  }, [routes, search]);

  function selectRoute(name: string) {
    setRoutes((prev) =>
      prev.map((r) => ({
        ...r,
        selected: r.name === name ? !r.selected : false,
      }))
    );
  }

  function chooseImportSource(source: ImportSource) {
    setSelectedImportSource(source);
    setImportOpen(false);
    setEmptyImportOpen(false);
    if (source === "manager") setModalOpen(true);
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  if (!authed) {
    return (
      <LoginScreen
        onLogin={() => setAuthed(true)}
        onOnboarding={() => setShowOnboarding(true)}
      />
    );
  }

  if (view === "map" && activeRoute) {
    return <MapScreen route={activeRoute} onBack={() => setView("configure")} />;
  }

  const handleLogout = () => {
    setAuthed(false);
    setShowOnboarding(false);
    setView("types");
  };

  if (view === "settings") {
    return (
      <SettingsScreen
        onNav={(v) => setView(v as "types" | "configure" | "settings")}
        activeNav="settings"
        onLogout={handleLogout}
      />
    );
  }

  if (view === "dashboard") {
    return (
      <DashboardScreen
        routes={routes}
        onLogout={handleLogout}
        onNav={(k) => {
          if (k === "settings") setView("settings");
          else if (k === "uploads") setView("packets");
          else if (k === "routes") setView("types");
        }}
      />
    );
  }

  if (view === "packets") {
    return (
      <ReceivedPacketsScreen
        onLogout={handleLogout}
        onNav={(k) => {
          if (k === "dashboard") setView("dashboard");
          else if (k === "routes") setView("types");
          else if (k === "settings") setView("settings");
          else setView("packets");
        }}
      />
    );
  }

  if (view === "types") {
    return <RouteTypesScreen onPick={() => setView("configure")} onSettings={() => setView("settings")} onLogout={handleLogout} onDashboard={() => setView("dashboard")} onPackets={() => setView("packets")} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#f9f9f9] text-slate-900">
      <div className="h-[62px]">
        <AppHeader onLogout={handleLogout} />
      </div>

      <div className="px-[18px] pt-[15px] pb-10">
        {/* Back button */}
        <button
          onClick={() => setView("types")}
          className="flex items-center gap-[4px] text-[14px] text-[#475467] hover:text-[#344054]"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M15.833 10H4.167M10 15.833 4.167 10 10 4.167" stroke="#98A2B3" strokeWidth="1.667" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {/* Title row + Import button */}
        <div className="flex items-start justify-between mt-[11px]">
          <div>
            <h1 className="text-[28px] font-semibold text-[#181d27] tracking-[-0.32px] leading-[32.2px]">
              Meter Read Route
            </h1>
            <p className="text-[14px] text-[#535862] tracking-[-0.15px] mt-1">
              Pick a route and confirm your receiver setup, then start collecting.
            </p>
          </div>

          {/* Import routes button */}
          {routes.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setImportOpen((v) => !v)}
              className="relative flex items-center gap-[6px] px-[14px] py-[10px] rounded-[8px] bg-white transition-opacity"
              style={{
                boxShadow: "inset 0px 0px 0px 1px rgba(10,13,18,0.18), inset 0px -2px 0px 0px rgba(10,13,18,0.05), 0px 1px 2px 0px rgba(10,13,18,0.05)",
                border: "1px solid #d5d7da",
              }}
            >
              <HeaderImportIcon className="size-4 text-[#155DFC]" strokeWidth={1.75} />
              <span className="text-[14px] text-[#414651] leading-[20px] whitespace-nowrap">
                {selectedImportOption.label}
              </span>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16" className={`transition-transform ${importOpen ? "rotate-180" : ""}`}>
                <path d="M4 6l4 4 4-4" stroke="#90A1B9" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {importOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setImportOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-20 overflow-hidden">
                  {importSourceOptions.map((option, index) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        key={option.key}
                        onClick={() => chooseImportSource(option.key)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f9f9f9] ${
                          index > 0 ? "border-t border-[#f1f5f9]" : ""
                        }`}
                      >
                        <OptionIcon className="w-4 h-4 mt-0.5 text-[#155DFC]" strokeWidth={1.75} />
                        <div>
                          <div className="text-sm font-medium text-[#0f172b]">{option.label}</div>
                          <div className="text-xs text-[#62748e]">{option.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          )}
        </div>

        {routes.length === 0 ? (
          <div className="mt-[18px] min-h-[calc(100vh-230px)] rounded-[14px] border border-dashed border-[#cad5e2] bg-white flex items-center justify-center px-6 py-10">
            <div className="max-w-[520px] text-center">
              <div className="mx-auto flex size-[58px] items-center justify-center rounded-[16px] bg-[#eff6ff] text-[#155dfc]">
                <Map className="size-7" strokeWidth={1.75} />
              </div>
              <h2 className="mt-5 text-[20px] font-semibold leading-7 text-[#0f172b]">
                No routes available
              </h2>
              <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-5 text-[#62748e]">
                Choose an import method to add routes. After importing, choose a route, review its sessions, then press Start Reading.
              </p>

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                {[
                  ["1", "Import routes", "Click Import Routes or use the button below."],
                  ["2", "Select source", "Choose From Manager, file upload, or manual entry."],
                  ["3", "Start reading", "Pick the route and begin collecting meters."],
                ].map(([step, title, body]) => (
                  <div key={step} className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <div className="mb-2 flex size-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[#155dfc] shadow-sm">
                      {step}
                    </div>
                    <div className="text-[13px] font-semibold text-[#0f172b]">{title}</div>
                    <div className="mt-1 text-[12px] leading-[17px] text-[#62748e]">{body}</div>
                  </div>
                ))}
              </div>

              <div className="relative mx-auto mt-6 w-full max-w-[300px]">
                <button
                  type="button"
                  onClick={() => setEmptyImportOpen((open) => !open)}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-blue-600 px-5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <HeaderImportIcon className="size-4 text-white" strokeWidth={1.8} />
                  {selectedImportOption.label}
                  <ChevronDown
                    className={`size-4 text-white/80 transition-transform ${emptyImportOpen ? "rotate-180" : ""}`}
                    strokeWidth={1.8}
                  />
                </button>

                {emptyImportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setEmptyImportOpen(false)} />
                    <div className="absolute left-0 right-0 top-[56px] z-20 overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white text-left shadow-[0_20px_40px_-18px_rgba(15,23,42,0.35)]">
                      {importSourceOptions.map((option, index) => {
                        const OptionIcon = option.icon;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => chooseImportSource(option.key)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] ${
                              index > 0 ? "border-t border-[#f1f5f9]" : ""
                            }`}
                          >
                            <OptionIcon className="mt-0.5 size-4 text-[#155DFC]" strokeWidth={1.75} />
                            <span>
                              <span className="block text-[14px] font-semibold text-[#0f172b]">
                                {option.label}
                              </span>
                              <span className="mt-0.5 block text-[12px] font-medium text-[#62748e]">
                                {option.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-[10px] mt-[18px]"
            style={{ gridTemplateColumns: activeRoute ? "1fr 1fr" : "1fr 393px" }}
          >
            {/* Left: Available routes */}
            <div>
              <ExpandableRoutesList
                routes={filteredRoutes}
                search={search}
                onSearch={setSearch}
                onSelect={selectRoute}
              />
            </div>

            {/* Right: Sessions or empty state */}
            <div className="flex flex-col gap-[10px]">
              {activeRoute ? (
                <>
                  <RouteSessions route={activeRoute} />
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => setView("map")}
                      className="w-full flex items-center justify-center gap-2 py-[14px] rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                    >
                      <Play className="w-5 h-5" fill="white" />
                      Start Reading
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="bg-white flex flex-col items-start p-[33px] rounded-[14px]"
                  style={{ border: "1px dashed #cad5e2" }}
                >
                  <div className="w-full flex justify-center">
                    <div className="bg-[#f1f5f9] rounded-[14px] size-[48px] flex items-center justify-center">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path d="M14.106 5.553c.278.139.584.211.894.211s.616-.072.894-.211l3.659-1.83c.153-.076.322-.112.492-.104.17.008.336.059.48.149.145.09.265.215.347.364.083.15.127.317.127.488V17.383c0 .186-.052.368-.15.526a1 1 0 0 1-.406.277l-4.553 2.277a2.013 2.013 0 0 1-1.788 0l-4.212-2.106a2.013 2.013 0 0 0-1.788 0L4.447 20.278a.893.893 0 0 1-1.32-.608.893.893 0 0 1-.127-.489V6.618c0-.186.052-.368.15-.526a1 1 0 0 1 .406-.368l4.553-2.277a2.013 2.013 0 0 1 1.788 0l3.209 1.106Z" stroke="#90A1B9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 5.764V20.764M9 3.236V18.236" stroke="#90A1B9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="w-full pt-[12px]">
                    <p className="text-[16px] font-semibold text-[#0f172b] tracking-[-0.31px] text-center w-full">
                      Select a route
                    </p>
                  </div>
                  <div className="w-full pt-[4px]">
                    <p className="text-[14px] text-[#62748e] tracking-[-0.15px] text-center leading-[20px] w-full">
                      Pick one from the available routes to see its sessions and start collecting.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <SyncManagerModal
          existing={routes}
          onClose={() => setModalOpen(false)}
          onDownload={(picked) => {
            setRoutes((prev) => [...prev, ...picked]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

type Session = {
  code: string;
  start: string;
  end: string;
  total: number;
  route: number;
  nonRoute: number;
  uploaded?: boolean;
};

type ReceivedPacket = {
  meter: string;
  time: string;
  protocol: "OMS" | "SSRF";
  signal: number;
  antenna: "Antenna 1" | "Antenna 2";
  lat: number;
  lon: number;
  data: string;
};

const sampleRouteSessions: Session[] = [
  { code: "HM1FB9", start: "16 Oct 2024 · 08:12", end: "16 Oct 2024 · 11:47", total: 214, route: 198, nonRoute: 16 },
  { code: "T6BCHJ", start: "17 Oct 2024 · 07:30", end: "17 Oct 2024 · 10:05", total: 198, route: 188, nonRoute: 10, uploaded: true },
  { code: "K9PLZX", start: "18 Oct 2024 · 06:55", end: "18 Oct 2024 · 09:42", total: 276, route: 251, nonRoute: 25, uploaded: true },
  { code: "Q3WVNM", start: "19 Oct 2024 · 07:48", end: "19 Oct 2024 · 12:10", total: 312, route: 289, nonRoute: 23 },
  { code: "R7TUJD", start: "20 Oct 2024 · 08:05", end: "20 Oct 2024 · 11:33", total: 245, route: 227, nonRoute: 18, uploaded: true },
  { code: "B4YHCS", start: "21 Oct 2024 · 07:22", end: "21 Oct 2024 · 10:48", total: 189, route: 174, nonRoute: 15 },
  { code: "L2MKAV", start: "22 Oct 2024 · 09:10", end: "22 Oct 2024 · 13:25", total: 358, route: 331, nonRoute: 27, uploaded: true },
  { code: "N8FRGT", start: "23 Oct 2024 · 06:40", end: "23 Oct 2024 · 09:55", total: 221, route: 205, nonRoute: 16 },
  { code: "D5XQWP", start: "24 Oct 2024 · 07:58", end: "24 Oct 2024 · 11:14", total: 267, route: 244, nonRoute: 23, uploaded: true },
  { code: "V1ZJHE", start: "25 Oct 2024 · 08:33", end: "25 Oct 2024 · 12:01", total: 293, route: 270, nonRoute: 23 },
];

const receivedPackets: ReceivedPacket[] = Array.from({ length: 42 }, (_, i) => {
  const meters = ["23122814", "07039420", "02400081", "06754610", "10098141", "57310028", "02400452", "61342800", "07039419"];
  const hex = "4E44655E1428122301077A001040059AC9EA89EE3EBFB59830C94240AF29123A52034099CD3FEB5E3D619A9B8C859998";
  return {
    meter: meters[i % meters.length],
    time: `2024-10-16 09:${String(30 + Math.floor(i / 2)).padStart(2, "0")}:${String((40 + i * 3) % 60).padStart(2, "0")}`,
    protocol: i % 3 === 0 ? "SSRF" : "OMS",
    signal: -58 - (i % 18),
    antenna: i % 2 === 0 ? "Antenna 1" : "Antenna 2",
    lat: i % 5 === 0 ? 24.7136 + i * 0.0001 : 0,
    lon: i % 5 === 0 ? 46.6753 + i * 0.0001 : 0,
    data: `${hex}${String(i).padStart(2, "0")}A${hex.slice(0, 42)}`,
  };
});

function exportReceivedPackets(packets: ReceivedPacket[]) {
  const headers = ["meter", "date", "protocol", "signal_dbm", "antenna", "position_lat", "position_lon", "data"];
  const rows = packets.map((packet) =>
    [
      packet.meter,
      packet.time,
      packet.protocol,
      `${packet.signal}`,
      packet.antenna,
      packet.lat ? packet.lat.toFixed(6) : "0",
      packet.lon ? packet.lon.toFixed(6) : "0",
      packet.data,
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `received-packets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type UploadMethod = "sftp" | "manager";
type SessionConfirmAction =
  | { kind: "export"; codes: string[] }
  | { kind: "upload"; codes: string[]; method?: UploadMethod }
  | null;

function SessionConfirmDialog({
  action,
  onConfirm,
  onCancel,
}: {
  action: SessionConfirmAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!action) return null;
  const isUpload = action.kind === "upload";
  const count = action.codes.length;
  const uploadTarget = action.kind === "upload" && action.method === "sftp" ? "SFTP" : "TransERA Manager";
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
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isUpload ? "bg-emerald-50" : "bg-blue-50"}`}>
            {isUpload
              ? <Upload className="w-6 h-6 text-emerald-500" strokeWidth={1.75} />
              : <FileDown className="w-6 h-6 text-blue-500" strokeWidth={1.75} />}
          </div>
          <h3 className="text-[17px] font-semibold text-[#0f172b] tracking-[-0.3px]">
            {isUpload ? "Upload sessions?" : "Export sessions?"}
          </h3>
          <p className="text-[14px] text-[#62748e] mt-1.5 leading-[20px]">
            {isUpload
              ? `${count} session${count === 1 ? "" : "s"} will be sent to ${uploadTarget}. Uploaded sessions cannot be modified.`
              : `${count} session${count === 1 ? "" : "s"} will be exported as a .rt3 file to your local storage.`}
          </p>
          {count > 1 && (
            <div className="mt-3 w-full bg-slate-50 rounded-[10px] border border-slate-100 px-3 py-2 text-left max-h-28 overflow-y-auto">
              {action.codes.map((c) => (
                <div key={c} className="text-[12px] font-mono text-slate-600 py-0.5">{c}</div>
              ))}
            </div>
          )}
        </div>
        <div className="h-px bg-[#f1f5f9] mx-6" />
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
              isUpload ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isUpload ? "Upload" : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RouteSessions({ route }: { route: Route }) {
  const hasRouteSessions = route.collected > 0;
  const [sessions, setSessions] = useState<Session[]>(
    hasRouteSessions ? sampleRouteSessions : []
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<SessionConfirmAction>(null);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);

  useEffect(() => {
    setSessions(route.collected > 0 ? sampleRouteSessions : []);
    setChecked(new Set());
    setUploadMenuOpen(false);
  }, [route.name, route.collected]);

  const allChecked = sessions.length > 0 && checked.size === sessions.length;
  const someChecked = checked.size > 0;
  const selectedSessions = sessions.filter((s) => checked.has(s.code));
  const pendingUpload = selectedSessions.filter((s) => !s.uploaded);

  function toggleCheck(code: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(sessions.map((s) => s.code)));
  }

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.kind === "upload") {
      setSessions((prev) =>
        prev.map((s) => (confirmAction.codes.includes(s.code) ? { ...s, uploaded: true } : s))
      );
    }
    setConfirmAction(null);
    setChecked(new Set());
  }

  function queueUpload(codes: string[], method: UploadMethod) {
    setUploadMenuOpen(false);
    setConfirmAction({ kind: "upload", codes, method });
  }

  function UploadMethodMenu({ codes }: { codes: string[] }) {
    const disabled = codes.length === 0;
    return (
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setUploadMenuOpen((open) => !open)}
          className="flex items-center gap-2 h-[40px] px-4 rounded-[12px] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[14px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" strokeWidth={1.75} />
          Upload Sessions
          <ChevronDown className={`w-4 h-4 transition-transform ${uploadMenuOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
        </button>

        {uploadMenuOpen && !disabled && (
          <div className="absolute right-0 top-[46px] z-30 w-full min-w-[182px] overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_12px_28px_-16px_rgba(15,23,42,0.45),0_0_0_1px_rgba(15,23,42,0.04)]">
            <button
              type="button"
              onClick={() => queueUpload(codes, "sftp")}
              className="flex h-[40px] w-full items-center gap-2.5 bg-emerald-50 px-3 text-left text-[13px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <Server className="h-[18px] w-[18px] shrink-0" strokeWidth={2.1} />
              <span>Upload SFTP</span>
            </button>
            <div className="h-px bg-emerald-200" />
            <button
              type="button"
              onClick={() => queueUpload(codes, "manager")}
              className="flex h-[40px] w-full items-center gap-2.5 bg-white px-3 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <FolderUp className="h-[18px] w-[18px] shrink-0" strokeWidth={2.1} />
              <span>Upload Manager</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">Route Sessions</div>
              <div className="text-xs text-slate-500">
                {sessions.length} session{sessions.length === 1 ? "" : "s"} · {sessions.filter((s) => s.uploaded).length} uploaded
              </div>
            </div>
          </div>

          {/* Header-level bulk actions */}
          <div className="flex items-center gap-2 shrink-0">
            {someChecked ? (
              <>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                  {checked.size} selected
                </span>
                {pendingUpload.length > 0 && (
                  <UploadMethodMenu codes={pendingUpload.map((s) => s.code)} />
                )}
                <button
                  type="button"
                  onClick={() => setConfirmAction({ kind: "export", codes: selectedSessions.map((s) => s.code) })}
                  className="flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-medium transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => setChecked(new Set())}
                  className="h-[32px] w-[32px] rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 flex items-center justify-center transition-all"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <>
                <UploadMethodMenu codes={sessions.filter((s) => !s.uploaded).map((s) => s.code)} />
                <button
                  type="button"
                  onClick={() => setConfirmAction({ kind: "export", codes: sessions.map((s) => s.code) })}
                  className="flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-medium transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Export all
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="text-left font-medium px-3 py-2">Session</th>
              <th className="text-left font-medium px-3 py-2">Start</th>
              <th className="text-left font-medium px-3 py-2">End</th>
              <th className="text-right font-medium px-3 py-2">Total #</th>
              <th className="text-right font-medium px-3 py-2">Route #</th>
              <th className="text-right font-medium px-3 py-2">Non-route #</th>
              <th className="text-right font-medium px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6">
                  <div className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-400 shadow-sm">
                      <Upload className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="text-[15px] font-semibold text-slate-900">
                      Empty session
                    </div>
                    <div className="mt-1 text-[13px] leading-5 text-slate-500">
                      No reading session exists for this route yet. Press Start Reading to create the first session.
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const isChecked = checked.has(s.code);
              return (
                <tr
                  key={s.code}
                  className={`transition-colors ${isChecked ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(s.code)}
                      className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{s.code}</span>
                      {s.uploaded && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Uploaded
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{s.start}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{s.end}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{s.total}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{s.route}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{s.nonRoute}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {!s.uploaded && (
                        <button
                          type="button"
                          title="Upload session"
                          onClick={() => setConfirmAction({ kind: "upload", codes: [s.code] })}
                          className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Export session"
                        onClick={() => setConfirmAction({ kind: "export", codes: [s.code] })}
                        className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SessionConfirmDialog
        action={confirmAction}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function SyncManagerModal({
  existing,
  onClose,
  onDownload,
}: {
  existing: Route[];
  onClose: () => void;
  onDownload: (picked: Route[]) => void;
}) {
  const [status, setStatus] = useState<"idle" | "searching" | "results" | "downloading">("idle");
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const existingNames = useMemo(() => new Set(existing.map((r) => r.name)), [existing]);
  const available = useMemo(
    () => managerRoutes.filter((r) => !existingNames.has(r.name)),
    [existingNames]
  );

  useEffect(() => {
    if (status === "results") setSelected(new Set(available.map((r) => r.name)));
  }, [status, available]);

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const toggleAll = () => {
    if (selected.size === available.length) setSelected(new Set());
    else setSelected(new Set(available.map((r) => r.name)));
  };

  function startSearch() {
    setStatus("searching");
    setTimeout(() => setStatus("results"), 1200);
  }

  function startDownload() {
    const picked = available.filter((r) => selected.has(r.name));
    if (!picked.length) return;
    setStatus("downloading");
    setProgress(0);
    const start = Date.now();
    const duration = 1500;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => onDownload(picked), 200);
    };
    requestAnimationFrame(tick);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 animate-[sheetFade_150ms_ease-out]"
    >
      <style>{`
        @keyframes sheetFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-[sheetSlideUp_280ms_cubic-bezier(0.32,0.72,0,1)]"
      >
        <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Sync Data</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1.5 ml-10">
              Download routes from TransERA Manager. Only new and modified routes will be downloaded —
              previously collected meters are not affected.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex justify-end mb-3">
            <button
              onClick={startSearch}
              disabled={status === "searching" || status === "downloading"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium shadow-sm"
            >
              {status === "searching" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {status === "searching" ? "Searching…" : "Search Routes"}
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                checked={available.length > 0 && selected.size === available.length}
                onChange={toggleAll}
                disabled={status !== "results" && status !== "downloading"}
              />
              <span className="text-slate-600 font-medium uppercase tracking-wider">File name</span>
              <span className="ml-auto text-slate-500 normal-case tracking-normal">
                {status === "results" || status === "downloading"
                  ? `${selected.size} of ${available.length} selected`
                  : "—"}
              </span>
            </div>

            <div className="min-h-[200px] max-h-64 overflow-y-auto">
              {status === "idle" && (
                <div className="px-4 py-12 text-center text-sm text-slate-500">
                  Click <span className="font-medium text-slate-700">Search Routes</span> to query your Manager.
                </div>
              )}
              {status === "searching" && (
                <div className="px-4 py-12 flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  Searching Manager database…
                </div>
              )}
              {(status === "results" || status === "downloading") &&
                (available.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-slate-500">
                    No new routes available. Everything is already downloaded.
                  </div>
                ) : (
                  available.map((r) => (
                    <label
                      key={r.name}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0 text-sm cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                        checked={selected.has(r.name)}
                        onChange={() => toggle(r.name)}
                        disabled={status === "downloading"}
                      />
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700 truncate">
                        /TRANSERA/EXPRESS/RC/ROUTE_RAW_USERNAME_{r.name}.rt3
                      </span>
                      <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                        {fmt(r.total)} m
                      </span>
                    </label>
                  ))
                ))}
            </div>
          </div>

          {status === "downloading" && (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-center text-slate-500">
                Downloading route {Math.min(available.length, Math.ceil(progress * available.length))} /{" "}
                {available.length} · {Math.round(progress * 100)}%
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="text-sm text-slate-500">
            {status === "results" && available.length > 0 && (
              <>
                <span className="font-semibold text-slate-900">{selected.size}</span> route
                {selected.size === 1 ? "" : "s"} selected to download
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={startDownload}
              disabled={status !== "results" || selected.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Routes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapScreen({ route, onBack }: { route: Route; onBack: () => void }) {
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [showSettings, setShowSettings] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [zoom, setZoom] = useState(14);
  const [packetsPerSec, setPacketsPerSec] = useState(0);
  const [packetOverlayOpen, setPacketOverlayOpen] = useState(false);
  const [devicePanelOpen, setDevicePanelOpen] = useState(false);
  const [deviceMessage, setDeviceMessage] = useState("");
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [deviceModel, setDeviceModel] = useState("SEEKER");
  const [deviceType, setDeviceType] = useState("Dual Antenna");
  const [antennaCount, setAntennaCount] = useState<1 | 2>(2);
  const [antennaProtocols, setAntennaProtocols] = useState<Record<1 | 2, "OMS" | "SSRF">>({
    1: "OMS",
    2: "SSRF",
  });

  const deviceCatalog = [
    { model: "SEEKER", types: ["Compact", "Dual Antenna"], antennas: [1, 2] as const },
    { model: "Device 1", types: ["Compact", "Dual Antenna"], antennas: [1, 2] as const },
    { model: "Device 2", types: ["Compact", "Dual Antenna"], antennas: [1, 2] as const },
  ];
  const activeDevice = deviceCatalog.find((d) => d.model === deviceModel) ?? deviceCatalog[0];
  const activeAntennaOptions = activeDevice.antennas;
  const deviceReady = bluetoothConnected && Boolean(deviceModel) && Boolean(deviceType);

  function handleStart() {
    if (!deviceReady) {
      setDeviceMessage("Please set your device or connect Bluetooth first.");
      setDevicePanelOpen(true);
      return;
    }
    setDeviceMessage("");
    setStatus("running");
  }

  // seconds elapsed tick
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status !== "running") setPacketsPerSec(0);
  }, [status]);

  const areaList = useMemo(() => {
    const codes = [
      "00407", "00408", "02502", "02503", "02504", "02505",
      "02506", "02507", "02508", "02509", "04103", "04104",
      "05302", "05309",
    ];
    return codes.map((code, i) => ({
      id: code,
      name: `Area ${code}`,
      meters: 80 + ((i * 37) % 230),
      done: 20 + ((i * 17) % 60),
    }));
  }, []);

  // 160 checkpoints distributed along the route with lateral jitter
  const checkpoints = useMemo<Meter[]>(() => {
    const rng = mulberry32(7);
    const N = 162;
    const out: Meter[] = [];
    for (let i = 0; i < N; i++) {
      const tHome = (i + (rng() - 0.5) * 0.6) / N;
      const base = samplePath(tHome);
      const heading = pathHeading(tHome);
      const px = -Math.sin(heading);
      const py = Math.cos(heading);
      const off = (rng() - 0.5) * 5.4; // ~70% will be within collect radius
      const x = base.x + px * off;
      const y = base.y + py * off;
      const area = areaList[i % areaList.length];
      out.push({
        id: `8794${String(1000 + i).slice(-4)}${(i * 31) % 10}`,
        x, y,
        lat: 24.7136 + (x - 50) * 0.0008,
        lng: 46.6753 + (y - 50) * 0.0008,
        read: false,
        areaId: area.id,
        lastReading: 600 + ((i * 17) % 800),
        lastSeen: `${(i % 30) + 1} min ago`,
        tHome: ((tHome % 1) + 1) % 1,
      });
    }
    return out;
  }, [areaList]);

  const total = checkpoints.length;

  // Per-checkpoint status (pending | collected | missed)
  const [statuses, setStatuses] = useState<Record<string, CheckpointStatus>>(() => {
    const o: Record<string, CheckpointStatus> = {};
    for (const c of checkpoints) o[c.id] = "pending";
    return o;
  });

  // Reset when checkpoints regenerate
  useEffect(() => {
    const o: Record<string, CheckpointStatus> = {};
    for (const c of checkpoints) o[c.id] = "pending";
    setStatuses(o);
  }, [checkpoints]);

  const collected = useMemo(
    () => Object.values(statuses).filter((s) => s === "collected").length,
    [statuses],
  );
  const missed = useMemo(
    () => Object.values(statuses).filter((s) => s === "missed").length,
    [statuses],
  );
  const remaining = total - collected - missed;
  const pct = total ? Math.round((collected / total) * 100) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // Refs for the rAF-driven driver simulation
  const driverRef = useRef<HTMLDivElement | null>(null);
  const tRef = useRef(0);
  const statusesRef = useRef(statuses);
  useEffect(() => { statusesRef.current = statuses; }, [statuses]);
  const [nearbyId, setNearbyId] = useState<string | null>(null);
  const nearbyIdRef = useRef<string | null>(null);

  const COLLECT_R = 3.0;
  const SHOW_RADIUS_R = 6.5;

  // Driver position + collection simulation
  useEffect(() => {
    if (status !== "running") return;
    let raf = 0;
    let last = performance.now();
    let packetWindowStart = last;
    let packetWindowCount = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;

      // Curvature-aware speed: slower on turns
      const curv = pathCurvature(tRef.current);
      const speedFactor = Math.max(0.32, 1 - curv * 7.5);
      tRef.current = (tRef.current + dt * 0.022 * speedFactor) % 1;

      const driver = samplePath(tRef.current);
      const heading = (pathHeading(tRef.current) * 180) / Math.PI;

      if (driverRef.current) {
        driverRef.current.style.left = `${driver.x}%`;
        driverRef.current.style.top = `${driver.y}%`;
        driverRef.current.style.transform = `translate(-50%, -50%) rotate(${heading + 90}deg)`;
      }

      const newCollected: string[] = [];
      const newMissed: string[] = [];
      let nearestId: string | null = null;
      let nearestDist = Infinity;

      for (const c of checkpoints) {
        const s = statusesRef.current[c.id];
        if (s !== "pending") continue;
        const dx = c.x - driver.x;
        const dy = c.y - driver.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= COLLECT_R) {
          newCollected.push(c.id);
          continue;
        }
        // Past check: t-progress moved beyond this checkpoint
        const tDiff = ((tRef.current - (c.tHome ?? 0) + 1) % 1);
        if (tDiff > 0.014 && tDiff < 0.5) {
          newMissed.push(c.id);
          continue;
        }
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = c.id;
        }
      }

      if (newCollected.length || newMissed.length) {
        setStatuses((prev) => {
          const next = { ...prev };
          for (const id of newCollected) next[id] = "collected";
          for (const id of newMissed) next[id] = "missed";
          return next;
        });
        packetWindowCount += newCollected.length;
      }

      const newNearby = nearestDist < SHOW_RADIUS_R ? nearestId : null;
      if (newNearby !== nearbyIdRef.current) {
        nearbyIdRef.current = newNearby;
        setNearbyId(newNearby);
      }

      if (now - packetWindowStart >= 1000) {
        setPacketsPerSec(packetWindowCount * 4);
        packetWindowCount = 0;
        packetWindowStart = now;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, checkpoints]);

  // Auto-finish when nothing pending
  useEffect(() => {
    if (status === "running" && total > 0 && collected + missed >= total) {
      setStatus("finished");
    }
  }, [collected, missed, total, status]);

  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    () => new Set(areaList.map((a) => a.id))
  );
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [areasOpen, setAreasOpen] = useState(false);
  const [packetsOpen, setPacketsOpen] = useState(false);
  const [meterFilters, setMeterFilters] = useState({
    offline: true,
    online: true,
    noRoute: true,
    centerGps: true,
  });
  const [draftMeterFilters, setDraftMeterFilters] = useState(meterFilters);

  const dots = useMemo<Meter[]>(
    () =>
      checkpoints.map((c) => {
        const s = statuses[c.id] ?? "pending";
        return { ...c, read: s === "collected", status: s };
      }),
    [checkpoints, statuses],
  );

  const visibleDots = useMemo(
    () =>
      dots.filter((d) => {
        const inArea = selectedAreas.has(d.areaId);
        if (!inArea && !meterFilters.noRoute) return false;
        if (!inArea && meterFilters.noRoute) return true;
        if (d.read && !meterFilters.online) return false;
        if (!d.read && !meterFilters.offline) return false;
        return true;
      }),
    [dots, selectedAreas, meterFilters]
  );

  const nearbyCheckpoint = useMemo(
    () => (nearbyId ? checkpoints.find((c) => c.id === nearbyId) ?? null : null),
    [nearbyId, checkpoints],
  );

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      {/* Top bar */}
      <div className="relative shrink-0 flex items-center justify-between gap-4 bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div>
              <div className="text-sm font-semibold leading-tight">{route.name}</div>
              <div className="text-[11px] text-slate-500">Drive-by route</div>
            </div>
          </div>

          <div className="ml-6 flex items-center gap-10">
            <Stat label="Total" value={fmt(total)} tone="slate" />
            <Stat label="Missed" value={fmt(missed)} tone="rose" />
            <Stat label="Collected" value={fmt(collected)} tone="emerald" />
            <Stat label="Comments" value="0" tone="pink" />
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDevicePanelOpen((open) => !open)}
            className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              deviceReady
                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Radio className="h-4 w-4" strokeWidth={2.2} />
            <span>{deviceReady ? "Device Disconnect" : "Connect device"}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${devicePanelOpen ? "rotate-180" : ""}`} />
          </button>

          {devicePanelOpen && (
            <div
              className="fixed inset-0 z-[90] bg-slate-900/15 backdrop-blur-[1px]"
              onClick={() => setDevicePanelOpen(false)}
            />
          )}

          {devicePanelOpen && (
            <div className="absolute right-0 top-[44px] z-[100] w-[520px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_56px_-24px_rgba(15,23,42,0.45),0_0_0_1px_rgba(15,23,42,0.04)]">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Device</div>
                  <div className="grid grid-cols-3 gap-2">
                    {deviceCatalog.map((device) => {
                      const selected = device.model === deviceModel;
                      return (
                        <button
                          key={device.model}
                          type="button"
                          onClick={() => {
                            setDeviceModel(device.model);
                            setDeviceType(device.types[0]);
                            if (!device.antennas.includes(antennaCount)) setAntennaCount(device.antennas[0]);
                          }}
                          className={`flex h-[76px] items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                            selected
                              ? "border-blue-400 bg-blue-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-[15px] font-bold leading-tight">{device.model}</div>
                          <img src={waterMeterDevice} alt="" className="h-12 w-12 object-contain" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Device type</div>
                  <div className="flex flex-wrap gap-2">
                    {activeDevice.types.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeviceType(type)}
                        className={`h-10 rounded-full border px-5 text-[14px] font-semibold transition ${
                          deviceType === type
                            ? "border-blue-400 bg-blue-50 text-slate-700"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Antenna options</div>
                  <div className="grid grid-cols-2 gap-2">
                    {activeAntennaOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setAntennaCount(count)}
                        className={`h-10 rounded-full border px-4 text-[14px] font-semibold transition ${
                          antennaCount === count
                            ? "border-blue-400 bg-blue-50 text-slate-700"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {count === 1 ? "1 antenna" : "2 antennas"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Meter protocol per antenna</div>
                  {([1, 2] as const).slice(0, antennaCount).map((antenna) => (
                    <div key={antenna} className="flex h-[54px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                      <div className="text-[15px] font-bold text-slate-800">Antenna {antenna}</div>
                      <div className="flex rounded-full border border-slate-200 bg-white p-1">
                        {(["OMS", "SSRF"] as const).map((protocol) => (
                          <button
                            key={protocol}
                            type="button"
                            onClick={() => setAntennaProtocols((prev) => ({ ...prev, [antenna]: protocol }))}
                            className={`h-8 rounded-full px-4 text-[12px] font-bold transition ${
                              antennaProtocols[antenna] === protocol
                                ? "bg-blue-600 text-white"
                                : "text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {protocol}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setBluetoothConnected(false)}
                    className="h-10 rounded-full border border-amber-200 bg-amber-50 text-[14px] font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBluetoothConnected(true);
                      setDeviceMessage("");
                      setDevicePanelOpen(false);
                    }}
                    className="h-10 rounded-full border border-blue-400 bg-blue-50 text-[14px] font-semibold text-blue-600 hover:bg-blue-100"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1 overflow-hidden">
        <FakeMap
          mapType={mapType}
          dots={visibleDots}
          zoom={zoom}
          onSelect={setSelectedMeter}
          selectedId={selectedMeter?.id ?? null}
          recenterKey={recenterKey}
          isRunning={status === "running"}
          driverRef={driverRef}
          nearbyCheckpoint={nearbyCheckpoint}
          collectRadius={COLLECT_R}
        />

        {/* Left column: Progress + Areas */}
        <div className={`absolute top-4 left-4 bottom-24 w-64 flex flex-col gap-3 transition ${devicePanelOpen ? "z-0 pointer-events-none" : "z-10"}`}>
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-900">{pct}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Meters collected</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums">
                {mm}:{ss}
              </div>
              <div className="text-[10px] tracking-wider text-slate-400 uppercase">Elapsed</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{fmt(collected)} of {fmt(total)}</span>
            <span className="text-emerald-600 font-medium">{remaining} left</span>
          </div>
          {status === "running" && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">LIVE</span>
              </div>
              <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                {packetsPerSec} pkt/s
              </span>
            </div>
          )}
        </div>

        {/* Hasr areas - collapsed pill or expanded panel */}
        {!areasOpen ? (
          <button
            onClick={() => setAreasOpen(true)}
            className="self-start flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-xl bg-white/95 backdrop-blur shadow-lg border border-slate-200 hover:bg-white"
          >
            <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <ListFilter className="w-4 h-4" />
            </span>
            <span className="font-semibold text-sm text-slate-900">Areas</span>
            <span className="text-sm text-slate-400">·</span>
            <span className="text-sm text-slate-500">
              {selectedAreas.size} selected
            </span>
          </button>
        ) : (
          <div
            className="flex-1 min-h-0 bg-white rounded-[14px] border border-[#e2e8f0] flex flex-col overflow-hidden"
            style={{ boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)" }}
          >
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#0f172b] leading-[22.5px] tracking-[-0.4395px]">
                    Hasr areas
                  </h3>
                  <p className="text-[12px] text-[#62748e] leading-[16px] mt-1 max-w-[186px]">
                    Filter which areas appear on the map
                  </p>
                </div>
                <button
                  onClick={() => setAreasOpen(false)}
                  className="w-[28.6px] h-8 rounded-[10px] border border-[#e2e8f0] text-[#62748e] hover:bg-slate-50 flex items-center justify-center"
                >
                  <X className="w-4 h-4" strokeWidth={1.67} />
                </button>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] tracking-wider text-[#62748e] uppercase font-medium">
                    Filters
                  </div>
                  <div className="text-[10px] font-medium text-[#94a3b8]">
                    {Object.values(draftMeterFilters).filter(Boolean).length} active
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: "offline", label: "Offline" },
                    { key: "online", label: "Online" },
                    { key: "noRoute", label: "No Route" },
                    { key: "centerGps", label: "Center GPS" },
                  ] as const).map((f) => {
                    const on = draftMeterFilters[f.key];
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() =>
                          setDraftMeterFilters((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
                        }
                        className={`inline-flex h-7 w-full items-center gap-1.5 rounded-md border px-2.5 text-left text-[11px] font-medium transition ${
                          on
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            on ? "bg-blue-600" : "bg-[#cbd5e1]"
                          }`}
                        />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setMeterFilters(draftMeterFilters)}
                  className="mt-2 h-8 w-full rounded-md bg-blue-600 text-[12px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Apply filter
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border-t border-[#f1f5f9] px-3 py-3 space-y-2">
              <div className="flex items-center justify-between px-3 pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAreas(
                      selectedAreas.size === areaList.length
                        ? new Set()
                        : new Set(areaList.map((a) => a.id))
                    )
                  }
                  className="flex items-center gap-3 text-[12px] font-semibold text-[#1d293d] cursor-pointer select-none"
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition ${
                      selectedAreas.size === areaList.length
                        ? "bg-blue-600 border-blue-600"
                        : "border-[#cad5e2] bg-white"
                    }`}
                  >
                    {selectedAreas.size === areaList.length && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </span>
                  Select all
                </button>
                <div className="text-[11px] font-semibold text-[#1d293d]">
                  <span className="text-blue-600">{selectedAreas.size}</span>
                  <span className="text-[#94a3b8]"> / {areaList.length} selected</span>
                </div>
              </div>
              {areaList.map((a) => {
                const checked = selectedAreas.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setSelectedAreas((prev) => {
                        const next = new Set(prev);
                        next.has(a.id) ? next.delete(a.id) : next.add(a.id);
                        return next;
                      })
                    }
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all ${
                      checked
                        ? "bg-white"
                        : "bg-white hover:bg-slate-50 opacity-70"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition ${
                        checked
                          ? "bg-blue-600 border-blue-600"
                          : "border-[#cad5e2] bg-white"
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[14px] font-semibold tracking-[-0.1504px] truncate leading-5 ${
                          checked ? "text-blue-900" : "text-[#475467]"
                        }`}
                      >
                        {a.name}
                      </div>
                      <div
                        className={`text-[11px] font-medium tracking-[0.0645px] leading-[16.5px] ${
                          checked ? "text-blue-700/80" : "text-[#94a3b8]"
                        }`}
                      >
                        {a.meters} meters · {a.done}% done
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div
                        className={`w-20 h-1.5 rounded-full overflow-hidden ${
                          checked ? "bg-blue-100" : "bg-[#f1f5f9]"
                        }`}
                      >
                        <div
                          className={`h-full transition-colors ${
                            checked ? "bg-blue-600" : "bg-[#cbd5e1]"
                          }`}
                          style={{ width: `${a.done}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-semibold ${
                          checked ? "text-blue-600" : "text-[#94a3b8]"
                        }`}
                      >
                        {a.done}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>

        {/* Right column */}
        {selectedMeter ? (
          <MeterDetails meter={selectedMeter} onClose={() => setSelectedMeter(null)} />
        ) : (
          <div className={`absolute top-4 right-4 w-64 flex flex-col gap-3 transition ${devicePanelOpen ? "z-0 pointer-events-none" : "z-10"}`}>
            {/* Live statistics - collapsible */}
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setPacketsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-sm text-slate-900">Live Statistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {packetsPerSec}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${packetsOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              {packetsOpen && (
                <div className="px-4 pb-3 border-t border-slate-100 pt-3 space-y-1.5 max-h-40 overflow-y-auto">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px] font-mono text-slate-600"
                    >
                      <span>SN {fmt(48230011 + i * 7)}</span>
                      <span className="text-slate-400">-{60 + i * 3} dBm</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                    Tap a meter on the map for details.
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPacketOverlayOpen(true)}
              className="w-full bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-200 px-4 py-3 text-left hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-sm text-slate-900">Live pkts</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {receivedPackets.length}
                </span>
              </div>
            </button>
          </div>
        )}

        {packetOverlayOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] p-6">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Live pkts</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Received packets from the active reading session.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportReceivedPackets(receivedPackets)}
                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <FileDown className="h-4 w-4" strokeWidth={1.8} />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setPacketOverlayOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    aria-label="Close live packets"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                <PacketStat icon={Radio} label="Total packets" value={fmt(receivedPackets.length)} tone="blue" />
                <PacketStat icon={Wifi} label="OMS received" value={fmt(receivedPackets.filter((p) => p.protocol === "OMS").length)} tone="emerald" />
                <PacketStat icon={Satellite} label="SSRF received" value={fmt(receivedPackets.filter((p) => p.protocol === "SSRF").length)} tone="amber" />
                <PacketStat icon={TrendingUp} label="Avg signal" value="-66 dBm" tone="cyan" />
              </div>

              <div className="flex-1 overflow-auto">
                <table className="min-w-[1100px] w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-white text-[11px] uppercase tracking-[0.08em] text-slate-500 shadow-[inset_0_-1px_0_#e2e8f0]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Meter number</th>
                      <th className="px-3 py-3 font-semibold">Date</th>
                      <th className="px-3 py-3 font-semibold">Protocol</th>
                      <th className="px-3 py-3 font-semibold">Signal</th>
                      <th className="px-3 py-3 font-semibold">Antenna</th>
                      <th className="px-3 py-3 font-semibold">Position</th>
                      <th className="px-3 py-3 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivedPackets.map((packet, index) => (
                      <tr key={`${packet.meter}-${packet.time}-${index}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">{packet.meter}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-600">{packet.time}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${packet.protocol === "OMS" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {packet.protocol}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{packet.signal} dBm</td>
                        <td className="px-3 py-3 text-slate-600">{packet.antenna}</td>
                        <td className="px-3 py-3 font-mono text-slate-500">{packet.lat ? `${packet.lat.toFixed(4)}, ${packet.lon.toFixed(4)}` : "0, 0"}</td>
                        <td className="max-w-[520px] px-3 py-3">
                          <div className="truncate font-mono text-[11px] text-slate-600" title={packet.data}>{packet.data}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Right-side floating controls */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition ${devicePanelOpen ? "z-0 pointer-events-none" : "z-10"}`}>
          <div className="flex flex-col bg-white shadow-lg border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.min(20, z + 1))}
              className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-200"
              title="Zoom in"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(3, z - 1))}
              className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-50"
              title="Zoom out"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
          <FloatBtn
            label="Center"
            onClick={() => {
              setRecenterKey((k) => k + 1);
              setZoom(14);
            }}
          >
            <Crosshair className="w-5 h-5" />
          </FloatBtn>
          <FloatBtn
            label="Map type"
            onClick={() => setMapType(mapType === "map" ? "satellite" : "map")}
          >
            <Layers className="w-5 h-5" />
          </FloatBtn>
          <FloatBtn label="Route settings" onClick={() => setShowSettings(true)}>
            <Sliders className="w-5 h-5" />
          </FloatBtn>
        </div>

        {/* Bottom action bar */}
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-6 flex flex-col items-center gap-2 transition ${devicePanelOpen ? "z-0 pointer-events-none" : "z-10"}`}>
          {deviceMessage && (
            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-lg">
              {deviceMessage}
            </div>
          )}
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-slate-200 px-3 py-2">
          <button
            onClick={handleStart}
            disabled={status === "running"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold shadow-sm"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            {status === "paused" ? "Resume" : "Start"}
          </button>
          <button
            onClick={() => setStatus("paused")}
            disabled={status !== "running"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:text-slate-300 font-semibold"
          >
            <Pause className="w-5 h-5" fill="currentColor" />
            Pause
          </button>
          <button
            onClick={() => setStatus("finished")}
            disabled={status === "idle"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold shadow-sm"
          >
            <Square className="w-4 h-4" fill="currentColor" />
            Finish
          </button>
          </div>
        </div>

        {/* Finished overlay — congratulations + session summary */}
        {status === "finished" && (() => {
          const pctDone = total ? Math.round((collected / total) * 100) : 0;
          const missed = Math.max(0, total - collected);
          const avgPerMin = elapsed > 0 ? Math.round((collected / elapsed) * 60) : 0;
          const sessionCode = `S${route.code}-${String(Math.floor(elapsed)).padStart(4, "0")}`;
          return (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-30 p-4 animate-[fadeIn_220ms_ease-out]">
              <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.92) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0); opacity: 1 } 100% { transform: translateY(120vh) rotate(720deg); opacity: 0 } }
                @keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.15); opacity: 0.2 } }
              `}</style>

              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 36 }).map((_, i) => {
                  const colors = ["#10b981", "#3b82f6", "#facc15", "#f97316", "#a855f7", "#ec4899"];
                  const c = colors[i % colors.length];
                  const left = (i * 137) % 100;
                  const delay = (i % 12) * 0.12;
                  const dur = 2.8 + ((i * 13) % 18) / 10;
                  const size = 6 + (i % 4) * 2;
                  return (
                    <span
                      key={i}
                      className="absolute top-0"
                      style={{
                        left: `${left}%`,
                        width: size,
                        height: size * 1.4,
                        background: c,
                        borderRadius: 2,
                        animation: `confettiFall ${dur}s ease-in ${delay}s forwards`,
                      }}
                    />
                  );
                })}
              </div>

              <div
                className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden"
                style={{ animation: "popIn 360ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                {/* Hero band */}
                <div className="relative bg-blue-600 px-4 py-3 flex items-center gap-3 text-white overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="relative inline-flex shrink-0">
                    <span
                      className="absolute inset-0 rounded-full bg-white/25"
                      style={{ animation: "ringPulse 2s ease-in-out infinite" }}
                    />
                    <span className="relative w-9 h-9 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow">
                      <Trophy className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold tracking-tight leading-tight">
                      Congratulations!
                    </h3>
                    <p className="text-[11px] text-white/90 truncate">
                      Route <span className="font-semibold">{route.name}</span> is complete.
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-white/70 shrink-0" />
                </div>

                {/* Summary card overlapping the band */}
                <div className="px-4 mt-3">
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <SummaryStat
                        icon={CheckCircle2}
                        tone="emerald"
                        value={fmt(collected)}
                        label="Meters collected"
                      />
                      <SummaryStat
                        icon={Timer}
                        tone="blue"
                        value={`${mm}:${ss}`}
                        label="Active time"
                      />
                      <SummaryStat
                        icon={TrendingUp}
                        tone="violet"
                        value={`${pctDone}%`}
                        label="Completion"
                      />
                      <SummaryStat
                        icon={Zap}
                        tone="amber"
                        value={`${avgPerMin}/min`}
                        label="Avg pace"
                      />
                    </div>

                    {missed > 0 && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[12px] text-rose-700">
                          <span className="font-semibold">{fmt(missed)}</span> meters missed — will retry on next pass.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session details */}
                <div className="px-4 mt-3">
                  <dl className="text-[12px] grid grid-cols-2 gap-x-3 gap-y-1 border border-slate-100 rounded-lg p-2.5 bg-slate-50/40">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Session</dt>
                      <dd className="font-mono font-semibold text-slate-800 truncate ml-2">{sessionCode}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Route</dt>
                      <dd className="font-mono text-slate-700 truncate ml-2">{route.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Total</dt>
                      <dd className="text-slate-700 tabular-nums">{fmt(total)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Status</dt>
                      <dd className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="font-semibold text-blue-700">Ready</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setElapsed(0);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
                  >
                    Stay
                  </button>
                  <button
                    onClick={onBack}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Route settings sheet */}
        {showSettings && (
          <div
            onClick={() => setShowSettings(false)}
            className="absolute inset-0 bg-slate-900/40 z-20 flex items-end justify-end"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-[520px] h-full shadow-2xl overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Display controls</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-5 text-sm">
                  <SettingRow label="Show unread meters"><Toggle defaultOn /></SettingRow>
                  <SettingRow label="Show collected meters"><Toggle defaultOn /></SettingRow>
                  <SettingRow label="Auto re-center on GPS"><Toggle /></SettingRow>
                  <SettingRow label="Audio feedback"><Toggle defaultOn /></SettingRow>
                </div>
              </div>

              {/* Live stats panel */}
              <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 text-xs space-y-1.5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <StatLine label="Total Required #" value={fmt(1967)} bold />
                  <StatLine label="OMS PACKT Received #" value={fmt(448)} />
                  <StatLine label="Received Inside Route #" value="0" />
                  <StatLine label="OMS PACKT Processed #" value={fmt(448)} />
                  <StatLine label="Received Outside Route #" value={fmt(259)} />
                  <StatLine label="RF PACKT Received #" value={fmt(1467)} />
                  <StatLine label="Total Received #" value={fmt(259)} bold />
                  <StatLine label="RF PACKT Processed #" value={fmt(1467)} />
                  <StatLine label="Without Coordinates #" value="0" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WaterDropLoader({ label = "Preparing route", sub = "Calibrating sensors…" }: { label?: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #eff6ff 0%, #dbeafe 45%, #bfdbfe 100%)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* Soft ambient orbs */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0) 70%)",
          filter: "blur(20px)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -right-24 w-[460px] h-[460px] rounded-full opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.45) 0%, rgba(96,165,250,0) 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Floating bubbles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const left = [12, 24, 38, 62, 78, 88][i];
        const size = [10, 16, 8, 14, 11, 18][i];
        const delay = i * 0.6;
        const duration = 6 + (i % 3);
        return (
          <motion.span
            key={`bub-${i}`}
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${left}%`,
              bottom: -30,
              width: size,
              height: size,
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(147,197,253,0.55) 60%, rgba(59,130,246,0.25) 100%)",
              boxShadow: "0 0 12px rgba(59,130,246,0.25)",
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [-20, -window.innerHeight - 40],
              opacity: [0, 0.9, 0.9, 0],
              x: [0, 8, -8, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeOut",
              times: [0, 0.1, 0.85, 1],
            }}
          />
        );
      })}

      <div className="relative flex flex-col items-center gap-10">
        <div className="relative w-48 h-52">
          {/* Outer pulsing halo */}
          {[0, 0.8, 1.6].map((delay, i) => (
            <motion.span
              key={`halo-${i}`}
              aria-hidden
              className="absolute left-1/2 bottom-8 -translate-x-1/2 rounded-full"
              style={{
                width: 60,
                height: 60,
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 70%)",
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 2.6], opacity: [0.7, 0] }}
              transition={{
                duration: 2.4,
                delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Falling droplets (looped) */}
          {[0, 0.55, 1.1].map((delay, i) => (
            <motion.svg
              key={i}
              width="28"
              height="40"
              viewBox="0 0 26 36"
              className="absolute left-1/2 -translate-x-1/2"
              initial={{ y: -60, opacity: 0, scaleY: 1.15 }}
              animate={{
                y: [-60, 110, 110],
                opacity: [0, 1, 0],
                scaleY: [1.2, 1, 1],
              }}
              transition={{
                duration: 1.7,
                delay,
                times: [0, 0.55, 1],
                ease: "easeIn",
                repeat: Infinity,
                repeatDelay: 0.35,
              }}
              style={{ filter: "drop-shadow(0 4px 10px rgba(59,130,246,0.5))" }}
            >
              <defs>
                <linearGradient id={`drop-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.5" stopColor="#bfdbfe" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path
                d="M13 1 C 13 11, 24 17, 24 25 A 11 11 0 1 1 2 25 C 2 17, 13 11, 13 1 Z"
                fill={`url(#drop-${i})`}
              />
              <ellipse cx="9" cy="20" rx="2.8" ry="3.8" fill="rgba(255,255,255,0.8)" />
              <ellipse cx="16" cy="28" rx="1.2" ry="1.6" fill="rgba(255,255,255,0.6)" />
            </motion.svg>
          ))}

          {/* Water surface */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 h-[3px] w-36 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(96,165,250,0) 0%, rgba(59,130,246,0.85) 50%, rgba(96,165,250,0) 100%)",
              boxShadow: "0 0 12px rgba(59,130,246,0.6)",
            }}
          />

          {/* Ripples expanding from the splash point */}
          {[0, 0.55, 1.1].map((delay, i) => (
            <motion.span
              key={`r-${i}`}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border-2 border-blue-400/80"
              style={{ width: 24, height: 24 }}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 3.6], opacity: [0.9, 0] }}
              transition={{
                duration: 1.5,
                delay: delay + 0.95,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.55,
              }}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="text-blue-900 font-semibold tracking-wide text-lg">{label}</div>
          <div className="text-blue-600/80 text-xs tracking-[0.2em] uppercase">{sub}</div>

          {/* Progress shimmer bar */}
          <div className="mt-2 h-1.5 w-48 rounded-full bg-blue-200/70 overflow-hidden relative">
            <motion.span
              className="absolute inset-y-0 w-1/3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RouteTypesScreen({ onPick, onSettings, onLogout, onDashboard, onPackets }: { onPick: (type: string) => void; onSettings: () => void; onLogout: () => void; onDashboard?: () => void; onPackets?: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const types = [
    {
      id: "free",
      name: "Free route",
      subtitle: "Drive your own way",
      desc: "Pick any street, skip around, and let the receiver pull every meter it sees. Best for spot checks and unplanned coverage.",
      cta: "Select Free Route",
      icon: Navigation,
      iconColor: "#009966",
      iconBg: "#ecfdf5",
      gradientFrom: "#ecfdf5",
      gradientTo: "#ffffff",
      highlight: false,
      features: ["Unstructured coverage", "Captures every packet", "Ideal for spot checks"],
      stat: { label: "Avg session", value: "1.8h" },
    },
    {
      id: "meter-read",
      name: "Meter read route",
      subtitle: "Follow today's manifest",
      desc: "Auto-sequence today's stops by traffic, priority, and load weight. Re-optimizes if conditions change.",
      cta: "Select Meter read Route",
      icon: Droplet,
      iconColor: "#155DFC",
      iconBg: "#eff6ff",
      gradientFrom: "#eff6ff",
      gradientTo: "#ffffff",
      highlight: true,
      badge: "Most used",
      features: ["Optimized sequencing", "Live re-routing", "Tied to today's manifest"],
      stat: { label: "Routes today", value: "12" },
    },
    {
      id: "field-investigation",
      name: "Field investigation",
      subtitle: "Let TransERA plan it",
      desc: "Walk the area to discover, geo-tag, and audit meters that have not reported recently.",
      cta: "Select investigation Route",
      icon: Crosshair,
      iconColor: "#7F22FE",
      iconBg: "#f5f3ff",
      gradientFrom: "#f5f3ff",
      gradientTo: "#ffffff",
      highlight: false,
      features: ["Geo-tag new meters", "Audit silent devices", "Walkable coverage"],
      stat: { label: "Open audits", value: "34" },
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f9f9f9] text-slate-900 pb-32">
      <div className="h-[62px]">
        <AppHeader onLogout={onLogout} />
      </div>
      <main>
        <div className="px-8 lg:px-12 pt-10 max-w-[1480px] mx-auto">
          {/* Header row */}
          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="max-w-[680px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00bc7d]" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#475467]">
                  Shift ready · 06:42 AM
                </span>
              </div>
              <h1 className="mt-4 text-[40px] font-semibold text-[#181d27] tracking-[-0.8px] leading-[1.05]">
                Choose today's <span className="text-[#155eef]">route mode</span>
              </h1>
              <p className="mt-3 text-[16px] text-[#535862] leading-relaxed">
                Each mode changes how the receiver filters and collects packets in the field. Pick one to continue — you can switch any time.
              </p>
            </div>

          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-7 mt-12">
            {types.map((t, i) => {
              const Icon = t.icon;
              const isSelected = selectedId === t.id;
              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 48, scale: 0.94, filter: "blur(6px)" }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isSelected ? 1.015 : 1,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    opacity: { duration: 0.55, ease: "easeOut", delay: 0.12 + i * 0.14 },
                    y: { type: "spring", stiffness: 260, damping: 22, delay: 0.12 + i * 0.14 },
                    scale: isSelected
                      ? { duration: 0.25, ease: "easeOut" }
                      : { type: "spring", stiffness: 260, damping: 22, delay: 0.12 + i * 0.14 },
                    filter: { duration: 0.5, ease: "easeOut", delay: 0.12 + i * 0.14 },
                  }}
                  whileHover={{
                    scale: isSelected ? 1.06 : 1.055,
                    y: -12,
                    rotate: i === 0 ? -2.5 : i === types.length - 1 ? 2.5 : 0,
                    transition: { type: "spring", stiffness: 280, damping: 18 },
                  }}
                  whileTap={{ scale: 0.985, rotate: 0 }}
                  onClick={() => {
                    if (loading) return;
                    setSelectedId(t.id);
                    setLoading(true);
                    setTimeout(() => onPick(t.id), 1500);
                  }}
                  className="relative text-left bg-white rounded-[28px] overflow-hidden group"
                  style={{
                    border: `1px solid ${
                      isSelected ? t.iconColor : t.highlight ? "#155eef" : "#e9eaeb"
                    }`,
                    boxShadow: isSelected
                      ? `0px 32px 48px -12px ${t.iconColor}33, 0px 12px 16px -6px ${t.iconColor}1f`
                      : t.highlight
                      ? "0px 24px 32px -8px rgba(10,13,18,0.10), 0px 8px 10px -4px rgba(10,13,18,0.04)"
                      : "0px 2px 4px rgba(10,13,18,0.04)",
                    transition:
                      "border-color 220ms ease-out, box-shadow 220ms ease-out",
                  }}
                >
                  {/* Gradient backdrop */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[220px] pointer-events-none"
                    style={{
                      background: `linear-gradient(180deg, ${t.gradientFrom} 0%, ${t.gradientTo} 100%)`,
                    }}
                  />
                  {/* Soft blob */}
                  <div
                    aria-hidden
                    className="absolute -top-20 -right-16 w-[260px] h-[260px] rounded-full pointer-events-none opacity-60 blur-2xl"
                    style={{ backgroundColor: t.iconBg }}
                  />
                  {/* Concentric rings */}
                  <svg
                    aria-hidden
                    className="absolute -top-[130px] -left-[120px] w-[340px] h-[340px] pointer-events-none opacity-70"
                    viewBox="0 0 336 336"
                    fill="none"
                  >
                    {[47.5, 71.5, 95.5, 119.5, 143.5, 167.5].map((r) => (
                      <circle key={r} cx="168" cy="168" r={r} stroke={t.iconColor} strokeOpacity="0.08" />
                    ))}
                  </svg>

                  <div className="relative flex flex-col gap-6 p-8 min-h-[460px]">
                    <div className="flex items-start justify-between">
                      <span
                        className="relative w-16 h-16 rounded-[20px] flex items-center justify-center"
                        style={{
                          backgroundColor: "white",
                          boxShadow: `0 10px 24px -8px ${t.iconColor}55, inset 0 0 0 1px ${t.iconColor}1f`,
                        }}
                      >
                        <motion.span
                          animate={
                            isSelected
                              ? t.id === "free"
                                ? { scale: [1, 1.18, 1], rotate: [0, 12, 0] }
                                : { scale: [1, 1.18, 1] }
                              : { scale: 1, rotate: 0 }
                          }
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="flex items-center justify-center"
                        >
                          <Icon className="w-8 h-8" style={{ color: t.iconColor }} strokeWidth={2} />
                        </motion.span>

                        {isSelected && t.id === "meter-read" && (
                          <>
                            {[0, 0.15].map((delay) => (
                              <motion.span
                                key={delay}
                                className="absolute inset-0 rounded-[20px] pointer-events-none"
                                style={{ border: `2px solid ${t.iconColor}` }}
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{ scale: 1.8, opacity: 0 }}
                                transition={{ duration: 0.7, ease: "easeOut", delay }}
                              />
                            ))}
                          </>
                        )}

                        {isSelected && t.id === "field-investigation" && (
                          <motion.span
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{ backgroundColor: t.iconColor }}
                            initial={{ scale: 1, opacity: 0.35 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        )}
                      </span>

                      <div className="flex flex-col items-end gap-2">
                        {t.badge && (
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                            style={{ backgroundColor: t.iconColor, color: "white" }}
                          >
                            {t.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="text-[28px] font-semibold text-[#181d27] tracking-[-0.4px] leading-[1.1]">
                        {t.name}
                      </div>
                      <div className="text-[15px] font-medium" style={{ color: t.iconColor }}>
                        {t.subtitle}
                      </div>
                    </div>

                    <p className="text-[15px] text-[#535862] leading-[1.55]">
                      {t.desc}
                    </p>

                    {/* Feature list */}
                    <ul className="flex flex-col gap-2.5 flex-1">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-[14px] text-[#414651]">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: t.iconBg }}
                          >
                            <Check className="w-3 h-3" style={{ color: t.iconColor }} strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="rounded-[16px] px-5 py-4 flex items-center justify-between transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? t.iconColor : "#f6f7f9",
                        color: isSelected ? "white" : "#181d27",
                      }}
                    >
                      <span className="text-[15px] font-semibold">{t.cta}</span>
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                        style={{
                          backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "white",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M3.333 8h9.334M8 3.333 12.667 8 8 12.667"
                            stroke={isSelected ? "white" : "#181d27"}
                            strokeWidth="1.667"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav
        active="routes"
        onNav={(k) => {
          if (k === "settings") onSettings();
          else if (k === "dashboard") onDashboard?.();
          else if (k === "uploads") onPackets?.();
        }}
      />

      {loading && <WaterDropLoader />}
    </div>
  );
}

function MeterDetails({ meter, onClose }: { meter: Meter; onClose: () => void }) {
  const hcn = `0580${meter.id.slice(-7, -2)}${meter.id.slice(-2)}/1`;
  const signal = -55 - (parseInt(meter.id.slice(-2), 10) % 25);
  const [activeAction, setActiveAction] = useState<"comment" | "photo" | "manual" | null>(null);
  const [commentText, setCommentText] = useState("");
  const [manualRead, setManualRead] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [savedComment, setSavedComment] = useState("");
  const [savedManualRead, setSavedManualRead] = useState("");
  const [savedPhotoName, setSavedPhotoName] = useState("");

  function saveAction() {
    if (activeAction === "comment" && commentText.trim()) setSavedComment(commentText.trim());
    if (activeAction === "manual" && manualRead.trim()) setSavedManualRead(manualRead.trim());
    if (activeAction === "photo" && photoName.trim()) setSavedPhotoName(photoName.trim());
    setActiveAction(null);
  }

  return (
    <div className="absolute top-4 right-4 bottom-24 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden z-10">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
            <img
              src={waterMeterDevice}
              alt="Water meter device"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-slate-400 uppercase">Meter details</div>
            <div className="font-mono font-bold text-lg text-slate-900 leading-tight">
              #{meter.id}
            </div>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                meter.read
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  meter.read ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {meter.read ? "Collected" : "Pending"}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 pb-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="HCN" value={hcn} mono />
          <StatCard label="Signal" value={`${signal} dBm`} tone="emerald" />
          <StatCard label="Latitude" value={meter.lat.toFixed(8)} mono />
          <StatCard label="Longitude" value={meter.lng.toFixed(8)} mono />
        </div>

        <div className="mt-2.5">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="text-[10px] tracking-wider text-slate-400 uppercase">Last reading</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                {fmt(meter.lastReading)} m³
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-sm text-slate-600">{meter.lastSeen}</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[10px] tracking-wider text-slate-400 uppercase mb-2">Actions</div>
          <div className="grid grid-cols-2 gap-2.5">
            <ActionCard
              icon={Navigation}
              label="Directions"
              subtitle="Navigate to meter"
              tint="blue"
            />
            <ActionCard
              icon={MessageSquarePlus}
              label="Add comment"
              subtitle={savedComment ? "Comment added" : "Log an issue"}
              tint="orange"
              active={activeAction === "comment"}
              onClick={() => setActiveAction((active) => active === "comment" ? null : "comment")}
            />
            <ActionCard
              icon={Camera}
              label="Attach photo"
              subtitle={savedPhotoName || "Capture evidence"}
              tint="emerald"
              active={activeAction === "photo"}
              onClick={() => setActiveAction((active) => active === "photo" ? null : "photo")}
            />
            <ActionCard
              icon={PencilLine}
              label="Manual read"
              subtitle={savedManualRead ? `${savedManualRead} m³` : "Enter value"}
              tint="slate"
              active={activeAction === "manual"}
              onClick={() => setActiveAction((active) => active === "manual" ? null : "manual")}
            />
          </div>

          {activeAction && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {activeAction === "comment" && (
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Comment
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a note about this meter"
                    className="mt-2 h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300"
                  />
                </div>
              )}

              {activeAction === "photo" && (
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
                    className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-700"
                  />
                </div>
              )}

              {activeAction === "manual" && (
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Manual read
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={manualRead}
                      onChange={(e) => setManualRead(e.target.value)}
                      placeholder="Enter value"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
                    />
                    <span className="text-xs font-medium text-slate-400">m³</span>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="h-8 flex-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAction}
                  className="h-8 flex-1 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {(savedComment || savedManualRead || savedPhotoName) && (
            <div className="mt-3 space-y-1.5">
              {savedComment && (
                <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
                  Comment: {savedComment}
                </div>
              )}
              {savedPhotoName && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Photo: {savedPhotoName}
                </div>
              )}
              {savedManualRead && (
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  Manual read: {savedManualRead} m³
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "emerald";
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
      <div className="text-[10px] tracking-wider text-slate-400 uppercase">{label}</div>
      <div
        className={`mt-0.5 text-sm font-bold ${
          tone === "emerald" ? "text-emerald-600" : "text-slate-900"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

const ACTION_TINTS = {
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-600",
};

function ActionCard({
  icon: Icon,
  label,
  subtitle,
  tint,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle: string;
  tint: keyof typeof ACTION_TINTS;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition ${
        active ? "border-blue-300 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
      }`}
    >
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${ACTION_TINTS[tint]}`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <div className="text-sm font-semibold text-slate-900 leading-tight">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "slate" | "emerald" | "amber" | "rose" | "pink" }) {
  const color =
    tone === "emerald" ? "text-emerald-600"
      : tone === "amber" ? "text-amber-600"
      : tone === "rose" ? "text-rose-600"
      : tone === "pink" ? "text-pink-500"
      : "text-slate-900";
  return (
    <div>
      <div className={`text-xl font-bold leading-tight ${color}`}>{value}</div>
      <div className="text-[10px] tracking-wider text-slate-400 uppercase">{label}</div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  ok,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ok?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

function FloatBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-11 h-11 rounded-xl bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-700">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-10 h-6 rounded-full transition ${on ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

const RIYADH = { lat: 24.7136, lng: 46.6753 };

function FakeMap({
  mapType,
  dots,
  zoom,
  onSelect,
  selectedId,
  recenterKey,
  isRunning = false,
  driverRef,
  nearbyCheckpoint,
  collectRadius = 3,
}: {
  mapType: "map" | "satellite";
  dots: Meter[];
  zoom: number;
  onSelect: (m: Meter) => void;
  selectedId: string | null;
  recenterKey: number;
  isRunning?: boolean;
  driverRef?: React.RefObject<HTMLDivElement | null>;
  nearbyCheckpoint?: Meter | null;
  collectRadius?: number;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [recenterKey]);

  const isSat = mapType === "satellite";
  const bg = isSat ? "#243042" : "#eef2f7";
  const scale = Math.pow(1.15, zoom - 14);

  // Riyadh bounding box — zoom controls how tight the view is
  const center = { lon: 46.6753, lat: 24.7136 };
  const span = 0.18 / scale;
  const bbox = `${center.lon - span},${center.lat - span * 0.7},${center.lon + span},${center.lat + span * 0.7}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=${isSat ? "cyclosm" : "mapnik"}`;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bg }}>
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
          transition: "transform 250ms ease-out",
        }}
      >
        <iframe
          key={`${bbox}-${isSat}`}
          src={osmUrl}
          title="Riyadh map"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            border: "none",
            filter: isSat ? "saturate(0.85) brightness(0.85)" : "none",
          }}
          loading="lazy"
        />
        {/* Subtle overlay tint so markers stay readable */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isSat
              ? "linear-gradient(180deg, rgba(15,22,34,0.12), rgba(15,22,34,0.28))"
              : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(15,22,34,0.06))",
          }}
        />

        {/* Checkpoints */}
        {dots.map((d) => {
          const isSel = d.id === selectedId;
          const s = d.status ?? "pending";
          const fill = s === "collected" ? "#10b981" : s === "missed" ? "#ef4444" : "#facc15";
          const glow =
            s === "collected"
              ? "0 0 8px rgba(16,185,129,0.7)"
              : s === "missed"
              ? "0 0 8px rgba(239,68,68,0.6)"
              : "0 0 6px rgba(250,204,21,0.55)";
          return (
            <div
              key={d.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
            >
              {s === "collected" && (
                <>
                  <motion.span
                    initial={{ scale: 0, opacity: 0.85 }}
                    animate={{ scale: 3.4, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/70 pointer-events-none"
                    style={{ width: 14, height: 14 }}
                  />
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
                    transition={{ duration: 0.55, ease: "easeOut", times: [0, 0.6, 1] }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                  </motion.div>
                </>
              )}
              {s === "missed" && (
                <motion.span
                  initial={{ scale: 0, opacity: 0.9 }}
                  animate={{ scale: 3.2, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-500/80 pointer-events-none"
                  style={{ width: 14, height: 14 }}
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(d);
                }}
                className="block rounded-full relative"
                style={{
                  width: isSel ? 22 : 14,
                  height: isSel ? 22 : 14,
                  background: fill,
                  border: `${isSel ? 3 : 2}px solid ${isSel ? "#2563eb" : "#ffffff"}`,
                  boxShadow: isSel ? "0 0 0 6px rgba(37,99,235,0.25)" : glow,
                  transition: "background-color 300ms ease, width 200ms ease, height 200ms ease",
                  cursor: "pointer",
                }}
                aria-label={`Checkpoint ${d.id}`}
              />
            </div>
          );
        })}

        {/* Collection radius — visible only when approaching a pending checkpoint */}
        {isRunning && nearbyCheckpoint && (
          <motion.div
            key={nearbyCheckpoint.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${nearbyCheckpoint.x}%`,
              top: `${nearbyCheckpoint.y}%`,
              width: `${collectRadius * 2}%`,
              height: `${collectRadius * 2}%`,
            }}
          >
            <span className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400/80 bg-sky-400/10" />
            <span className="absolute inset-0 rounded-full border-2 border-sky-300/60 animate-ping" />
          </motion.div>
        )}

        {/* Driver — glowing blue marker, position imperatively driven by rAF */}
        <div
          ref={driverRef}
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%) rotate(0deg)",
          }}
        >
          {isRunning && (
            <>
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 animate-ping"
                style={{ width: 64, height: 64, animationDuration: "2.2s" }}
              />
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 animate-ping"
                style={{ width: 44, height: 44, animationDuration: "1.6s", animationDelay: "0.3s" }}
              />
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400/60"
                style={{ width: 32, height: 32 }}
              />
            </>
          )}
          <span
            className="block w-4 h-4 rounded-full relative"
            style={{
              background: "radial-gradient(circle at 30% 30%, #93c5fd, #2563eb 65%, #1d4ed8)",
              border: "2px solid #ffffff",
              boxShadow:
                "0 0 0 2px rgba(37,99,235,0.35), 0 0 16px 4px rgba(59,130,246,0.7), 0 1px 4px rgba(0,0,0,0.35)",
            }}
          >
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[150%] w-0 h-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",      borderBottom: "7px solid #1d4ed8",
                filter: "drop-shadow(0 0 3px rgba(59,130,246,0.9))",
              }}
            />
          </span>
        </div>
      </div>

      {/* Map type badge */}
      <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-md text-[11px] font-medium ${
        isSat ? "bg-slate-900/70 text-white" : "bg-white/90 text-slate-600 border border-slate-200"
      }`}>
        {isSat ? "Satellite" : "Map"} · Riyadh
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Trophy;
  value: string;
  label: string;
  tone: "emerald" | "blue" | "violet" | "amber";
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    emerald: { bg: "bg-emerald-50", fg: "text-emerald-600" },
    blue: { bg: "bg-blue-50", fg: "text-blue-600" },
    violet: { bg: "bg-violet-50", fg: "text-violet-600" },
    amber: { bg: "bg-amber-50", fg: "text-amber-600" },
  };
  const t = tones[tone];
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.bg} ${t.fg}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[15px] font-bold text-slate-900 tabular-nums leading-tight">
          {value}
        </div>
        <div className="text-[10px] tracking-wider uppercase text-slate-500 leading-tight mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

function RouteSettingSelect({ label, value, options }: { label: string; value: string; options: string[] }) {
  const [val, setVal] = useState(value);
  return (
    <div>
      <label className="block text-[11px] tracking-wide text-slate-500 uppercase mb-1">{label}</label>
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ReceivedPacketsScreen({
  onLogout,
  onNav,
}: {
  onLogout: () => void;
  onNav: (k: NavKey) => void;
}) {
  const [query, setQuery] = useState("");
  const [protocol, setProtocol] = useState<"all" | "OMS" | "SSRF">("all");
  const [autoUpdate, setAutoUpdate] = useState(true);

  const filteredPackets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return receivedPackets.filter((packet) => {
      const matchesProtocol = protocol === "all" || packet.protocol === protocol;
      const matchesQuery =
        !q ||
        packet.meter.toLowerCase().includes(q) ||
        packet.data.toLowerCase().includes(q) ||
        packet.antenna.toLowerCase().includes(q);
      return matchesProtocol && matchesQuery;
    });
  }, [query, protocol]);

  const omsCount = receivedPackets.filter((packet) => packet.protocol === "OMS").length;
  const ssrfCount = receivedPackets.length - omsCount;
  const averageSignal = Math.round(receivedPackets.reduce((sum, packet) => sum + packet.signal, 0) / receivedPackets.length);

  function exportPackets() {
    const headers = ["meter", "date", "protocol", "signal_dbm", "antenna", "position_lat", "position_lon", "data"];
    const rows = filteredPackets.map((packet) =>
      [
        packet.meter,
        packet.time,
        packet.protocol,
        `${packet.signal}`,
        packet.antenna,
        packet.lat ? packet.lat.toFixed(6) : "0",
        packet.lon ? packet.lon.toFixed(6) : "0",
        packet.data,
      ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `received-packets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen w-full bg-[#f3f6fb] text-slate-900 pb-28">
      <div className="h-[62px]">
        <AppHeader onLogout={onLogout} />
      </div>

      <main className="max-w-[1280px] mx-auto px-6 pt-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Received Packets</h1>
            <p className="mt-1 text-sm text-slate-500">Review live receiver packets, inspect raw data, and export filtered results.</p>
          </div>
          <button
            type="button"
            onClick={exportPackets}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <FileDown className="h-4 w-4" strokeWidth={1.8} />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <PacketStat icon={Radio} label="Total packets" value={fmt(receivedPackets.length)} tone="blue" />
          <PacketStat icon={Wifi} label="OMS received" value={fmt(omsCount)} tone="emerald" />
          <PacketStat icon={Satellite} label="SSRF received" value={fmt(ssrfCount)} tone="amber" />
          <PacketStat icon={TrendingUp} label="Avg signal" value={`${averageSignal} dBm`} tone="cyan" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meter number, antenna, or raw data..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex h-10 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(["all", "OMS", "SSRF"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setProtocol(item)}
                  className={`rounded-lg px-3 text-xs font-semibold transition ${
                    protocol === item ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item === "all" ? "All" : item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAutoUpdate((value) => !value)}
              className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
                autoUpdate ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${autoUpdate ? "bg-emerald-500" : "bg-slate-300"}`} />
              Auto update
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
              Refresh
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
            <span>Showing <span className="font-semibold text-slate-900">{filteredPackets.length}</span> packets</span>
            <span>Next refresh: 2026-05-03 09:45:00</span>
          </div>

          <div className="max-h-[calc(100vh-330px)] overflow-auto">
            <table className="min-w-[1100px] w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_#e2e8f0]">
                <tr className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  <th className="w-10 px-4 py-3"><input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" /></th>
                  <th className="px-3 py-3 font-semibold">Meter number</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Protocol</th>
                  <th className="px-3 py-3 font-semibold">Signal</th>
                  <th className="px-3 py-3 font-semibold">Antenna</th>
                  <th className="px-3 py-3 font-semibold">Position</th>
                  <th className="px-3 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackets.map((packet, index) => (
                  <tr key={`${packet.meter}-${packet.time}-${index}`} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3"><input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" /></td>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-900">{packet.meter}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">{packet.time}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${packet.protocol === "OMS" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {packet.protocol}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{packet.signal} dBm</td>
                    <td className="px-3 py-3 text-slate-600">{packet.antenna}</td>
                    <td className="px-3 py-3 font-mono text-slate-500">{packet.lat ? `${packet.lat.toFixed(4)}, ${packet.lon.toFixed(4)}` : "0, 0"}</td>
                    <td className="max-w-[460px] px-3 py-3">
                      <div className="truncate font-mono text-[11px] text-slate-600" title={packet.data}>{packet.data}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <BottomNav active="uploads" onNav={onNav} />
    </div>
  );
}

function PacketStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "blue" | "cyan" | "emerald" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    cyan: "bg-cyan-50 text-cyan-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tones}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</div>
    </div>
  );
}

function StatLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-700"}>{value}</span>
    </div>
  );
}

type SettingsTab = "general" | "database" | "sync" | "account" | "about";

function SettingsScreen({ onNav, activeNav, onLogout }: { onNav: (v: string) => void; activeNav: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen w-full bg-[#f3f4f6] text-slate-900 flex flex-col">
      <div className="h-[62px]">
        <AppHeader onLogout={onLogout} />
      </div>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-[120px] leading-none tracking-tight text-blue-600 font-bold">404</div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Page not found</h1>
          <p className="mt-3 text-slate-600">
            The settings page you're looking for doesn't exist or has been moved.
          </p>
          <button
            onClick={() => onNav("types")}
            className="mt-8 inline-flex items-center gap-2 px-6 h-12 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            style={{ boxShadow: "0 10px 24px -8px rgba(37,99,235,0.6)" }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </main>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-blue-600 font-semibold mb-4">{title}</h2>
      <div className="space-y-4 max-w-xl">{children}</div>
    </div>
  );
}

function SettingsDropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange?: (v: string) => void;
}) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-6">
      <label className="w-52 shrink-0 text-sm text-slate-700">{label}</label>
      <select
        value={val}
        onChange={(e) => { setVal(e.target.value); onChange?.(e.target.value); }}
        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 appearance-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function GeneralTab() {
  return (
    <div>
      <SettingsSection title="Display Settings">
        <SettingsDropdown label="Display Language" value="English" options={["English", "Arabic", "French", "Spanish"]} />
        <SettingsDropdown label="Date/Time Format" value="YYYY-MM-DD 24hh:mm:ss" options={["YYYY-MM-DD 24hh:mm:ss","MM/DD/YYYY 12h","DD-MM-YYYY 24hh:mm"]} />
      </SettingsSection>
      <SettingsSection title="Maps">
        <SettingsDropdown label="Prefered Online Map Provider" value="OpenStreetMap" options={["OpenStreetMap","Google Maps","HERE Maps","Mapbox"]} />
        <SettingsDropdown label="Prefered Offline Map Provider" value="OpenStreetMap (Offline)" options={["OpenStreetMap (Offline)","MBTiles","Custom tiles"]} />
      </SettingsSection>
    </div>
  );
}

function DatabaseTab() {
  return (
    <div>
      <SettingsSection title="Database Connection">
        <SettingsDropdown label="Database Type" value="PostgreSQL" options={["PostgreSQL","MySQL","SQLite","SQL Server"]} />
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Host / IP</label>
          <input defaultValue="192.168.1.100" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Port</label>
          <input defaultValue="5432" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Database Name</label>
          <input defaultValue="transera_db" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Username</label>
          <input defaultValue="admin" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Password</label>
          <input type="password" defaultValue="••••••••" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <button className="mt-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
            Test Connection
          </button>
        </div>
      </SettingsSection>
      <SettingsSection title="FTP Settings">
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">FTP Server</label>
          <input defaultValue="ftp.transera.com" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <SettingsDropdown label="Protocol" value="SFTP" options={["SFTP","FTP","FTPS"]} />
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Remote Path</label>
          <input defaultValue="/TRANSERA/EXPRESS/RC/" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
      </SettingsSection>
    </div>
  );
}

function SyncTab() {
  return (
    <div>
      <SettingsSection title="Sync Schedule">
        <SettingsDropdown label="Auto-sync frequency" value="Every 30 minutes" options={["Manual only","Every 15 minutes","Every 30 minutes","Every hour","Every 6 hours","Daily"]} />
        <SettingsDropdown label="Sync window start" value="06:00" options={["00:00","04:00","06:00","08:00"]} />
        <SettingsDropdown label="Sync window end" value="22:00" options={["18:00","20:00","22:00","23:59"]} />
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Sync on Wi-Fi only</label>
          <Toggle defaultOn />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Sync on cellular</label>
          <Toggle />
        </div>
      </SettingsSection>
    </div>
  );
}

function AccountTab() {
  return (
    <div>
      <SettingsSection title="Account Details">
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Username</label>
          <input defaultValue="USERNAME" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Full Name</label>
          <input defaultValue="Field Technician" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Employee ID</label>
          <input defaultValue="EMP-00142" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-6">
          <label className="w-52 shrink-0 text-sm text-slate-700">Region</label>
          <input defaultValue="Riyadh · Central District" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <button className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
            Save Changes
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#1f6feb] flex items-center justify-center shadow-lg">
          <Droplet className="w-8 h-8 text-white" fill="white" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">TransERA Express</div>
          <div className="text-sm text-slate-500 mt-0.5">Water Meter Data Collection System</div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {[
          { label: "Application Version", value: "4.2.1 (Build 20260608)" },
          { label: "License Type", value: "Enterprise · Unlimited devices" },
          { label: "Licensed To", value: "National Water Company — Riyadh" },
          { label: "License Expiry", value: "31 December 2026" },
          { label: "Support Contact", value: "support@transera.com" },
          { label: "Platform", value: "Tablet · Android 13 / Windows 11" },
        ].map((row) => (
          <div key={row.label} className="flex items-start gap-6 py-2 border-b border-slate-100">
            <span className="w-48 shrink-0 text-slate-500">{row.label}</span>
            <span className="text-slate-900 font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
        © 2026 TransERA Technologies. All rights reserved. Unauthorized copying or distribution is prohibited.
      </div>
    </div>
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function DashboardScreen({
  routes,
  onLogout,
  onNav,
}: {
  routes: Route[];
  onLogout: () => void;
  onNav: (k: NavKey) => void;
}) {
  const totalMeters = routes.reduce((s, r) => s + r.total, 0);
  const totalCollected = routes.reduce((s, r) => s + r.collected, 0);
  const pct = totalMeters ? Math.round((totalCollected / totalMeters) * 100) : 0;
  const active = routes.find((r) => r.selected);
  const completed = routes.filter((r) => r.collected >= r.total).length;

  const weekData = [62, 78, 54, 91, 73, 88, 67];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxWeek = Math.max(...weekData);

  const recent = [
    { id: "S-2891", route: "AR · Hamilton Heights", count: 198, time: "2h ago", status: "uploaded" as const },
    { id: "S-2890", route: "AR · Al Malaz", count: 276, time: "5h ago", status: "uploaded" as const },
    { id: "S-2889", route: "AR · Olaya", count: 214, time: "yesterday", status: "pending" as const },
    { id: "S-2888", route: "AR · Diriyah", count: 189, time: "yesterday", status: "uploaded" as const },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f3f6fb] text-slate-900 pb-28">
      <div className="h-[62px]">
        <AppHeader onLogout={onLogout} />
      </div>

      <main className="max-w-[1280px] mx-auto px-6 pt-6">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Good morning, Technician
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's how your collection is going today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Manager online · synced 2 min ago
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={Droplet}
            label="Meters collected"
            value={fmt(totalCollected)}
            sub={`of ${fmt(totalMeters)} (${pct}%)`}
            tone="blue"
          />
          <KpiCard
            icon={Waypoints}
            label="Active routes"
            value={String(routes.length)}
            sub={`${completed} completed`}
            tone="cyan"
          />
          <KpiCard
            icon={TrendingUp}
            label="Today's average"
            value="73 m/h"
            sub="+12% vs last week"
            tone="emerald"
          />
          <KpiCard
            icon={Timer}
            label="Time in field"
            value="4h 28m"
            sub="3 sessions today"
            tone="amber"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly chart */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-900">Weekly collection</h2>
                <p className="text-xs text-slate-500 mt-0.5">Meters collected per day</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                  <Sparkles className="w-3 h-3" /> On track
                </span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-44">
              {weekData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${(v / maxWeek) * 100}%`,
                        background:
                          i === weekData.length - 1
                            ? "linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)"
                            : "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 100%)",
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">{dayLabels[i]}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Current route progress */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Current route</h2>
            {active ? (
              <>
                <p className="text-xs text-slate-500 mb-4 truncate">{active.name}</p>
                <RingProgress
                  value={active.total ? Math.round((active.collected / active.total) * 100) : 0}
                />
                <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">Collected</div>
                    <div className="font-semibold text-slate-900 mt-0.5 tabular-nums">{fmt(active.collected)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">Remaining</div>
                    <div className="font-semibold text-slate-900 mt-0.5 tabular-nums">{fmt(active.total - active.collected)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 py-8 text-center">
                No active route. Pick one from the Routes screen.
              </div>
            )}
          </section>

          {/* Recent sessions */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Recent sessions</h2>
              <button
                onClick={() => onNav("uploads")}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{r.route}</div>
                    <div className="text-xs text-slate-500">{r.id} · {r.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-slate-900 tabular-nums">{r.count}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">meters</div>
                  </div>
                  {r.status === "uploaded" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Device status */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Device status</h2>
            <div className="space-y-3">
              <DeviceRow icon={Radio} label="Drive-by receiver" value="Sensus SIRT" ok />
              <DeviceRow icon={Satellite} label="GPS receiver" value="BU-353 · COM4" ok />
              <DeviceRow icon={Wifi} label="Network" value="LTE · 38 ms" ok />
              <DeviceRow icon={Bluetooth} label="Bluetooth" value="Disconnected" />
            </div>
          </section>
        </div>

        {/* Achievement strip */}
        <div className="mt-4 rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-white">
            <div className="font-semibold">You're on a 5-day streak</div>
            <div className="text-sm text-white/80">Hit your daily quota every day this week. Keep going!</div>
          </div>
          <Zap className="w-5 h-5 text-yellow-300" />
        </div>
      </main>

      <BottomNav
        active="dashboard"
        onNav={(k) => onNav(k)}
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "cyan" | "emerald" | "amber";
}) {
  const tones = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${tones.bg} ${tones.text} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
      <div className="text-sm text-slate-700 mt-0.5">{label}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function RingProgress({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-[140px] h-[140px] mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#e2e8f0" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="#2563eb"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold text-slate-900 tabular-nums">{value}%</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">complete</div>
      </div>
    </div>
  );
}

function DeviceRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{label}</div>
        <div className="text-xs text-slate-500 truncate">{value}</div>
      </div>
      <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-slate-300"}`} />
    </div>
  );
}
