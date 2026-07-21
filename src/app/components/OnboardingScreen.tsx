import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  RefreshCw,
  Radio,
  Play,
  Droplet,
  Bluetooth,
  Navigation,
  Wifi,
  Satellite,
} from "lucide-react";

type Props = {
  onComplete: () => void;
};

type Step = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Droplet;
  accent: string; // primary hex
  accentSoft: string; // background tint
  gradient: [string, string, string]; // 3 stops for animated mesh
};

const steps: Step[] = [
  {
    eyebrow: "01 · Platform",
    title: "Welcome to TransERA Express",
    description:
      "The field-first water meter platform. Sync routes, monitor live packets, and finish your day faster — even offline.",
    icon: Droplet,
    accent: "#22d3ee",
    accentSoft: "#ecfeff",
    gradient: ["#0a2540", "#0b3a6b", "#0e7490"],
  },
  {
    eyebrow: "02 · Device",
    title: "Pair your SEEKER receiver",
    description:
      "Connect your drive-by receiver and GPS module over Bluetooth. We'll stream every packet in real time as you move.",
    icon: Radio,
    accent: "#38bdf8",
    accentSoft: "#f0f9ff",
    gradient: ["#0c1445", "#1e3a8a", "#0ea5e9"],
  },
  {
    eyebrow: "03 · Sync",
    title: "Built for offline routes",
    description:
      "Pull today's manifest from TransERA Manager before you leave the depot. Progress is cached locally and synced the moment you're back online.",
    icon: RefreshCw,
    accent: "#06b6d4",
    accentSoft: "#ecfeff",
    gradient: ["#052e36", "#0e7490", "#22d3ee"],
  },
  {
    eyebrow: "04 · Field",
    title: "Navigate, collect, done",
    description:
      "A live map shows your route, your position, and every meter as it reports in. Areas turn green as coverage completes.",
    icon: MapIcon,
    accent: "#0ea5e9",
    accentSoft: "#f0f9ff",
    gradient: ["#0a2540", "#0369a1", "#38bdf8"],
  },
];

/* -------------------------------------------------------- */
/* Animated background — gradient mesh + drifting particles */
/* -------------------------------------------------------- */
function AnimatedBackdrop({ step }: { step: Step }) {
  // Stable particle field — only computed once
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 10,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* base dark canvas */}
      <div className="absolute inset-0 bg-[#06121f]" />

      {/* animated gradient mesh blobs — cross-fade per step */}
      <AnimatePresence mode="sync">
        <motion.div
          key={step.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <motion.div
            className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full blur-3xl opacity-50"
            style={{ background: step.gradient[0] }}
            animate={{
              x: [0, 40, -20, 0],
              y: [0, 30, -30, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-20 -right-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-50"
            style={{ background: step.gradient[1] }}
            animate={{
              x: [0, -30, 30, 0],
              y: [0, 40, -20, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 left-1/3 w-[540px] h-[540px] rounded-full blur-3xl opacity-40"
            style={{ background: step.gradient[2] }}
            animate={{
              x: [0, 20, -30, 0],
              y: [0, -20, 30, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* drifting particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            filter: "blur(0.5px)",
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* radial vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(6,8,15,0.7) 100%)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------- */
/* Step-specific creative hero visuals                       */
/* -------------------------------------------------------- */
function StepHero({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;

  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      {/* outer rotating dashed ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-dashed border-white/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      {/* mid orbit */}
      <motion.div
        className="absolute inset-8 rounded-full border border-white/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />

      {/* glow */}
      <motion.div
        className="absolute inset-12 rounded-full blur-3xl"
        style={{ background: step.accent }}
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* central orb */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-36 h-36 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
        </motion.div>

        {/* per-step extras */}
        {index === 0 && (
          <>
            {/* water ripples */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-cyan-300/50"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}

        {index === 1 && (
          <>
            {/* bluetooth signal pulse */}
            <motion.div
              className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bluetooth className="w-5 h-5 text-white" />
            </motion.div>
            {/* orbiting satellites */}
            {[0, 120, 240].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ width: 280, height: 280, left: -72, top: -72 }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 10 + i * 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                initial={{ rotate: angle }}
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              </motion.div>
            ))}
          </>
        )}

        {index === 2 && (
          <>
            {/* sync arrows orbit */}
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-dashed border-cyan-300/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </motion.div>
            <motion.div
              className="absolute -left-2 -bottom-2 w-10 h-10 rounded-full bg-sky-600 border-2 border-white flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wifi className="w-4 h-4 text-white" />
            </motion.div>
          </>
        )}

        {index === 3 && (
          <>
            {/* GPS pin sweep */}
            <motion.div
              className="absolute -right-3 -top-3 w-11 h-11 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Navigation className="w-4 h-4 text-white fill-white" />
            </motion.div>
            <motion.div
              className="absolute -left-3 -bottom-3 w-11 h-11 rounded-full bg-cyan-600 border-2 border-white flex items-center justify-center"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Satellite className="w-4 h-4 text-white" />
            </motion.div>
            {/* radar sweep */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(56,189,248,0.5) 60deg, transparent 120deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------- */
/* Main screen                                              */
/* -------------------------------------------------------- */
export function OnboardingScreen({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const next = () => {
    if (currentStep === steps.length - 1) onComplete();
    else setCurrentStep((p) => p + 1);
  };
  const prev = () => setCurrentStep((p) => Math.max(0, p - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#06121f]">
      <AnimatedBackdrop step={step} />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-5xl rounded-[28px] overflow-hidden flex flex-col md:flex-row h-full max-h-[640px] backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]"
      >
        {/* Left visual */}
        <div className="relative w-full md:w-1/2 h-64 md:h-full flex items-center justify-center p-8 overflow-hidden">
          {/* subtle inner glow against the panel */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${step.accent}22 0%, transparent 70%)`,
              transition: "background 600ms ease",
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 6 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10"
            >
              <StepHero step={step} index={currentStep} />
            </motion.div>
          </AnimatePresence>

          {/* progress dots */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
            {steps.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentStep(i)}
                className="h-2 rounded-full overflow-hidden bg-white/20"
                animate={{ width: i === currentStep ? 28 : 8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                aria-label={`Go to step ${i + 1}`}
              >
                {i === currentStep && (
                  <motion.span
                    layoutId="dot-fill"
                    className="block h-full w-full bg-white"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col p-8 md:p-12 relative bg-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-slate-500">
                TransERA Express · Onboarding
              </span>
            </div>
            <button
              onClick={onComplete}
              className="text-sm font-medium text-slate-400 hover:text-cyan-600 transition-colors"
            >
              Skip
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                  style={{ backgroundColor: step.accentSoft, color: step.accent }}
                >
                  <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">
                    {step.eyebrow}
                  </span>
                </div>
                <h2 className="text-[34px] font-bold text-slate-900 tracking-tight leading-[1.1] mb-4">
                  {step.title}
                </h2>
                <p className="text-[16px] text-slate-500 leading-relaxed max-w-md">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={prev}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                currentStep === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>

            <div className="text-xs text-slate-400 font-medium">
              {currentStep + 1} / {steps.length}
            </div>

            <motion.button
              onClick={next}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 px-7 py-3.5 rounded-xl text-white font-medium shadow-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${step.gradient[0]}, ${step.gradient[1]})`,
                boxShadow: `0 10px 30px -8px ${step.accent}80`,
                transition: "background 400ms ease, box-shadow 400ms ease",
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started <Play className="w-4 h-4 fill-current" />
                  </>
                ) : (
                  <>
                    Continue <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </span>
              {/* shine sweep */}
              <motion.span
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1.5,
                }}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
