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

- Keep TanStack Start file-based routing and the existing Vite bootstrap; the platform requires this routing/runtime structure.
- Put all demo data and mutations behind typed Promise-returning services in `src/lib/services`; this keeps a later Firebase adapter independent of UI code.
- Use a shared React context for the active circle, demo user, and theme; restore local demo preferences after hydration to prevent SSR mismatches.
- Keep financial display and role visibility in shared components; this centralizes Indian money formatting and privacy rules.
