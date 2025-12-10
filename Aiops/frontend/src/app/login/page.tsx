'use client';

import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { mockUsers } from "@/lib/auth/mockUsers";
import { Role } from "@/lib/auth/rbac";
import { useSessionStore } from "@/lib/auth/session";
import { useLottieLoader } from "@/lib/useLottieLoader";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import aiBrainAnimation from "../../../Ai  brain board.json";
import loginAnimation from "../../../Login.json";

const roleVariant: Record<Role, string> = {
  admin: "text-rose-400",
  operator: "text-indigo-400",
  executive: "text-amber-400",
  observer: "text-emerald-400",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useSessionStore((state) => state.login);
  const user = useSessionStore((state) => state.user);
  const hydrated = useSessionStore((state) => state.hydrated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const animRef = useRef<HTMLDivElement | null>(null); // right-side animation
  const leftAnimRef = useRef<HTMLDivElement | null>(null); // left-side near form
  const lottieReady = useLottieLoader();

  useEffect(() => {
    if (hydrated && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [hydrated, user, navigate]);

  // Initialize Lottie animations
  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as any) : undefined;
    if (!win || !win.lottie) return;

    let rightInst: any | undefined;
    let leftInst: any | undefined;

    if (animRef.current) {
      rightInst = win.lottie.loadAnimation({
        container: animRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: aiBrainAnimation,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      });
    }

    if (leftAnimRef.current) {
      leftInst = win.lottie.loadAnimation({
        container: leftAnimRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: loginAnimation,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      });
    }

    return () => {
      try { rightInst?.destroy?.(); } catch {}
      try { leftInst?.destroy?.(); } catch {}
    };
  }, [lottieReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message ?? "Unable to sign in");
      toast.error(result.message ?? "Invalid credentials");
      return;
    }
    toast.success("Welcome back");
    navigate("/dashboard", { replace: true });
  };

  const handlePrefill = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword("Passw0rd!");
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="relative flex flex-1 flex-col gap-8 px-6 py-10 sm:px-8 lg:w-1/2 lg:px-12 lg:py-16">
        {/* Top-right login animation (does not affect layout) */}
        <div className="pointer-events-none absolute right-4 top-16 z-10 sm:right-6 sm:top-14 md:right-8 md:top-12 lg:top-10">
          
        </div>
        <div className="space-y-2">
          <BrandMark />
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Royal Cyber AIOps for Enterprise
          </p>
        </div>
        <div className="space-y-4">
          <h1 className="text-base uppercase tracking-[0.3em] text-slate-700">
            Login to Royal Cyber AIOPS for Enterprise
          </h1>
        </div>
        <Card className="max-w-2xl space-y-6 border border-[var(--border)] bg-[var(--surface)]/90 p-8 shadow-[0_25px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-sm">
              <label className="block font-semibold text-[var(--text)]">Email</label>
              <Input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-sm">
              <label className="block font-semibold text-[var(--text)]">Password</label>
              <Input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-[var(--muted)]">
                <Checkbox className="h-4 w-4 rounded-sm" />
                Remember this device
              </label>
              <Link to="/help/login" className="text-[#2563eb] transition hover:text-[#1d4ed8]">
                Forgot password?
              </Link>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="flex items-center justify-between gap-2 text-base font-semibold">
              <span>{loading ? "Continuing..." : "Continue"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--muted)]">Need help? Contact your team administrator.</p>
          </div>
        </Card>
        <details className="max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4 text-sm">
          <summary className="flex cursor-pointer items-center justify-between text-[var(--text)]">
            Quick demo users
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="mt-3 space-y-2">
            {mockUsers.map((user) => (
              <button
                type="button"
                key={user.email}
                onClick={() => handlePrefill(user.email)}
                className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-[var(--border)]"
              >
                <div>
                  <p className="font-semibold text-[var(--text)]">{user.name}</p>
                  <p className="text-xs text-[var(--muted)]">{user.email}</p>
                </div>
                <span className={`text-xs font-semibold uppercase ${roleVariant[user.role]}`}>
                  {user.role}
                </span>
              </button>
            ))}
            <p className="text-xs text-[var(--muted)]">
              Password for all users: <strong>Passw0rd!</strong> (demo only, not secure)
            </p>
          </div>
        </details>
      </div>
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-[#fefefe] via-[#f2f5ff] to-[#e0e7ff] px-6 py-8 sm:px-8 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.25),transparent_45%),radial-gradient(circle_at_80%_5%,rgba(79,70,229,0.12),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[repeating-radial-gradient(circle,rgba(15,23,42,0.06)_0_1px,transparent_1px_6px)]" />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 text-center">
          {/* Lottie animation container */}
          <div ref={animRef} className="h-[380px] w-[380px] sm:h-[420px] sm:w-[420px]" />
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#6366f1]/80">ROYAL CYBER AIOPS</p>
          <h2 className="text-3xl font-semibold text-[var(--text)]">Actionable intelligence for every service</h2>
          <p className="max-w-xs text-sm text-[var(--muted)]">
            Continuous monitoring, anomaly detection, and automation prompts keep your estate resilient without the
            noise.
          </p>
        </div>
      </div>
    </div>
  );
}
