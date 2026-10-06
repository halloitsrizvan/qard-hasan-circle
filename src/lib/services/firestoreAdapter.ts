import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  circle as defaultCircle,
  users as defaultUsers,
  memberships as defaultMemberships,
  contributions as defaultContributions,
  loans as defaultLoans,
  installments as defaultInstallments,
  ledger as defaultLedger,
  overview as defaultOverview,
  fingerprint
} from '@/data/seed';
import type {
  Circle,
  User,
  Membership,
  Contribution,
  Loan,
  Installment,
  LedgerEntry,
  Overview,
  Role,
  Status
} from '@/lib/types';

// Collection references
const CIRCLES_COL = 'circles';
const USERS_COL = 'users';
const MEMBERSHIPS_COL = 'memberships';
const CONTRIBUTIONS_COL = 'contributions';
const LOANS_COL = 'loans';
const INSTALLMENTS_COL = 'installments';
const LEDGER_COL = 'ledger';
const OVERVIEW_COL = 'overview';

let isSeeding = false;
let hasCheckedSeed = false;

// In-memory active cache for snappy offline/demo interaction
let localCircle = structuredClone(defaultCircle);
let localUsers = structuredClone(defaultUsers);
let localMemberships = structuredClone(defaultMemberships);
let localContributions = structuredClone(defaultContributions);
let localLoans = structuredClone(defaultLoans);
let localInstallments = structuredClone(defaultInstallments);
let localLedger = structuredClone(defaultLedger);
let localOverview = structuredClone(defaultOverview);

/**
 * Seed Firestore with initial Qard Hasan Circle dataset if not already populated.
 */
export async function seedFirestore(force = false): Promise<{ success: boolean; message: string }> {
  if (isSeeding) return { success: false, message: 'Seeding is already in progress.' };
  isSeeding = true;

  try {
    const circleDocRef = doc(db, CIRCLES_COL, defaultCircle.id);
    const circleSnap = await getDoc(circleDocRef);

    if (circleSnap.exists() && !force) {
      isSeeding = false;
      hasCheckedSeed = true;
      return { success: true, message: 'Firestore is already seeded with data.' };
    }

    const batch = writeBatch(db);

    batch.set(circleDocRef, defaultCircle);

    for (const u of defaultUsers) {
      batch.set(doc(db, USERS_COL, u.id), u);
    }
    for (const m of defaultMemberships) {
      batch.set(doc(db, MEMBERSHIPS_COL, m.id), m);
    }
    for (const c of defaultContributions) {
      batch.set(doc(db, CONTRIBUTIONS_COL, c.id), c);
    }
    for (const l of defaultLoans) {
      batch.set(doc(db, LOANS_COL, l.id), l);
    }
    for (const inst of defaultInstallments) {
      batch.set(doc(db, INSTALLMENTS_COL, inst.id), inst);
    }
    for (const entry of defaultLedger) {
      batch.set(doc(db, LEDGER_COL, entry.id), entry);
    }
    batch.set(doc(db, OVERVIEW_COL, 'summary'), defaultOverview);

    await batch.commit();
    hasCheckedSeed = true;
    isSeeding = false;

    // Reset local cache to defaults
    localCircle = structuredClone(defaultCircle);
    localUsers = structuredClone(defaultUsers);
    localMemberships = structuredClone(defaultMemberships);
    localContributions = structuredClone(defaultContributions);
    localLoans = structuredClone(defaultLoans);
    localInstallments = structuredClone(defaultInstallments);
    localLedger = structuredClone(defaultLedger);
    localOverview = structuredClone(defaultOverview);

    return { success: true, message: 'Successfully seeded all collections to Firestore!' };
  } catch (error) {
    isSeeding = false;
    console.warn('Firestore seeding notice (fallback to local seed active):', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown Firestore seeding error'
    };
  }
}

export async function ensureFirestoreInitialized() {
  if (!hasCheckedSeed && typeof window !== 'undefined') {
    try {
      await seedFirestore(false);
    } catch {}
  }
}

// Helper to append a verified ledger entry
async function appendLedgerEntry(entryData: {
  date: string;
  type: 'Contribution' | 'Disbursement' | 'Repayment';
  description: string;
  amount: number;
}): Promise<LedgerEntry> {
  const currentLedger = await fetchLedgerFromDB();
  const circle = await fetchCircleFromDB();
  const nextBalance = circle.balance + entryData.amount;
  const previousHash = currentLedger.length > 0 ? currentLedger[currentLedger.length - 1].hash : '00000000';
  const id = `LE-${String(currentLedger.length + 1).padStart(3, '0')}`;

  const payload = {
    id,
    date: entryData.date,
    type: entryData.type,
    description: entryData.description,
    amount: entryData.amount,
    balance: nextBalance,
    previousHash
  };
  const hash = fingerprint(JSON.stringify(payload));
  const newEntry: LedgerEntry = { ...payload, hash };

  localLedger.push(newEntry);
  localCircle.balance = nextBalance;

  try {
    await setDoc(doc(db, LEDGER_COL, id), newEntry);
    await updateDoc(doc(db, CIRCLES_COL, circle.id), { balance: nextBalance });
  } catch (err) {
    console.warn('Firestore ledger append fallback:', err);
  }

  return newEntry;
}

// ========================
// READ METHODS
// ========================

export async function fetchCircleFromDB(): Promise<Circle> {
  try {
    await ensureFirestoreInitialized();
    const snap = await getDoc(doc(db, CIRCLES_COL, defaultCircle.id));
    if (snap.exists()) {
      localCircle = snap.data() as Circle;
      return structuredClone(localCircle);
    }
  } catch (err) {
    console.warn('Using local circle cache:', err);
  }
  return structuredClone(localCircle);
}

export async function fetchMembersFromDB(): Promise<{ user: User; membership: Membership }[]> {
  try {
    await ensureFirestoreInitialized();
    const [userSnaps, memSnaps] = await Promise.all([
      getDocs(collection(db, USERS_COL)),
      getDocs(collection(db, MEMBERSHIPS_COL))
    ]);

    if (!userSnaps.empty && !memSnaps.empty) {
      const usersList: User[] = userSnaps.docs.map((d) => d.data() as User);
      const memList: Membership[] = memSnaps.docs.map((d) => d.data() as Membership);

      localUsers = usersList;
      localMemberships = memList;

      return memList.map((m) => {
        const user = usersList.find((u) => u.id === m.userId);
        if (!user) throw new Error(`User for membership ${m.id} not found`);
        return { user: structuredClone(user), membership: structuredClone(m) };
      });
    }
  } catch (err) {
    console.warn('Using local members cache:', err);
  }

  return localMemberships.map((m) => {
    const user = localUsers.find((u) => u.id === m.userId);
    if (!user) throw new Error('Membership user not found');
    return { membership: structuredClone(m), user: structuredClone(user) };
  });
}

export async function fetchOverviewFromDB(): Promise<Overview> {
  try {
    await ensureFirestoreInitialized();
    const snap = await getDoc(doc(db, OVERVIEW_COL, 'summary'));
    if (snap.exists()) {
      localOverview = snap.data() as Overview;
      return structuredClone(localOverview);
    }
  } catch (err) {
    console.warn('Using local overview cache:', err);
  }

  const confirmedContributions = localContributions
    .filter((c) => c.status === 'Paid')
    .reduce((s, c) => s + c.amount, 0);
  const activeLoans = localLoans.filter((l) => ['Active', 'Overdue', 'Closed'].includes(l.status));
  const lentOut = activeLoans.reduce((s, l) => s + l.amount, 0);
  const repaid = activeLoans.reduce((s, l) => s + l.repaid, 0);
  const available = localCircle.balance;
  const repaymentRate = lentOut > 0 ? Math.round((repaid / lentOut) * 100) : 100;

  return {
    contributed: confirmedContributions,
    lentOut,
    repaid,
    available,
    repaymentRate,
    trend: structuredClone(localOverview.trend)
  };
}

export async function fetchContributionsFromDB(): Promise<Contribution[]> {
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, CONTRIBUTIONS_COL));
    if (!snaps.empty) {
      localContributions = snaps.docs.map((d) => d.data() as Contribution);
      return structuredClone(localContributions);
    }
  } catch (err) {
    console.warn('Using local contributions cache:', err);
  }
  return structuredClone(localContributions);
}

export async function fetchLoansFromDB(): Promise<Loan[]> {
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, LOANS_COL));
    if (!snaps.empty) {
      localLoans = snaps.docs.map((d) => d.data() as Loan);
      return structuredClone(localLoans);
    }
  } catch (err) {
    console.warn('Using local loans cache:', err);
  }
  return structuredClone(localLoans);
}

export async function fetchInstallmentsFromDB(loanId: string): Promise<Installment[]> {
  try {
    await ensureFirestoreInitialized();
    const q = query(collection(db, INSTALLMENTS_COL), where('loanId', '==', loanId));
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      return snaps.docs.map((d) => d.data() as Installment);
    }
  } catch (err) {
    console.warn('Using local installments cache:', err);
  }
  return structuredClone(localInstallments.filter((i) => i.loanId === loanId));
}

export async function fetchLedgerFromDB(): Promise<LedgerEntry[]> {
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, LEDGER_COL));
    if (!snaps.empty) {
      const items = snaps.docs.map((d) => d.data() as LedgerEntry);
      localLedger = items.sort((a, b) => a.date.localeCompare(b.date));
      return structuredClone(localLedger);
    }
  } catch (err) {
    console.warn('Using local ledger cache:', err);
  }
  return structuredClone(localLedger);
}

export async function verifyLedgerInDB(): Promise<boolean> {
  const entries = await fetchLedgerFromDB();
  const circle = await fetchCircleFromDB();
  let total = 0;
  let previous = '00000000';

  for (const e of entries) {
    total += e.amount;
    const { hash, ...rest } = e;
    if (e.balance !== total || e.previousHash !== previous || hash !== fingerprint(JSON.stringify(rest))) {
      return false;
    }
    previous = hash;
  }
  return total === circle.balance;
}

export async function fetchUserByRoleFromDB(role: Role): Promise<User> {
  try {
    await ensureFirestoreInitialized();
    const q = query(collection(db, USERS_COL), where('role', '==', role));
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      return snaps.docs[0].data() as User;
    }
  } catch (err) {
    console.warn('User by role fallback:', err);
  }

  const index = role === 'Committee Admin' ? 0 : role === 'Member' ? 1 : role === 'Guarantor' ? 3 : 7;
  const user = localUsers[index] || defaultUsers[index];
  if (!user) throw new Error('User profile not found');
  return { ...structuredClone(user), role };
}

// ========================
// MUTATION METHODS
// ========================

export async function requestLoanInDB(params: {
  userId: string;
  amount: number;
  purpose: string;
  months: number;
  guarantorId: string;
}): Promise<Loan> {
  const count = localLoans.length + 1;
  const id = `QH-${String(count).padStart(3, '0')}`;
  const today = new Date().toISOString().slice(0, 10);
  const status: Status = params.guarantorId ? 'Guarantor pending' : 'Requested';

  const newLoan: Loan = {
    id,
    userId: params.userId,
    amount: params.amount,
    purpose: params.purpose,
    status,
    repaid: 0,
    months: params.months,
    date: today,
    guarantorId: params.guarantorId
  };

  localLoans.unshift(newLoan);

  const perMonth = Math.round(params.amount / params.months);
  const newInsts: Installment[] = Array.from({ length: params.months }, (_, i) => ({
    id: `${id}-${i + 1}`,
    loanId: id,
    amount: i === params.months - 1 ? params.amount - perMonth * (params.months - 1) : perMonth,
    dueDate: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString().slice(0, 10),
    status: 'Due'
  }));
  localInstallments.push(...newInsts);

  try {
    await setDoc(doc(db, LOANS_COL, id), newLoan);
    for (const inst of newInsts) {
      await setDoc(doc(db, INSTALLMENTS_COL, inst.id), inst);
    }
  } catch (err) {
    console.warn('Firestore requestLoan fallback:', err);
  }

  return structuredClone(newLoan);
}

export async function guaranteeLoanInDB(loanId: string, guarantorId: string): Promise<Loan> {
  const loan = localLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan not found');

  loan.status = 'Requested';
  loan.guarantorId = guarantorId;

  try {
    await updateDoc(doc(db, LOANS_COL, loanId), { status: 'Requested', guarantorId });
  } catch (err) {
    console.warn('Firestore guaranteeLoan fallback:', err);
  }

  return structuredClone(loan);
}

export async function approveAndDisburseLoanInDB(loanId: string): Promise<Loan> {
  const loan = localLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan not found');

  const circle = await fetchCircleFromDB();
  if (loan.amount > circle.balance) {
    throw new Error(`Insufficient pool funds. Available: ₹${circle.balance}`);
  }

  loan.status = 'Active';
  const today = new Date().toISOString().slice(0, 10);

  await appendLedgerEntry({
    date: today,
    type: 'Disbursement',
    description: `${loan.id} · principal disbursed`,
    amount: -loan.amount
  });

  try {
    await updateDoc(doc(db, LOANS_COL, loanId), { status: 'Active' });
  } catch (err) {
    console.warn('Firestore approveAndDisburseLoan fallback:', err);
  }

  return structuredClone(loan);
}

export async function rejectLoanInDB(loanId: string, _reason: string): Promise<Loan> {
  const loan = localLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan not found');

  loan.status = 'Waived';
  try {
    await updateDoc(doc(db, LOANS_COL, loanId), { status: 'Waived' });
  } catch (err) {
    console.warn('Firestore rejectLoan fallback:', err);
  }
  return structuredClone(loan);
}

export async function payInstallmentInDB(installmentId: string, loanId: string): Promise<Installment> {
  const inst = localInstallments.find((i) => i.id === installmentId);
  if (!inst) throw new Error('Installment not found');

  const loan = localLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan not found');

  inst.status = 'Paid';
  loan.repaid += inst.amount;
  if (loan.repaid >= loan.amount) {
    loan.status = 'Closed';
  }

  const today = new Date().toISOString().slice(0, 10);

  await appendLedgerEntry({
    date: today,
    type: 'Repayment',
    description: `${loan.id} · installment received`,
    amount: inst.amount
  });

  try {
    await updateDoc(doc(db, INSTALLMENTS_COL, installmentId), { status: 'Paid' });
    await updateDoc(doc(db, LOANS_COL, loanId), { repaid: loan.repaid, status: loan.status });
  } catch (err) {
    console.warn('Firestore payInstallment fallback:', err);
  }

  return structuredClone(inst);
}

export async function rescheduleLoanInDB(loanId: string, newMonths: number, _reason: string): Promise<Loan> {
  const loan = localLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan not found');

  loan.months = newMonths;

  const remaining = loan.amount - loan.repaid;
  const unpaidInsts = localInstallments.filter((i) => i.loanId === loanId && i.status !== 'Paid');
  const perMonth = unpaidInsts.length > 0 ? Math.round(remaining / unpaidInsts.length) : remaining;

  unpaidInsts.forEach((inst, i) => {
    inst.amount = i === unpaidInsts.length - 1 ? remaining - perMonth * (unpaidInsts.length - 1) : perMonth;
    inst.dueDate = new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString().slice(0, 10);
  });

  try {
    await updateDoc(doc(db, LOANS_COL, loanId), { months: newMonths });
  } catch (err) {
    console.warn('Firestore rescheduleLoan fallback:', err);
  }

  return structuredClone(loan);
}

export async function waiveLoanInDB(loanId: string, _reason: string): Promise<Loan> {
  const loan = localLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan not found');

  loan.status = 'Waived';
  localInstallments.filter((i) => i.loanId === loanId && i.status !== 'Paid').forEach((i) => (i.status = 'Waived'));

  try {
    await updateDoc(doc(db, LOANS_COL, loanId), { status: 'Waived' });
  } catch (err) {
    console.warn('Firestore waiveLoan fallback:', err);
  }

  return structuredClone(loan);
}

export async function addContributionToDB(data: Omit<Contribution, 'id'>): Promise<Contribution> {
  const id = `c${localContributions.length + 1}`;
  const newContribution: Contribution = {
    id,
    ...data
  };

  localContributions.unshift(newContribution);

  if (newContribution.status === 'Paid') {
    const user = localUsers.find((u) => u.id === data.userId);
    const donorName = user ? user.name : 'Circle member';
    await appendLedgerEntry({
      date: data.date,
      type: 'Contribution',
      description: `${donorName} · ${data.type === 'Voluntary' ? 'voluntary sadaqah pool donation' : 'regular pool contribution'}`,
      amount: data.amount
    });
  }

  try {
    await setDoc(doc(db, CONTRIBUTIONS_COL, id), newContribution);
  } catch (err) {
    console.warn('Firestore addContribution fallback:', err);
  }

  return structuredClone(newContribution);
}

export async function confirmContributionInDB(contributionId: string): Promise<Contribution> {
  const cont = localContributions.find((c) => c.id === contributionId);
  if (!cont) throw new Error('Contribution not found');

  cont.status = 'Paid';

  const user = localUsers.find((u) => u.id === cont.userId);
  const donorName = user ? user.name : 'Circle member';
  await appendLedgerEntry({
    date: new Date().toISOString().slice(0, 10),
    type: 'Contribution',
    description: `${donorName} · ${cont.type === 'Voluntary' ? 'voluntary sadaqah pool donation' : 'regular pool contribution'}`,
    amount: cont.amount
  });

  try {
    await updateDoc(doc(db, CONTRIBUTIONS_COL, contributionId), { status: 'Paid' });
  } catch (err) {
    console.warn('Firestore confirmContribution fallback:', err);
  }

  return structuredClone(cont);
}

export async function joinCircleInDB(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  note?: string;
}): Promise<{ user: User; membership: Membership }> {
  const count = localUsers.length + 1;
  const userId = `u${count}`;
  const memId = `m${count}`;

  const newUser: User = {
    id: userId,
    name: data.name,
    email: data.email,
    role: 'Member',
    initials:
      data.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'M'
  };

  const newMem: Membership = {
    id: memId,
    userId,
    circleId: defaultCircle.id,
    status: 'Pending',
    joinedAt: new Date().toISOString().slice(0, 10)
  };

  localUsers.push(newUser);
  localMemberships.push(newMem);

  try {
    await setDoc(doc(db, USERS_COL, userId), newUser);
    await setDoc(doc(db, MEMBERSHIPS_COL, memId), newMem);
  } catch (err) {
    console.warn('Firestore joinCircle fallback:', err);
  }

  return { user: structuredClone(newUser), membership: structuredClone(newMem) };
}

export async function approveMembershipInDB(membershipId: string): Promise<Membership> {
  const mem = localMemberships.find((m) => m.id === membershipId);
  if (!mem) throw new Error('Membership not found');

  mem.status = 'Active';

  try {
    await updateDoc(doc(db, MEMBERSHIPS_COL, membershipId), { status: 'Active' });
  } catch (err) {
    console.warn('Firestore approveMembership fallback:', err);
  }

  return structuredClone(mem);
}
