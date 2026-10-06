# Qard Hasan Circles

An interest-free community lending frontend with simulated funds. This foundation includes a role-aware shared shell, overview, mock records, dark mode, and locally persisted demo profiles. All accounts and transactions are fictional.

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Demo data and future Firebase integration

Typed service contracts are in `src/lib/services/index.ts`; seed records are in `src/data/seed.ts`. Replace the service implementations with Firebase/Firestore adapters returning the same typed Promises. Views use shared query definitions and do not import seed records. The demo session and theme are restored in `src/lib/demo-context.tsx` after hydration.

The seed contains 12 members, 14 contributions, six loans, their installments, and 40 ledger entries reconciling to ₹1,50,000. Ledger fingerprints are deterministic demo checks, not secure cryptographic hashes. Privacy gates are presentation-only; real authentication and access controls must be implemented before connecting real data.

Run tests with `npm test`. Contribution submission, loan application, approval workflows, real authentication, and Firebase are deferred beyond this foundation stage.
