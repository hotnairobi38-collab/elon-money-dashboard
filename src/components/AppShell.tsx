import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Home, Globe, Wallet, History, ShieldCheck, Plus, Menu, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/queries";

const item = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent";
const active = { className: "bg-primary text-primary-foreground hover:bg-primary" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border px-2 py-4">
      <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useQuery(meQuery);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-border bg-sidebar">
        <div className="flex w-56 items-center gap-3 px-4 md:border-r md:border-border md:h-full">
          <button onClick={() => setOpen(!open)} className="text-primary md:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></button>
          <Link to="/dashboard" className="text-lg font-bold">SockGate Shop</Link>
        </div>
        <div className="ml-auto flex items-center gap-3 px-4">
          <Link to="/add-balance" className="flex items-center gap-2 rounded-full bg-background px-3 py-1 font-medium text-success">
            ${(me?.balance ?? 0).toFixed(2)} <Plus className="h-4 w-4" />
          </Link>
          <button onClick={signOut} title="Logout" className="flex h-9 w-9 items-center justify-center rounded-full bg-background font-bold uppercase">
            {me?.username?.[0] ?? <LogOut className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <aside className={`fixed bottom-0 left-0 top-14 z-20 w-56 overflow-y-auto border-r border-border bg-sidebar transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-2 py-4">
          <Link to="/dashboard" className={item} activeProps={active}><Home className="h-4 w-4" />Dashboard</Link>
        </div>
        <Section title="Purchase Socks5">
          <Link to="/shop" className={item} activeProps={active}><Globe className="h-4 w-4" />Socks5 Shop</Link>
        </Section>
        <Section title="Account Management">
          <Link to="/add-balance" className={item} activeProps={active}><Wallet className="h-4 w-4" />Add Balance</Link>
          <Link to="/transactions" className={item} activeProps={active}><History className="h-4 w-4" />Transaction History</Link>
          <button onClick={signOut} className={`${item} w-full`}><LogOut className="h-4 w-4" />Logout</button>
        </Section>
        {me?.isAdmin && (
          <Section title="Admin">
            <Link to="/admin" className={item} activeProps={active}><ShieldCheck className="h-4 w-4" />Review Deposits</Link>
          </Section>
        )}
      </aside>

      <main className="px-4 pb-10 pt-20 md:ml-56 md:px-8" onClick={() => setOpen(false)}>{children}</main>
    </div>
  );
}

export function NoteBox() {
  return (
    <div className="border-l-4 border-note-accent bg-note-accent/10 p-4 text-sm">
      <p className="text-lg font-medium text-note-accent">⚠ Note</p>
      <p className="mt-1">SockGate only uses this domain:</p>
      <span className="mt-3 inline-block rounded border border-note-accent/50 bg-note-accent/20 px-3 py-1.5">https://sockgate.example/</span>
      <p className="mt-3">All other domains are fake. Use proxies only for lawful purposes.</p>
    </div>
  );
}
