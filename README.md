# Qard Hasan Circles (ഖർദ് ഹസൻ സർക്കിൾ / क़र्द हसन सर्कल्स)

> **A digital, transparent, interest-free savings and community lending circle anchored by trusted local mosque & mahallu committees.**  
> *"A little from each of us. A world of difference for one of us."*

---

## 📖 Overview

**Qard Hasan Circles** is a full-stack web platform enabling communities to pool funds and provide **100% interest-free loans (*qard hasan*)** to members facing medical emergencies, education costs, small business needs, or urgent family hardship.

Every movement of money is documented in an **append-only, tamper-evident ledger** with cryptographic hash verification, enforcing absolute transparency and strict adherence to Shariah principles.

---

## 🕌 Guiding Shariah Principles (Enforced in Code)

These rules are strictly validated by the application logic:

1. **Zero Interest (Riba-Free)**: The system enforces that `total_repayable == principal`. Any interest percentage is strictly blocked.
2. **No Lender-Benefit Fees**: Zero processing fees, application charges, or hidden administrative costs.
3. **No Penalties or Late Fines**: Late repayments never generate income or penalties. Hardship is met with rescheduling or charitable write-offs.
4. **Documented Agreements**: Reflecting Quran 2:282, every loan, schedule, guarantor, and disbursement is immutably documented.
5. **Ease in Hardship**: Committees can reschedule repayment timelines or waive remaining balances as community *Sadaqah*.
6. **Amanah & Transparency**: Pool-level statistics are visible to all members, while individual borrower reasons remain private to protect dignity.

---

## 👥 How It Works for Everyone

| Role | Who It's For | What They Can Do |
|---|---|---|
| **Community Member** | Verified local residents & participants | • Make regular monthly pool contributions or voluntary *Sadaqah Jariyah* donations.<br>• Submit interest-free loan requests with chosen tenure (1–12 months).<br>• View personalized repayment schedules and record monthly installment payments.<br>• View transparent pool health and growth trends. |
| **Committee Admin** | Mosque or Mahallu committee leaders | • Review loan applications and verify community need.<br>• **Approve & Disburse** loans with automatic ledger recording and pool balance updates.<br>• Confirm member contributions.<br>• Grant compassionate **hardship rescheduling or Sadaqah waivers**.<br>• Approve new member join requests (KYC-lite). |
| **Guarantor** | Trusted community members vouching for borrowers | • Review guarantee requests from neighbors or family.<br>• **Vouch & Confirm Guarantee** with a single click to route requests to the committee. |
| **Auditor / Scholar** | Local Islamic scholars & financial reviewers | • Read-only audit access to the full cryptographic ledger and balance reconciliation.<br>• Export CSV and printable audit reports for community meetings. |

---

## ✨ Key Features

### 1. Interactive Loan Lifecycle Engine
- **Request Loan Modal**: Dynamic amount slider, purpose categories (Medical, Tuition, Business, Home Repair), tenure selector, and guarantor assignment.
- **Anti-Riba Calculation Widget**: Live breakdown showing `Principal == Total Repayable`, `Interest = ₹0`, and `Fees = ₹0`.
- **Anti-Fee Rule Tester**: Toggle a simulated ₹500 fee to watch the system actively reject the submission with a Shariah violation warning.
- **Installment Tracker**: View upcoming dues, paid history, and make one-click installment repayments.

### 2. Community Contributions & Sadaqah Jariyah
- Support for **Regular Monthly Contributions** and **Voluntary Sadaqah Jariyah** pool gifts.
- Real-time pool balance updates with automated ledger reconciliation.

### 3. Transparent, Tamper-Evident Ledger
- Reconciled record of every Contribution, Disbursement, Repayment, and Hardship Waiver.
- **Hash-Chaining & Fingerprint Verification**: Validates the sequential integrity of all entries (`LE-001` to `LE-040+`).
- **Audit Export**: One-click **CSV Export** and **Printable Audit Sheet**.

### 4. 🌍 Trilingual Localization
- Instant language toggle in the navigation bar supporting:
  - **English** (`en`)
  - **Malayalam (മലയാളം)** (`ml`)
  - **Hindi (हिन्दी)** (`hi`)

### 5. 🌐 Public Landing Page & Educational Gateway (`/welcome`)
- **Community Introduction**: Explains the core purpose of Mahallu Qard Hasan Circles, citing Quran 57:11 and 2:282.
- **Interactive Anti-Riba Comparison Calculator**: Live comparison demonstrating the cost of conventional microfinance (24%–36% APR + fees) vs. 100% zero-interest, zero-fee community lending.
- **The 4 Pillars Breakdown**: Mutual Pooling, Dignified Borrowing, Guarantor Vouching (*Kafalah*), and Cryptographic Ledger (*Amanah*).
- **FAQ Accordion**: Comprehensive answers to questions on Shariah compliance, default handling, and transparency.

### 6. 🔐 Complete Authentication System (`/auth` & Global Auth Modal)
- **Firebase Authentication**: Full integration with Email/Password and one-click Google OAuth.
- **Join Circle / Registration**: Easy registration with full name, email, role selection, and Mahallu invite code (`MAHALLU-2026`).
- **Password Reset Flow**: Integrated password reset email sender via Firebase `sendPasswordResetEmail`.
- **Instant Demo Persona Switcher**: One-click preset authentication as *Committee Admin*, *Member*, *Guarantor*, or *Auditor*.
- **Live Auth Synchronization**: Seamless real-time state sync across Firebase Auth, Firestore user profiles, and React Context.

### 7. ⚡ 5-Minute Guided Live Demo Tour
- A built-in interactive tour for judges and evaluators demonstrating Rahim's ₹30,000 surgery loan story step-by-step:
  1. *Pool Solvency Overview* (₹1,50,000)
  2. *Rahim's Medical Request*
  3. *Guarantor Yusuf Ali Vouching*
  4. *Committee Admin Disbursal*
  5. *Zero-Interest Installment Repayment*
  6. *Anti-Riba Fee Rejection Demonstration*

### 8. 🔥 Firebase Cloud Database (Firestore)
- **Firestore DB**: Cloud persistence across `circles`, `users`, `memberships`, `contributions`, `loans`, `installments`, and `ledger`.
- **One-Click Firestore Sync / Re-seed**: Sync or reset collections directly from the Settings page.

---

## 🛠️ Technology Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (File-based routing & SSR hydration)
- **Runtime & Bundler**: [Vite 8](https://vitejs.dev/) + [Nitro](https://nitro.unjs.io/) Cloudflare Module Preset
- **Language**: TypeScript 5.8
- **UI & Styling**: React 19, Tailwind CSS v4, Radix UI primitives, Lucide Icons
- **Data Visualization**: Recharts (Growth trends & repayment health gauge)
- **Backend & Persistence**: Firebase v12 (Firestore Database & Firebase Auth)
- **Testing**: Vitest + Testing Library

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ and npm installed.

### 1. Clone & Install
```bash
git clone https://github.com/halloitsrizvan/qard-hasan-circle.git
cd qard-circle-ui
npm install
```

> **Note**: `.npmrc` is pre-configured with `legacy-peer-deps=true` for seamless dependency resolution.

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Test Suite
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔒 Security & Fiqh Disclaimer

This project is a functional prototype built for demonstration and evaluation. Simulated transactions mirror real cooperative community funds. Real-world deployment requires local Shariah advisory board review and compliance with applicable cooperative society regulations.
