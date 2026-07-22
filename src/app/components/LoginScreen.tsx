import { useEffect, useState } from "react";
import { Droplet, Eye, EyeOff, Lock, User, Waves, Gauge, Wifi, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

type Props = { onLogin: () => void; onOnboarding?: () => void };

export function LoginScreen({ onLogin, onOnboarding }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1000), 80);
    return () => clearInterval(id);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Enter your technician ID and password");
      return;
    }
    if (username.trim() !== "Doniahelale" || password !== "1234") {
      setError("Invalid Technician ID or password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 900);
  }

  const flow = 42 + Math.round(8 * Math.sin(tick / 6));
  const pressure = 3.2 + 0.15 * Math.sin(tick / 9);

  return (
    <div className="min-h-screen w-full flex bg-[#0a1530] text-slate-100 overflow-hidden">
      {/* Left brand panel */}
      <div className="relative hidden md:flex flex-col justify-between w-[52%] p-12 overflow-hidden">
        {/* Layered blue background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(96,165,250,0.45), transparent 40%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.35), transparent 45%)",
        }} />
        {/* Animated waves */}
        <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: 220 }}>
          <defs>
            <linearGradient id="w1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="w2" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            fill="url(#w1)"
            d={wavePath(tick, 1440, 320, 28, 0.012, 0.05)}
          />
          <path
            fill="url(#w2)"
            d={wavePath(tick, 1440, 320, 22, 0.016, 0.09, 40)}
          />
        </svg>

        {/* Floating droplets */}
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-300/20 backdrop-blur-sm border border-blue-200/20"
            style={{
              width: 14 + (i % 3) * 10,
              height: 14 + (i % 3) * 10,
              left: `${(i * 137) % 90 + 5}%`,
              top: `${10 + ((i * 53 + tick * 0.6) % 70)}%`,
              transition: "top 1.2s linear",
            }}
          />
        ))}

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              <Droplet className="w-6 h-6 text-blue-200" fill="currentColor" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">TransERA Express</div>
              <div className="text-xs text-blue-200/80">Field Meter Collection · v4.2</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-blue-100 mb-5">
            <Waves className="w-3.5 h-3.5" /> Live network · synced 2 min ago
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Every drop, <br />
            <span className="text-blue-300">accounted for.</span>
          </h1>
          <p className="text-blue-100/80 mt-4 max-w-sm">
            Sign in to your technician profile to load today's routes, configure your SEEKER receivers, and start collecting in the field.
          </p>

          {/* Live mini stats */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            <MiniStat icon={Gauge} label="Flow" value={`${flow} L/m`} />
            <MiniStat icon={Waves} label="Pressure" value={`${pressure.toFixed(2)} bar`} />
            <MiniStat icon={Wifi} label="SEEKER" value="Linked" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-blue-100/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Encrypted · AES-256 · Local-first
          </div>
          <div>© 2026 TransERA Express</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-white text-slate-900 relative">
        <div className="absolute inset-0 opacity-[0.5] pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="w-full max-w-md relative">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-300/30 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-blue-300" fill="currentColor" />
            </div>
            <div>
              <div className="font-semibold">AquaRoute</div>
              <div className="text-xs text-slate-400">Field Meter Collection</div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back, technician</h2>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to start today's route.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field
              icon={User}
              label="Technician ID"
              type="text"
              placeholder="Doniahelale"
              value={username}
              onChange={setUsername}
              autoFocus
            />

            <div>
              <Field
                icon={Lock}
                label="Password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                />
                Keep me signed in
              </label>
              <button type="button" className="text-blue-700 hover:text-blue-800 font-medium">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connecting to manager…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onOnboarding && (
              <button
                type="button"
                onClick={onOnboarding}
                className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Onboarding
              </button>
            )}
          </form>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Manager reachable · 38 ms
            </div>
            <div>Build 4.2.1 · 2026.06</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  type,
  placeholder,
  value,
  onChange,
  trailing,
  autoFocus,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
        <Icon className="w-4 h-4 text-slate-400" />
        <input
          autoFocus={autoFocus}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
        />
        {trailing}
      </div>
    </label>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-blue-100/70">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-1 text-base font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
}

function wavePath(
  tick: number,
  w: number,
  h: number,
  amp: number,
  freq: number,
  speed: number,
  yOffset = 0,
) {
  const baseY = h - 110 + yOffset;
  const points: string[] = [];
  const step = 20;
  for (let x = 0; x <= w; x += step) {
    const y = baseY + Math.sin(x * freq + tick * speed) * amp;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return `M0,${h} L${points.join(" L")} L${w},${h} Z`;
}
