# Qard Hasan Circles: Product Requirements Document

**Version:** 1.0 (Hackathon MVP) | **Type:** Full-stack web app | **Money movement:** Simulated ledger (no real payments)

---

## 1. Overview

Qard Hasan Circles is a web platform where a mosque or community committee runs a **riba-free community lending pool**. Members contribute regularly to a shared fund. Members in genuine need can request an interest-free loan (qard hasan) from that pool, repay only the principal, and every transaction is recorded in a transparent, tamper-evident ledger.

**One-line pitch:** A digital, transparent, interest-free savings and lending circle for the community, anchored by a trusted local committee.

## 2. Problem

- Community members facing medical emergencies, education fees, or small-business needs often turn to interest-based lenders or informal moneylenders.
- Traditional chit funds and informal "kuri" circles run on notebooks and WhatsApp. They lack transparency, records, and dispute resolution, and some involve interest or hidden charges.
- Existing fintech lending is riba-based, and there is no simple tool for committees to run a qard hasan fund with accountability.

## 3. Goals and Non-Goals

**Goals**

1. Let a committee create and run a circle with clear, enforced riba-free rules.
2. Give every member full visibility of the pool, contributions, and loans (amanah).
3. Handle the full loan lifecycle: request, committee approval, disbursal, repayment, and default handling.
4. Be demonstrable end to end, live, in under 5 minutes.

**Non-Goals (MVP)**

- Real payment gateway or bank integration (ledger is simulated).
- Automated fatwa or fiqh rulings.
- Credit scoring, interest, late fees, or any lender profit.
- Native mobile apps (responsive web only).

## 4. Users and Roles

| Role | Description | Key permissions |
| --- | --- | --- |
| **Super Admin** | Platform owner (demo only) | Create/approve circles |
| **Circle Admin / Committee** | Mosque or mahallu committee member | Verify members, approve loans, record repayments, publish reports |
| **Member** | Verified community member | Contribute, request loans, view ledger, repay |
| **Guarantor** | An existing member vouching for a borrower | Confirm guarantee on a loan |
| **Auditor / Viewer** (optional) | Scholar or elder reviewing | Read-only access to rules and ledger |

## 5. Core Concept and Rules (Shariah-Aligned Design)

These are enforced in code, not just described.

1. **No interest, ever.** Repayment total must equal principal. The system rejects any loan where `total_repayable != principal`.
2. **No fees that benefit the lender.** Loan has no processing fee. Optional separate **voluntary donation to the pool** is allowed, kept clearly distinct from the loan and never tied to approval.
3. **No penalties that become income.** Late payments trigger reminders and committee follow-up, not fines. Optional rescheduling is available.
4. **Documented agreement.** Every loan has a written record (amount, schedule, witnesses/guarantor), reflecting the Quranic emphasis on documenting debts (2:282).
5. **Ease for those in hardship.** Committee can reschedule or write off a loan, which is recorded as a distinct entry (waiver or sadaqah).
6. **Transparency.** All members can see pool balance, number of loans, and repayment rate (individual borrower details visible only to committee, for privacy).
7. **Scholar review.** Rules page shows "Reviewed by \[scholar name\]" (add a real review before the demo).

## 6. Scope: MVP Feature List

### P0: Must have

- **Auth and roles:** email/password sign-up, role-based access.
- **Circle management:** create a circle, set rules (min contribution, contribution frequency, max loan size, max repayment months), invite members via link or code.
- **Member verification:** committee approves join requests (KYC-lite: name, phone, mahallu/address, ID note).
- **Contributions:** members log a contribution; committee confirms receipt; pool balance updates.
- **Loan request:** amount, purpose category, repayment plan, optional guarantor.
- **Loan approval workflow:** committee reviews, approves, rejects (with reason), or asks for changes. Approval is blocked if the amount exceeds the available pool.
- **Disbursal and repayment tracking:** auto-generated installment schedule, repayments recorded with confirmation, outstanding balance computed.
- **Transparent ledger:** append-only ledger of every pool event, with a running balance.
- **Dashboards:** member dashboard and committee dashboard.
- **Rules page** with the Shariah principles above.

### P1: Should have

- Reminders (in-app and email) for upcoming and overdue installments.
- Default/hardship handling: reschedule, waive, mark as sadaqah.
- Pool health summary (total contributed, lent out, repaid, available).
- PDF/CSV export of the ledger for audits.
- Malayalam/Hindi/English toggle (at least for key screens).
- Voluntary donation to the pool ("sadaqah jariyah" option).

### P2: Stretch

- **Rotation mode** (classic rotating savings circle: each member receives the full pot in turn).
- Emergency fast-track loan with a smaller cap.
- Member trust badge based on repayment history (non-financial, no scoring for denial).
- Hash-chained ledger entries to show tamper evidence.
- WhatsApp share link for a circle's public summary.

## 7. User Flows

**Flow A: Committee creates a circle** Sign up, create circle, set rules, invite members, approve join requests.

**Flow B: Member contributes** Open circle, add contribution, committee confirms, ledger entry created, pool balance updates.

**Flow C: Loan lifecycle** Member submits request, guarantor confirms (if required), committee reviews and approves, disbursal logged, schedule generated, member repays installments, committee confirms each, loan closes.

**Flow D: Hardship** Member flags difficulty, committee reschedules or waives, ledger records the change, dashboard reflects it.

## 8. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Users can register and log in; roles are enforced on every API route | P0 |
| FR-2 | Admin can create a circle with configurable rule parameters | P0 |
| FR-3 | Join requests require committee approval | P0 |
| FR-4 | Contributions are recorded as pending and become confirmed upon admin action | P0 |
| FR-5 | Loan request validates: amount ≤ max loan, amount ≤ available pool, no active default | P0 |
| FR-6 | System enforces `total_repayable == principal` and rejects fees/interest fields | P0 |
| FR-7 | On approval, generate equal installment schedule with due dates | P0 |
| FR-8 | Ledger is append-only; corrections are made by reversing entries, never edits | P0 |
| FR-9 | Pool balance = confirmed contributions + repayments, minus disbursals | P0 |
| FR-10 | Members see pool-level stats; borrower identity is visible only to committee and guarantor | P0 |
| FR-11 | Overdue installments trigger reminders, never penalties | P1 |
| FR-12 | Committee can reschedule or waive with a mandatory reason | P1 |
| FR-13 | Ledger export to PDF/CSV | P1 |
| FR-14 | Multi-language UI toggle | P1 |

## 9. Non-Functional Requirements

- **Security:** hashed passwords (bcrypt/argon2), JWT or session auth, role checks server-side, input validation, rate limiting on auth routes.
- **Privacy:** loan details and personal data visible on a need-to-know basis only.
- **Auditability:** every state change writes an audit log with actor and timestamp.
- **Performance:** pages load in under 2 seconds on a mid-range phone.
- **Responsive:** mobile-first layout.
- **Deployability:** live public URL with seeded demo data.

## 10. Recommended Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React (Vite) or Next.js + Tailwind | Fast to build, easy deploy |
| Backend | Node.js + Express (or Next.js API routes) | Single-language stack |
| Database | PostgreSQL (Supabase/Neon) | Relational data and transactions suit a ledger |
| ORM | Prisma | Quick schema and migrations |
| Auth | JWT with bcrypt, or Supabase Auth | Less time spent on auth |
| Email | Resend or Nodemailer | Reminders |
| PDF export | pdfkit / react-pdf | Ledger export |
| Hosting | Vercel (frontend) + Render/Railway (backend) or Vercel full-stack | Free tiers |

**Rule of thumb:** use the stack your team already knows. Do not learn a new framework during the hackathon.

## 11. Data Model

```
User(id, name, email, phone, password_hash, created_at)

Circle(id, name, description, mosque_name, min_contribution,
       contribution_frequency, max_loan_amount, max_repayment_months,
       invite_code, created_by, created_at)

Membership(id, user_id, circle_id, role[ADMIN|MEMBER|AUDITOR],
           status[PENDING|ACTIVE|REMOVED], joined_at)

Contribution(id, circle_id, member_id, amount, type[REGULAR|VOLUNTARY],
             status[PENDING|CONFIRMED|REJECTED], confirmed_by, created_at)

Loan(id, circle_id, borrower_id, guarantor_id, principal, purpose,
     months, status[REQUESTED|GUARANTOR_PENDING|APPROVED|REJECTED|
     ACTIVE|CLOSED|RESCHEDULED|WAIVED], decision_note, created_at)

Installment(id, loan_id, due_date, amount, status[DUE|PAID|OVERDUE|WAIVED],
            paid_at, confirmed_by)

LedgerEntry(id, circle_id, type[CONTRIBUTION|DISBURSAL|REPAYMENT|WAIVER|
            REVERSAL], amount, direction[IN|OUT], reference_id,
            balance_after, prev_hash, hash, created_at)

AuditLog(id, actor_id, action, entity, entity_id, metadata, created_at)
```

**Key invariant:** `balance_after` is computed server-side inside a database transaction. The client never sets it.

## 12. API Outline (REST)

```
POST   /auth/register          POST /auth/login
POST   /circles                GET  /circles/:id
POST   /circles/:id/join       PATCH /memberships/:id        (approve/reject)
POST   /circles/:id/contributions    PATCH /contributions/:id/confirm
POST   /circles/:id/loans      PATCH /loans/:id/guarantee
PATCH  /loans/:id/decision     (approve/reject)
GET    /loans/:id/schedule     PATCH /installments/:id/pay
PATCH  /installments/:id/confirm
POST   /loans/:id/reschedule   POST /loans/:id/waive
GET    /circles/:id/ledger     GET  /circles/:id/ledger/export
GET    /circles/:id/stats
```

## 13. Screens

1. Landing page with the concept and rules summary
2. Login / Register
3. My Circles (list and join by code)
4. Circle dashboard (pool balance, active loans, repayment rate, recent ledger)
5. Contribute screen
6. Request loan form (with a live "total repayable = principal" indicator)
7. Committee console (pending members, contributions, loan requests)
8. Loan detail (timeline, schedule, repayment actions)
9. Ledger page (filterable, exportable)
10. Rules and Shariah principles page

## 14. Build Plan

| Phase | Work | Output |
| --- | --- | --- |
| **1. Foundation** | Repo, DB schema, auth, roles, seed script | Login works, roles enforced |
| **2. Circle core** | Create circle, join and approve, contributions, pool balance | Money-in flow works |
| **3. Loan engine** | Request, approval, schedule, repayment, ledger entries | Full loan lifecycle |
| **4. Dashboards and UI polish** | Member and committee dashboards, ledger page, rules page | Demo-ready UI |
| **5. P1 extras** | Reminders, waive/reschedule, export, language toggle | Differentiators |
| **6. Ship** | Deploy, seed demo data, test, record videos | Live link and source code |

**Split for a team of 3:** one on backend and ledger logic, one on frontend and dashboards, one on UI/UX, seed data, rules content, scholar review, and demo video.

## 15. Demo Scenario (for the videos)

**Story:** *Rahim, a member of a mahallu circle, needs ₹30,000 for his mother's surgery.*

1. The committee shows the circle with its rules and pool balance (₹1,50,000).
2. Rahim submits a loan request with a guarantor.
3. The guarantor confirms; the committee approves.
4. The ledger shows the disbursal, and the balance updates.
5. Rahim pays an installment; the committee confirms it, and the ledger and dashboard update.
6. **The "wow" moment:** try to enter a loan with a ₹500 "processing fee" and watch the system block it, showing the riba-free rule in action.
7. Show a hardship case being rescheduled with no penalty.
8. Export the ledger as a PDF.

## 16. Success Metrics (for judging)

- End-to-end loan lifecycle works live.
- Zero ways to enter interest or fees (demonstrated).
- Ledger balance always reconciles with the sum of entries.
- Seeded demo with at least 10 members, 5 loans in different states.
- Clear mention of scholar review and committee-as-guarantor trust model.

## 17. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Fiqh objections (fees, guarantees, penalties) | No fees, no fines, committee as guarantor, scholar review line, clear disclaimer |
| Default risk | Guarantor requirement, caps on loan size relative to the pool, hardship reschedule |
| Trust and fraud | Committee verification, append-only ledger, audit logs |
| Scope creep | Freeze P0 first; build P1 only when the P0 flow demos cleanly |
| Real money regulation | Keep it simulated; state that real deployment needs legal and scholar review |
| Privacy of borrowers | Pool-level stats for members; identity visible only to committee and guarantor |

## 18. Open Questions (decide as a team)

1. **Pool-based loans only, or add rotation mode?** Recommendation: pool-based for MVP, rotation as a stretch.
2. Is the guarantor mandatory for all loans or only above a threshold?
3. What loan cap relative to the pool (for example, 20% of the available balance)?
4. Which regional language for the toggle?
5. Who is the scholar for the review line?

## 19. Disclaimer

This is a hackathon prototype using a simulated ledger. It does not move real money. Any real-world deployment would require Shariah scholar review and compliance with local financial and cooperative regulations.