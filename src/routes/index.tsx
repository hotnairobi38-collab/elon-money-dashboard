import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SockGate Proxy — Login" },
      { name: "description", content: "Sign in to SockGate to buy fast, reliable SOCKS5 proxies." },
      { property: "og:title", content: "SockGate Proxy — Login" },
      { property: "og:description", content: "Fast, reliable SOCKS5 proxies. Sign in to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const domains = ["https://sockgate.example/"];

function Index() {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4 py-16"
      style={{ backgroundImage: "radial-gradient(ellipse at top, var(--glow), transparent 60%)" }}
    >
      <div className="w-full max-w-[430px] rounded-xl border border-border bg-card p-8 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-foreground">SockGate Proxy Shop</h2>
        <h1 className="mt-3 text-center text-2xl font-bold text-foreground">
          {mode === "login" ? "Login" : "Register"}
        </h1>

        <div className="mt-8 border-l-4 border-note-accent bg-note p-4">
          <div className="flex items-center gap-2 text-lg font-bold text-note-accent">
            <AlertTriangle className="h-5 w-5" /> Note
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            We sell SOCKS5 proxies only. Our official domain:
          </p>
          <div className="mt-3 space-y-3">
            {domains.map((d) => (
              <span key={d} className="inline-block border border-note-accent/50 bg-note-accent/20 px-2 py-1 text-xs text-primary-foreground">
                {d}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Any other domain is not ours. Use proxies only for lawful purposes.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          {["Username", "Password", ...(mode === "register" ? ["Confirm password"] : [])].map((l) => (
            <label key={l} className="block text-sm text-foreground/80">
              {l} <span className="text-destructive">*</span>
              <input
                required
                type={l.toLowerCase().includes("password") ? "password" : "text"}
                className="mt-2 block h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          ))}
          {mode === "login" && (
            <label className="flex items-center gap-3 text-sm text-foreground/80">
              <input type="checkbox" className="h-4 w-4" /> Remember me
            </label>
          )}
          <button className="h-9 w-full rounded-md bg-primary text-sm text-primary-foreground hover:opacity-90">
            {mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-8 text-primary hover:underline"
        >
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        </button>
      </div>
    </div>
  );
}
