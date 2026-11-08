<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Login is username-only: auth uses a derived internal email (`src/lib/auth.ts`); never ask users for email. Why: owner chose username login.
- The first account to sign up gets the admin role (signup trigger); roles live only in `user_roles`. Why: owner reviews deposits.
- Balance changes only through security-definer DB functions (`review_deposit`, `checkout_cart`, `review_order`). Checkout is atomic, idempotent, and enforces catalog prices server-side; never restore client-priced `place_order`. Why: clients must never write balances or choose prices.
- Cart stores only sample IDs scoped to the signed-in user; orders have their own authenticated page and owner-filtered read path. Why: admin-wide reads must not leak into personal orders.
- Official domain is public site settings, read through a public server function for SSR and editable only through admin RLS. Why: login and dashboard share one owner-controlled value.
- Manual order delivery uses the admin-only `deliver_order` RPC to atomically approve and save details; orders remain read-only to clients with owner/admin RLS. Why: customers cannot change their credentials or fulfillment status.
