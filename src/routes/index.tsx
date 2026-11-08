import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { USERNAME_RE, normalizeUsername, usernameToEmail } from "@/lib/auth";
import { AlertTriangle, Globe, ShieldCheck, User, Lock, Zap, Loader2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { domainQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeepShop — Sign in" },
      { name: "description", content: "Sign in to DeepShop to buy fast, reliable SOCKS5 proxies." },
      { property: "og:title", content: "DeepShop — Sign in" },
      { property: "og:description", content: "Fast, reliable SOCKS5 proxies. Sign in to your DeepShop account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
  loader: ({ context }) => context.queryClient.ensureQueryData(domainQuery),
});

const perks = [
  { icon: Globe, text: "SOCKS5 proxies in 20+ countries" },
  { icon: Zap, text: "Instant delivery after approval" },
  { icon: ShieldCheck, text: "Crypto top-ups, verified by hand" },
];

function Field({ label, name, type = "text", icon: Icon, autoComplete }: { label: string; name: string; type?: string; icon: typeof User; autoComplete?: string }) {
  return (
    <label className="block text-sm font-medium text-foreground/80">
      {label} <span className="text-destructive">*</span>
      <span className="relative mt-1.5 block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          required
          name={name}
          type={type}
          autoComplete={autoComplete}
          className="block h-11 w-full rounded-lg border border-input bg-background/60 pl-10 pr-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </span>
    </label>
  );
}

function Index() {
  const { data: officialDomain } = useSuspenseQuery(domainQuery);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard" }); });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const username = normalizeUsername(String(f.get("Username") ?? ""));
    const password = String(f.get("Password") ?? "");
    if (!USERNAME_RE.test(username)) { toast.error("Username: 3-20 letters, numbers or _"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    try {
      if (mode === "register") {
        if (password !== String(f.get("Confirm password"))) { toast.error("Passwords don't match"); return; }
        const { error } = await supabase.auth.signUp({ email: usernameToEmail(username), password, options: { data: { username } } });
        if (error) { toast.error(/registered/i.test(error.message) ? "Username already taken" : error.message); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
        if (error) { toast.error("Wrong username or password"); return; }
      }
      navigate({ to: "/dashboard" });
    } finally { setBusy(false); }
  }

  return (
    <div
      className="dark flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, var(--glow), transparent 70%)" }}
    >
      <div className="w-full max-w-[440px]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Globe className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">DeepShop</h1>
          <p className="mt-1 text-sm text-muted-foreground">Premium SOCKS5 proxies</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-7 shadow-2xl backdrop-blur">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`h-9 rounded-md text-sm font-medium transition ${mode === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-lg border-l-4 border-note-accent bg-note p-4">
            <div className="flex items-center gap-2 font-bold text-note-accent">
              <AlertTriangle className="h-4 w-4" /> Note
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              We sell SOCKS5 proxies only. Our one and only official domain:
            </p>
            <span className="mt-2.5 inline-block max-w-full break-all rounded border border-note-accent/50 bg-note-accent/20 px-2.5 py-1 font-mono text-xs text-foreground">
              {officialDomain}
            </span>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Any other domain is fake. Use proxies only for lawful purposes.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Username" name="Username" icon={User} autoComplete="username" />
            <Field label="Password" name="Password" type="password" icon={Lock} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode === "register" && (
              <Field label="Confirm password" name="Confirm password" type="password" icon={Lock} autoComplete="new-password" />
            )}
            {mode === "login" && (
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 rounded accent-[var(--primary)]" /> Remember me
              </label>
            )}
            <button
              disabled={busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {perks.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-xs text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0 text-primary" /> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
