import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ShopHeader({ username, balance, isAdmin }: { username?: string; balance?: number; isAdmin?: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/dashboard" className="font-bold text-foreground">SockGate</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-primary" }}>Dashboard</Link>
          {isAdmin && <Link to="/admin" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-primary" }}>Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{username}</span>
          <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">${(balance ?? 0).toFixed(2)}</span>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground">Logout</button>
        </div>
      </div>
    </header>
  );
}
