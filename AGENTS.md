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
- Balance changes only through the `review_deposit` database function. Why: clients must never write balances.
