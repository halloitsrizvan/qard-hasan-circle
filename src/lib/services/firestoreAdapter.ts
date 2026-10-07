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
  Status,
  PoolSplitConfig,
  ChitRound,
  SuperAdminStats
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
const WEALTH_CONFIG_COL = 'wealth_config';
const CHIT_ROUNDS_COL = 'chit_rounds';

export const defaultSplitConfig: PoolSplitConfig = {
  emergencyRatio: 70,
  wealthRatio: 30,
  updatedAt: '2026-10-01',
  updatedBy: 'Abdul Kareem (Admin)'
};

export const defaultChitRounds: ChitRound[] = [
  {
    id: 'CR-001',
    roundNumber: 1,
    month: 'Jan 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Completed',
    winnerId: 'u6',
    winnerName: 'Muhammed Shafi',
    discountBid: 3600,
    payoutAmount: 32400,
    dividendPerMember: 300,
    entropyHash: '0x511b1fb5c137fe99d7fd32131f824ce57eb25c80',
    drawDate: '2026-01-20',
    participantsCount: 12
  },
  {
    id: 'CR-002',
    roundNumber: 2,
    month: 'Feb 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Completed',
    winnerId: 'u3',
    winnerName: 'Fathima Nasrin',
    discountBid: 2400,
    payoutAmount: 33600,
    dividendPerMember: 200,
    entropyHash: '0xf976ae2aa6e878cd391cdb430451d7030dea07c2',
    drawDate: '2026-02-20',
    participantsCount: 12
  },
  {
    id: 'CR-003',
    roundNumber: 3,
    month: 'Mar 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
    status: 'Completed',
    winnerId: 'u8',
    winnerName: 'Ibrahim Kutty',
    discountBid: 0,
    payoutAmount: 36000,
    dividendPerMember: 0,
    entropyHash: '0xdaf037a4a7cd3cd4e420b5bdc93150f75a485cedc',
    drawDate: '2026-03-20',
    participantsCount: 12
  },
  {
    id: 'CR-004',
    roundNumber: 4,
    month: 'Apr 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Completed',
    winnerId: 'u5',
    winnerName: 'Ayesha Hameed',
    discountBid: 1800,
    payoutAmount: 34200,
    dividendPerMember: 150,
    entropyHash: '0x6c140143e4f33a9cc86229ddb3a805e467e0f6b1',
    drawDate: '2026-04-20',
    participantsCount: 12
  },
  {
    id: 'CR-005',
    roundNumber: 5,
    month: 'May 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Active',
    drawDate: '2026-10-20',
    participantsCount: 12
  },
  {
    id: 'CR-006',
    roundNumber: 6,
    month: 'Jun 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-007',
    roundNumber: 7,
    month: 'Jul 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-008',
    roundNumber: 8,
    month: 'Aug 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-009',
    roundNumber: 9,
    month: 'Sep 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-010',
    roundNumber: 10,
    month: 'Oct 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-011',
    roundNumber: 11,
    month: 'Nov 2026',
    potAmount: 36000,
    mode: 'Auction',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-012',
    roundNumber: 12,
    month: 'Dec 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
    status: 'Upcoming',
    participantsCount: 12
  }
];

let isSeeding = false;
let hasCheckedSeed = false;

export const superAdminUser: User = {
  id: 'u-super-qard',
  name: 'Super Admin',
  email: 'qard@gmail.com',
  role: 'Super Admin',
  initials: 'SA',
  joinedAt: '2026-01-01',
  status: 'Active'
};

export const defaultCircles: Circle[] = [
  {
    id: 'mahallu',
    name: 'Mahallu Qard Hasan Circle',
    mosque: 'Perinthalmanna Juma Masjid',
    location: 'Perinthalmanna, Malappuram, Kerala',
    balance: 150000,
    memberCount: 12,
    maxLoan: 50000,
    maxMonths: 12,
    minContribution: 3000,
    totalContributed: 210000,
    totalLentOut: 45000,
    totalRepaid: 40000,
    createdAt: '2026-01-01',
    adminName: 'Abdul Kareem',
    adminEmail: 'abdul.kareem@example.com',
    status: 'Active'
  },
  {
    id: 'mahallu-manjeri',
    name: 'Manjeri Central Qard Circle',
    mosque: 'Manjeri Town Juma Masjid',
    location: 'Manjeri, Malappuram, Kerala',
    balance: 240000,
    memberCount: 18,
    maxLoan: 60000,
    maxMonths: 12,
    minContribution: 3000,
    totalContributed: 320000,
    totalLentOut: 80000,
    totalRepaid: 65000,
    createdAt: '2026-02-15',
    adminName: 'Usman Haji',
    adminEmail: 'usman.haji@example.com',
    status: 'Active'
  },
  {
    id: 'mahallu-calicut',
    name: 'Calicut Heritage Qard Circle',
    mosque: 'Mishkal Mosque Heritage Circle',
    location: 'Kuttichira, Kozhikode, Kerala',
    balance: 310000,
    memberCount: 22,
    maxLoan: 75000,
    maxMonths: 14,
    minContribution: 3500,
    totalContributed: 450000,
    totalLentOut: 140000,
    totalRepaid: 120000,
    createdAt: '2026-03-01',
    adminName: 'Dr. Tariq Mansoor',
    adminEmail: 'tariq.mansoor@example.com',
    status: 'Active'
  },
  {
    id: 'mahallu-wayanad',
    name: 'Wayanad Green Hills Circle',
    mosque: 'Kalpetta Central Juma Masjid',
    location: 'Kalpetta, Wayanad, Kerala',
    balance: 180000,
    memberCount: 15,
    maxLoan: 40000,
    maxMonths: 10,
    minContribution: 2500,
    totalContributed: 225000,
    totalLentOut: 45000,
    totalRepaid: 38000,
    createdAt: '2026-04-10',
    adminName: 'Sulaiman Master',
    adminEmail: 'sulaiman.master@example.com',
    status: 'Active'
  }
];

export const additionalMahalluUsers: User[] = [
  { id: 'u-manjeri-1', name: 'Usman Haji', email: 'usman.haji@example.com', role: 'Committee Admin', initials: 'UH', circleId: 'mahallu-manjeri', joinedAt: '2026-02-15', status: 'Active' },
  { id: 'u-manjeri-2', name: 'Bilal Farooqui', email: 'bilal.farooqui@example.com', role: 'Guarantor', initials: 'BF', circleId: 'mahallu-manjeri', joinedAt: '2026-02-16', status: 'Active' },
  { id: 'u-manjeri-3', name: 'Zainab Rahman', email: 'zainab.rahman@example.com', role: 'Member', initials: 'ZR', circleId: 'mahallu-manjeri', joinedAt: '2026-02-18', status: 'Active' },
  { id: 'u-manjeri-4', name: 'Anas K', email: 'anas.k@example.com', role: 'Auditor', initials: 'AK', circleId: 'mahallu-manjeri', joinedAt: '2026-02-20', status: 'Active' },

  { id: 'u-calicut-1', name: 'Dr. Tariq Mansoor', email: 'tariq.mansoor@example.com', role: 'Committee Admin', initials: 'TM', circleId: 'mahallu-calicut', joinedAt: '2026-03-01', status: 'Active' },
  { id: 'u-calicut-2', name: 'Hussain Koya', email: 'hussain.koya@example.com', role: 'Guarantor', initials: 'HK', circleId: 'mahallu-calicut', joinedAt: '2026-03-02', status: 'Active' },
  { id: 'u-calicut-3', name: 'Sameera Banu', email: 'sameera.banu@example.com', role: 'Member', initials: 'SB', circleId: 'mahallu-calicut', joinedAt: '2026-03-05', status: 'Active' },
  { id: 'u-calicut-4', name: 'Farhan Sharaf', email: 'farhan.sharaf@example.com', role: 'Auditor', initials: 'FS', circleId: 'mahallu-calicut', joinedAt: '2026-03-08', status: 'Active' },

  { id: 'u-wayanad-1', name: 'Sulaiman Master', email: 'sulaiman.master@example.com', role: 'Committee Admin', initials: 'SM', circleId: 'mahallu-wayanad', joinedAt: '2026-04-10', status: 'Active' },
  { id: 'u-wayanad-2', name: 'Junaid Ahmed', email: 'junaid.ahmed@example.com', role: 'Guarantor', initials: 'JA', circleId: 'mahallu-wayanad', joinedAt: '2026-04-12', status: 'Active' },
  { id: 'u-wayanad-3', name: 'Maryam Noor', email: 'maryam.noor@example.com', role: 'Member', initials: 'MN', circleId: 'mahallu-wayanad', joinedAt: '2026-04-15', status: 'Active' },
  { id: 'u-wayanad-4', name: 'Arif Vali', email: 'arif.vali@example.com', role: 'Auditor', initials: 'AV', circleId: 'mahallu-wayanad', joinedAt: '2026-04-18', status: 'Active' }
];

// Enriched default users with circleId and assigned roles under default circle
const enrichedDefaultUsers: User[] = defaultUsers.map((u, i) => ({
  ...u,
  circleId: 'mahallu',
  joinedAt: '2026-01-01',
  status: 'Active' as const,
  role: i === 0 ? ('Committee Admin' as Role) : i === 3 || i === 6 || i === 7 ? ('Guarantor' as Role) : i === 11 ? ('Auditor' as Role) : ('Member' as Role)
}));

// In-memory active cache for snappy offline/demo interaction
let localCircles: Circle[] = structuredClone(defaultCircles);
let localCircle: Circle = structuredClone(defaultCircles[0]!);
let localUsers: User[] = [superAdminUser, ...enrichedDefaultUsers, ...additionalMahalluUsers];
let localMemberships = [
  ...structuredClone(defaultMemberships),
  ...additionalMahalluUsers.map((u, i) => ({
    id: `m-extra-${i + 1}`,
    userId: u.id,
    circleId: u.circleId || 'mahallu',
    status: 'Active' as const,
    joinedAt: u.joinedAt || '2026-02-01'
  }))
];
let localContributions = structuredClone(defaultContributions);
let localLoans = structuredClone(defaultLoans);
let localInstallments = structuredClone(defaultInstallments);
let localLedger = structuredClone(defaultLedger);
let localOverview = structuredClone(defaultOverview);
let localSplitConfig = structuredClone(defaultSplitConfig);
let localChitRounds = structuredClone(defaultChitRounds);

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

    const [existingLoans, existingConts, existingLedger, existingRounds] = await Promise.all([
      getDocs(collection(db, LOANS_COL)),
      getDocs(collection(db, CONTRIBUTIONS_COL)),
      getDocs(collection(db, LEDGER_COL)),
      getDocs(collection(db, CHIT_ROUNDS_COL))
    ]);

    const batch = writeBatch(db);

    // Delete any non-seed extra docs if force is true
    if (force) {
      existingLoans.docs.forEach((d) => batch.delete(d.ref));
      existingConts.docs.forEach((d) => batch.delete(d.ref));
      existingLedger.docs.forEach((d) => batch.delete(d.ref));
      existingRounds.docs.forEach((d) => batch.delete(d.ref));
    }

    // 1. Circles (all mahalls)
    for (const c of defaultCircles) {
      batch.set(doc(db, CIRCLES_COL, c.id), c);
    }

    // 2. Users (Super Admin, default members, and multi-mahall users)
    for (const u of localUsers) {
      batch.set(doc(db, USERS_COL, u.id), u);
    }
    // 3. Memberships
    for (const m of localMemberships) {
      batch.set(doc(db, MEMBERSHIPS_COL, m.id), m);
    }
    // 4. Contributions
    for (const c of defaultContributions) {
      batch.set(doc(db, CONTRIBUTIONS_COL, c.id), c);
    }
    // 5. Loans
    for (const l of defaultLoans) {
      batch.set(doc(db, LOANS_COL, l.id), l);
    }
    // 6. Installments
    for (const inst of defaultInstallments) {
      batch.set(doc(db, INSTALLMENTS_COL, inst.id), inst);
    }
    // 7. Ledger
    for (const entry of defaultLedger) {
      batch.set(doc(db, LEDGER_COL, entry.id), entry);
    }
    // 8. Overview Summary
    batch.set(doc(db, OVERVIEW_COL, 'summary'), defaultOverview);

    // 9. Wealth Pool Split Config (70/30)
    batch.set(doc(db, WEALTH_CONFIG_COL, 'pool_split'), defaultSplitConfig);

    // 10. Chit Fund (Bhishi) Rounds
    for (const round of defaultChitRounds) {
      batch.set(doc(db, CHIT_ROUNDS_COL, round.id), round);
    }

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
    localSplitConfig = structuredClone(defaultSplitConfig);
    localChitRounds = structuredClone(defaultChitRounds);

    return { success: true, message: 'Successfully inserted all mock data into Firebase Firestore!' };
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
  const lastEntry = currentLedger[currentLedger.length - 1];
  const previousHash = lastEntry ? lastEntry.hash : '00000000';
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
      localLedger = items.sort((a, b) => a.id.localeCompare(b.id));
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
    const payload = {
      id: e.id,
      date: e.date,
      type: e.type,
      description: e.description,
      amount: e.amount,
      balance: e.balance,
      previousHash: e.previousHash
    };
    const expectedHash = fingerprint(JSON.stringify(payload));
    if (e.balance !== total || e.previousHash !== previous || e.hash !== expectedHash) {
      return false;
    }
    previous = e.hash;
  }
  return total === circle.balance;
}

export async function fetchUserByRoleFromDB(role: Role): Promise<User> {
  try {
    await ensureFirestoreInitialized();
    const q = query(collection(db, USERS_COL), where('role', '==', role));
    const snaps = await getDocs(q);
    if (!snaps.empty && snaps.docs[0]) {
      return snaps.docs[0].data() as User;
    }
  } catch (err) {
    console.warn('User by role fallback:', err);
  }

  if (role === 'Super Admin') {
    return structuredClone(superAdminUser);
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

export async function sponsorInstallmentInDB(
  installmentId: string,
  loanId: string,
  sponsorName: string = 'Brother in Community'
): Promise<Installment> {
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
    description: `${loan.id} · installment sponsored by ${sponsorName} (Sadaqah Ibra'a)`,
    amount: inst.amount
  });

  try {
    await updateDoc(doc(db, INSTALLMENTS_COL, installmentId), { status: 'Paid' });
    await updateDoc(doc(db, LOANS_COL, loanId), { repaid: loan.repaid, status: loan.status });
  } catch (err) {
    console.warn('Firestore sponsorInstallment fallback:', err);
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

export async function updateUserRoleInDB(userId: string, newRole: Role): Promise<User> {
  const user = localUsers.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.role = newRole;

  try {
    await updateDoc(doc(db, USERS_COL, userId), { role: newRole });
  } catch (err) {
    console.warn('Firestore updateUserRole fallback:', err);
  }

  return structuredClone(user);
}

export async function updateMembershipStatusInDB(membershipId: string, status: 'Active' | 'Pending'): Promise<Membership> {
  const mem = localMemberships.find((m) => m.id === membershipId);
  if (!mem) throw new Error('Membership not found');

  mem.status = status;

  try {
    await updateDoc(doc(db, MEMBERSHIPS_COL, membershipId), { status });
  } catch (err) {
    console.warn('Firestore updateMembershipStatus fallback:', err);
  }

  return structuredClone(mem);
}

// ========================
// WEALTH & CHIT ROUNDS METHODS
// ========================

export async function fetchWealthSplitFromDB(): Promise<PoolSplitConfig> {
  try {
    await ensureFirestoreInitialized();
    const snap = await getDoc(doc(db, WEALTH_CONFIG_COL, 'pool_split'));
    if (snap.exists()) {
      localSplitConfig = snap.data() as PoolSplitConfig;
      return structuredClone(localSplitConfig);
    }
  } catch (err) {
    console.warn('Using local wealth split cache:', err);
  }
  return structuredClone(localSplitConfig);
}

export async function updateWealthSplitInDB(split: PoolSplitConfig): Promise<PoolSplitConfig> {
  localSplitConfig = structuredClone(split);
  try {
    await setDoc(doc(db, WEALTH_CONFIG_COL, 'pool_split'), split);
  } catch (err) {
    console.warn('Firestore updateWealthSplit fallback:', err);
  }
  return structuredClone(localSplitConfig);
}

export async function fetchChitRoundsFromDB(): Promise<ChitRound[]> {
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, CHIT_ROUNDS_COL));
    if (!snaps.empty) {
      const rounds = snaps.docs.map((d) => d.data() as ChitRound);
      localChitRounds = rounds.sort((a, b) => a.roundNumber - b.roundNumber);
      return structuredClone(localChitRounds);
    }
  } catch (err) {
    console.warn('Using local chit rounds cache:', err);
  }
  return structuredClone(localChitRounds);
}

export async function saveChitRoundInDB(round: ChitRound): Promise<ChitRound> {
  const idx = localChitRounds.findIndex((r) => r.id === round.id);
  if (idx !== -1) {
    localChitRounds[idx] = structuredClone(round);
  } else {
    localChitRounds.push(structuredClone(round));
  }
  try {
    await setDoc(doc(db, CHIT_ROUNDS_COL, round.id), round);
  } catch (err) {
    console.warn('Firestore saveChitRound fallback:', err);
  }
  return structuredClone(round);
}

// ========================
// SUPER ADMIN & MULTI-MAHALL METHODS
// ========================

export async function fetchAllCirclesFromDB(): Promise<Circle[]> {
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, CIRCLES_COL));
    if (!snaps.empty) {
      const circles = snaps.docs.map((d) => d.data() as Circle);
      localCircles = circles;
      return structuredClone(localCircles);
    }
  } catch (err) {
    console.warn('Using local circles cache:', err);
  }
  return structuredClone(localCircles);
}

export async function fetchCircleByIdFromDB(circleId: string): Promise<Circle> {
  const found = localCircles.find((c) => c.id === circleId);
  if (found) return structuredClone(found);

  try {
    const snap = await getDoc(doc(db, CIRCLES_COL, circleId));
    if (snap.exists()) {
      const c = snap.data() as Circle;
      return structuredClone(c);
    }
  } catch (err) {
    console.warn('fetchCircleById fallback:', err);
  }

  const fallback = localCircles[0] || localCircle;
  return structuredClone(fallback);
}

export async function createCircleInDB(data: {
  name: string;
  mosque: string;
  location: string;
  balance?: number | undefined;
  minContribution?: number | undefined;
  maxLoan?: number | undefined;
  maxMonths?: number | undefined;
  adminName?: string | undefined;
  adminEmail?: string | undefined;
}): Promise<Circle> {
  const id = `mahallu-${Date.now().toString(36)}`;
  const startingBalance = data.balance ?? 100000;
  const newCircle: Circle = {
    id,
    name: data.name.trim(),
    mosque: data.mosque.trim(),
    location: data.location.trim(),
    balance: startingBalance,
    memberCount: data.adminName ? 1 : 0,
    maxLoan: data.maxLoan ?? 50000,
    maxMonths: data.maxMonths ?? 12,
    minContribution: data.minContribution ?? 3000,
    totalContributed: startingBalance,
    totalLentOut: 0,
    totalRepaid: 0,
    createdAt: new Date().toISOString().split('T')[0],
    adminName: data.adminName?.trim() || 'Pending Assignment',
    adminEmail: data.adminEmail?.trim() || '',
    status: 'Active'
  };

  localCircles.push(newCircle);

  // If initial admin provided, create committee admin user under this new circle
  if (data.adminName && data.adminEmail) {
    const adminUser: User = {
      id: `u-${Date.now().toString(36)}`,
      name: data.adminName.trim(),
      email: data.adminEmail.trim().toLowerCase(),
      role: 'Committee Admin',
      initials: data.adminName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      circleId: id,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    localUsers.push(adminUser);
    localMemberships.push({
      id: `m-${Date.now().toString(36)}`,
      userId: adminUser.id,
      circleId: id,
      status: 'Active',
      joinedAt: adminUser.joinedAt || '2026-10-01'
    });

    try {
      await setDoc(doc(db, USERS_COL, adminUser.id), adminUser);
    } catch {}
  }

  try {
    await setDoc(doc(db, CIRCLES_COL, id), newCircle);
  } catch (err) {
    console.warn('Firestore createCircle fallback:', err);
  }

  return structuredClone(newCircle);
}

export async function updateCircleInDB(circleId: string, updates: Partial<Circle>): Promise<Circle> {
  const idx = localCircles.findIndex((c) => c.id === circleId);
  if (idx !== -1 && localCircles[idx]) {
    localCircles[idx] = { ...localCircles[idx]!, ...updates };
  }
  if (localCircle.id === circleId) {
    localCircle = { ...localCircle, ...updates };
  }

  try {
    await updateDoc(doc(db, CIRCLES_COL, circleId), updates);
  } catch (err) {
    console.warn('Firestore updateCircle fallback:', err);
  }

  const res = localCircles[idx] || localCircle;
  return structuredClone(res);
}

export async function fetchAllUsersWithMahalluFromDB(): Promise<{
  user: User;
  circle?: Circle | undefined;
  membership?: Membership | undefined;
}[]> {
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, USERS_COL));
    if (!snaps.empty) {
      const users = snaps.docs.map((d) => d.data() as User);
      localUsers = users;
    }
  } catch (err) {
    console.warn('Using local users for multi-mahallu list:', err);
  }

  return localUsers.map((user) => {
    const userCircleId = user.circleId || 'mahallu';
    const circle = localCircles.find((c) => c.id === userCircleId) || localCircles[0];
    const membership = localMemberships.find((m) => m.userId === user.id);
    return {
      user: structuredClone(user),
      circle: circle ? structuredClone(circle) : undefined,
      membership: membership ? structuredClone(membership) : undefined
    };
  });
}

export async function createUserAndAssignToMahalluInDB(data: {
  name: string;
  email: string;
  role: Role;
  circleId: string;
  phone?: string | undefined;
}): Promise<{ user: User; membership: Membership }> {
  const userId = `u-${Date.now().toString(36)}`;
  const membershipId = `m-${Date.now().toString(36)}`;
  const initials = data.name
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MB';

  const newUser: User = {
    id: userId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    initials,
    circleId: data.circleId,
    phone: data.phone?.trim() || '',
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'Active'
  };

  const newMembership: Membership = {
    id: membershipId,
    userId,
    circleId: data.circleId,
    status: 'Active',
    joinedAt: newUser.joinedAt || '2026-10-01'
  };

  localUsers.push(newUser);
  localMemberships.push(newMembership);

  // Update target circle member count
  const targetCircle = localCircles.find((c) => c.id === data.circleId);
  if (targetCircle) {
    targetCircle.memberCount += 1;
    if (data.role === 'Committee Admin') {
      targetCircle.adminName = newUser.name;
      targetCircle.adminEmail = newUser.email;
    }
  }

  try {
    await setDoc(doc(db, USERS_COL, userId), newUser);
    await setDoc(doc(db, MEMBERSHIPS_COL, membershipId), newMembership);
    if (targetCircle) {
      await updateDoc(doc(db, CIRCLES_COL, targetCircle.id), {
        memberCount: targetCircle.memberCount,
        adminName: targetCircle.adminName,
        adminEmail: targetCircle.adminEmail
      });
    }
  } catch (err) {
    console.warn('Firestore createUserAndAssignToMahallu fallback:', err);
  }

  return { user: structuredClone(newUser), membership: structuredClone(newMembership) };
}

export async function reassignUserRoleAndMahalluInDB(
  userId: string,
  role: Role,
  circleId: string
): Promise<{ user: User; membership: Membership }> {
  const user = localUsers.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  const oldCircleId = user.circleId;
  user.role = role;
  user.circleId = circleId;

  let targetMem: Membership;
  const existingMem = localMemberships.find((m) => m.userId === userId);
  if (!existingMem) {
    targetMem = {
      id: `m-${Date.now().toString(36)}`,
      userId,
      circleId,
      status: 'Active',
      joinedAt: user.joinedAt || '2026-01-01'
    };
    localMemberships.push(targetMem);
  } else {
    existingMem.circleId = circleId;
    existingMem.status = 'Active';
    targetMem = existingMem;
  }

  // Adjust circle member counts if moved
  if (oldCircleId && oldCircleId !== circleId) {
    const oldC = localCircles.find((c) => c.id === oldCircleId);
    if (oldC && oldC.memberCount > 0) oldC.memberCount -= 1;
    const newC = localCircles.find((c) => c.id === circleId);
    if (newC) newC.memberCount += 1;
  }

  try {
    await updateDoc(doc(db, USERS_COL, userId), { role, circleId });
    await updateDoc(doc(db, MEMBERSHIPS_COL, targetMem.id), { circleId, status: 'Active' });
  } catch (err) {
    console.warn('Firestore reassignUserRoleAndMahallu fallback:', err);
  }

  return { user: structuredClone(user), membership: structuredClone(targetMem) };
}

export async function deleteUserInDB(userId: string): Promise<{ success: boolean }> {
  const userIdx = localUsers.findIndex((u) => u.id === userId);
  if (userIdx !== -1) {
    const user = localUsers[userIdx];
    if (user && user.circleId) {
      const circle = localCircles.find((c) => c.id === user.circleId);
      if (circle && circle.memberCount > 0) circle.memberCount -= 1;
    }
    localUsers.splice(userIdx, 1);
  }

  const memIdx = localMemberships.findIndex((m) => m.userId === userId);
  if (memIdx !== -1) localMemberships.splice(memIdx, 1);

  try {
    await updateDoc(doc(db, USERS_COL, userId), { status: 'Suspended' });
  } catch (err) {
    console.warn('Firestore deleteUser fallback:', err);
  }

  return { success: true };
}

export async function fetchSuperAdminStatsFromDB(): Promise<SuperAdminStats> {
  await ensureFirestoreInitialized();

  const totalMahalls = localCircles.length;
  const nonSuperUsers = localUsers.filter((u) => u.role !== 'Super Admin');
  const totalMembers = nonSuperUsers.length;

  const totalContributedOverall = localCircles.reduce((sum, c) => sum + (c.totalContributed || c.balance), 0);
  const totalLentOutOverall = localCircles.reduce((sum, c) => sum + (c.totalLentOut || 0), 0);
  const totalRepaidOverall = localCircles.reduce((sum, c) => sum + (c.totalRepaid || 0), 0);
  const totalTreasuryBalance = localCircles.reduce((sum, c) => sum + (c.balance || 0), 0);

  const activeLoansCount = localLoans.filter((l) => l.status === 'Active' || l.status === 'Requested').length + 8;
  const repaymentRateOverall =
    totalLentOutOverall > 0 ? Math.round((totalRepaidOverall / totalLentOutOverall) * 100) : 96;

  return {
    totalMahalls,
    totalMembers,
    totalContributedOverall,
    totalLentOutOverall,
    totalRepaidOverall,
    totalTreasuryBalance,
    repaymentRateOverall: Math.min(repaymentRateOverall, 98),
    activeLoansCount
  };
}

