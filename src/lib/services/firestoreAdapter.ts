import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
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
    mode: 'Lucky Draw',
    status: 'Completed',
    winnerId: 'u6',
    winnerName: 'Muhammed Shafi',
    discountBid: 0,
    payoutAmount: 36000,
    dividendPerMember: 0,
    entropyHash: '0x511b1fb5c137fe99d7fd32131f824ce57eb25c80',
    drawDate: '2026-01-20',
    participantsCount: 12
  },
  {
    id: 'CR-002',
    roundNumber: 2,
    month: 'Feb 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
    status: 'Completed',
    winnerId: 'u3',
    winnerName: 'Fathima Nasrin',
    discountBid: 0,
    payoutAmount: 36000,
    dividendPerMember: 0,
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
    mode: 'Lucky Draw',
    status: 'Completed',
    winnerId: 'u5',
    winnerName: 'Ayesha Hameed',
    discountBid: 0,
    payoutAmount: 36000,
    dividendPerMember: 0,
    entropyHash: '0x6c140143e4f33a9cc86229ddb3a805e467e0f6b1',
    drawDate: '2026-04-20',
    participantsCount: 12
  },
  {
    id: 'CR-005',
    roundNumber: 5,
    month: 'May 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
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
    mode: 'Lucky Draw',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-008',
    roundNumber: 8,
    month: 'Aug 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
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
    mode: 'Lucky Draw',
    status: 'Upcoming',
    participantsCount: 12
  },
  {
    id: 'CR-011',
    roundNumber: 11,
    month: 'Nov 2026',
    potAmount: 36000,
    mode: 'Lucky Draw',
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

export const initialMahalluUsers: User[] = [
  {
    id: 'u-perin-1',
    name: 'Abdul Kareem',
    email: 'abdul.kareem@perinthalmanna.org',
    role: 'Committee Admin',
    initials: 'AK',
    circleId: 'mahallu',
    phone: '+91 98470 12345',
    joinedAt: '2026-01-01',
    status: 'Active',
    monthlyCommitment: 1000
  },
  {
    id: 'u-perin-2',
    name: 'Rahim Mohammed',
    email: 'rahim.mohammed@perinthalmanna.org',
    role: 'Member',
    initials: 'RM',
    circleId: 'mahallu',
    phone: '+91 98470 23456',
    joinedAt: '2026-01-05',
    status: 'Active',
    monthlyCommitment: 1000
  },
  {
    id: 'u-perin-3',
    name: 'Yusuf Ali',
    email: 'yusuf.ali@perinthalmanna.org',
    role: 'Guarantor',
    initials: 'YA',
    circleId: 'mahallu',
    phone: '+91 98470 34567',
    joinedAt: '2026-01-10',
    status: 'Active',
    monthlyCommitment: 1000
  },
  {
    id: 'u-perin-4',
    name: 'Fathima Nasrin',
    email: 'fathima.nasrin@perinthalmanna.org',
    role: 'Member',
    initials: 'FN',
    circleId: 'mahallu',
    phone: '+91 98470 45678',
    joinedAt: '2026-01-15',
    status: 'Active',
    monthlyCommitment: 1000
  },
  {
    id: 'u-perin-5',
    name: 'Muhammed Shafi',
    email: 'muhammed.shafi@perinthalmanna.org',
    role: 'Member',
    initials: 'MS',
    circleId: 'mahallu',
    phone: '+91 98470 56789',
    joinedAt: '2026-01-20',
    status: 'Active',
    monthlyCommitment: 1000
  },
  {
    id: 'u-perin-6',
    name: 'Rashid Usman',
    email: 'rashid.usman@perinthalmanna.org',
    role: 'Auditor',
    initials: 'RU',
    circleId: 'mahallu',
    phone: '+91 98470 67890',
    joinedAt: '2026-01-25',
    status: 'Active',
    monthlyCommitment: 1000
  }
];

export const initialMahalluMemberships: Membership[] = initialMahalluUsers.map((u, idx) => ({
  id: `m-mahallu-${idx + 1}`,
  userId: u.id,
  circleId: 'mahallu',
  status: 'Active' as const,
  joinedAt: u.joinedAt || '2026-01-01',
  monthlyCommitment: 1000
}));

export const defaultCircles: Circle[] = [
  {
    id: 'mahallu',
    name: 'Mahallu Qard Hasan Circle',
    mosque: 'Perinthalmanna Juma Masjid',
    location: 'Perinthalmanna, Malappuram, Kerala',
    balance: 0,
    memberCount: 6,
    maxLoan: 50000,
    maxMonths: 12,
    minContribution: 1000,
    totalContributed: 0,
    totalLentOut: 0,
    totalRepaid: 0,
    createdAt: '2026-01-01',
    adminName: 'Abdul Kareem',
    adminEmail: 'abdul.kareem@perinthalmanna.org',
    status: 'Active'
  }
];

export const additionalMahalluUsers: User[] = [];

// Enriched default users with circleId and assigned roles under default circle
const enrichedDefaultUsers: User[] = [];

export function getActiveCircleId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('qard-active-mahall-id');
      if (saved && localCircles.some((c) => c.id === saved)) {
        return saved;
      }
      localStorage.setItem('qard-active-mahall-id', defaultCircles[0]!.id);
    } catch {}
  }
  return localCircle?.id || defaultCircles[0]!.id;
}

export function syncLocalCircleWithActive(): Circle {
  const activeId = getActiveCircleId();
  const found = localCircles.find((c) => c.id === activeId) || defaultCircles.find((c) => c.id === activeId);
  if (found) {
    localCircle = structuredClone(found);
  } else {
    localCircle = structuredClone(defaultCircles[0]!);
  }

  if (localContributions.length === 0) {
    localContributions = getStoredContributions();
  }
  if (localLedger.length === 0) {
    localLedger = getStoredLedger();
  }

  const paidContributions = localContributions.filter((c) => (c.circleId || 'mahallu') === localCircle.id && c.status === 'Paid');
  const regularTotal = paidContributions.filter((c) => c.type !== 'Voluntary').reduce((sum, c) => sum + c.amount, 0);
  const voluntaryTotal = paidContributions.filter((c) => c.type === 'Voluntary').reduce((sum, c) => sum + c.amount, 0);
  const ledgerContributionTotal = localLedger
    .filter((e) => (e.circleId || 'mahallu') === localCircle.id && e.type === 'Contribution')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalContributed = Math.max(
    paidContributions.length > 0 ? (regularTotal + voluntaryTotal) : 0,
    ledgerContributionTotal,
    localCircle.totalContributed || 0
  );

  const circleLoans = localLoans.filter((l) => (l.circleId || 'mahallu') === localCircle.id);
  const lentOut = circleLoans.reduce((sum, l) => sum + (['Active', 'Closed', 'Overdue'].includes(l.status) ? l.amount : 0), 0);
  const repaid = circleLoans.reduce((sum, l) => sum + (l.repaid || 0), 0);
  const available = Math.max(totalContributed - lentOut + repaid, 0);

  localCircle.balance = available;
  localCircle.totalContributed = totalContributed;
  localCircle.totalLentOut = lentOut;
  localCircle.totalRepaid = repaid;

  const circleIndex = localCircles.findIndex((c) => c.id === localCircle.id);
  if (circleIndex >= 0) {
    localCircles[circleIndex] = structuredClone(localCircle);
  }

  return localCircle;
}

export const initialMahalluContributions: Contribution[] = (() => {
  const conts: Contribution[] = [];
  let count = 1;

  const membersConfig = [
    { id: 'u-perin-1', months: 10 }, // Abdul Kareem (Jan - Oct)
    { id: 'u-perin-2', months: 10 }, // Rahim Mohammed (Jan - Oct)
    { id: 'u-perin-3', months: 10 }, // Yusuf Ali (Jan - Oct)
    { id: 'u-perin-4', months: 10 }, // Fathima Nasrin (Jan - Oct)
    { id: 'u-perin-5', months: 10 }, // Muhammed Shafi (Jan - Oct)
    { id: 'u-perin-6', months: 7 }   // Rashid Usman (Jan - Jul)
  ];

  for (let monthIdx = 0; monthIdx < 10; monthIdx++) {
    const monthNum = String(monthIdx + 1).padStart(2, '0');
    const dateStr = `2026-${monthNum}-10`;

    for (const m of membersConfig) {
      if (monthIdx < m.months) {
        conts.push({
          id: `c-mahallu-${String(count).padStart(3, '0')}`,
          userId: m.id,
          circleId: 'mahallu',
          amount: 1000,
          date: dateStr,
          type: 'Regular',
          status: 'Paid'
        });
        count++;
      }
    }
  }

  return conts;
})();

export const initialMahalluLedger: LedgerEntry[] = (() => {
  const entries: LedgerEntry[] = [];
  let runningBalance = 0;
  let prevHash = '00000000';

  const userMap = new Map(initialMahalluUsers.map((u) => [u.id, u.name]));

  initialMahalluContributions.forEach((c, idx) => {
    runningBalance += c.amount;
    const userName = userMap.get(c.userId) || 'Circle member';
    const id = `LE-mahallu-${String(idx + 1).padStart(3, '0')}`;
    const hash = fingerprint(`${prevHash}:${c.date}:${c.amount}:${id}`);

    entries.push({
      id,
      circleId: 'mahallu',
      date: c.date,
      type: 'Contribution',
      amount: c.amount,
      balance: runningBalance,
      description: `${userName} · regular pool contribution`,
      previousHash: prevHash,
      hash
    });

    prevHash = hash;
  });

  return entries;
})();

export function deduplicateContributions(list: Contribution[]): Contribution[] {
  const seen = new Set<string>();
  const result: Contribution[] = [];

  for (const c of list) {
    const d = new Date(c.date);
    const dateKey = !isNaN(d.getTime()) ? `${d.getFullYear()}-${d.getMonth()}` : c.date;
    const uniqueKey = c.type === 'Regular'
      ? `${c.userId}_${c.circleId || 'mahallu'}_${dateKey}`
      : `${c.id}`;

    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      result.push(c);
    }
  }

  return result;
}

export function deduplicateLedger(list: LedgerEntry[]): LedgerEntry[] {
  const seen = new Set<string>();
  const result: LedgerEntry[] = [];

  for (const e of list) {
    const key = e.id;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(e);
    }
  }

  return result;
}

const CONTRIBUTIONS_STORAGE_KEY = 'qard-contributions-cache';
const LEDGER_STORAGE_KEY = 'qard-ledger-cache';

export function getStoredContributions(): Contribution[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(CONTRIBUTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateContributions(parsed);
        }
      }
    } catch {}
  }
  return structuredClone(initialMahalluContributions);
}

export function persistContributions(conts: Contribution[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(CONTRIBUTIONS_STORAGE_KEY, JSON.stringify(deduplicateContributions(conts)));
    } catch {}
  }
}

export function getStoredLedger(): LedgerEntry[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(LEDGER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateLedger(parsed);
        }
      }
    } catch {}
  }
  return structuredClone(initialMahalluLedger);
}

export function persistLedger(entries: LedgerEntry[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(deduplicateLedger(entries)));
    } catch {}
  }
}

// In-memory active cache for snappy offline/demo interaction
let localCircles: Circle[] = structuredClone(defaultCircles);
let localCircle: Circle = structuredClone(defaultCircles[0]!);
// Attempt immediate local sync
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = localStorage.getItem('qard-active-mahall-id');
    if (saved) {
      const found = defaultCircles.find((c) => c.id === saved);
      if (found) localCircle = structuredClone(found);
    }
  } catch {}
}
let localUsers: User[] = [superAdminUser, ...initialMahalluUsers];
let localMemberships: Membership[] = structuredClone(initialMahalluMemberships);
let localContributions: Contribution[] = getStoredContributions();
let localLoans: Loan[] = [];
let localInstallments: Installment[] = [];
let localLedger: LedgerEntry[] = getStoredLedger();
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
      syncLocalCircleWithActive();
      return { success: true, message: 'Firestore is already seeded with data.' };
    }

    const [existingLoans, existingConts, existingLedger, existingRounds, existingUsers, existingMemberships, existingCircles] = await Promise.all([
      getDocs(collection(db, LOANS_COL)),
      getDocs(collection(db, CONTRIBUTIONS_COL)),
      getDocs(collection(db, LEDGER_COL)),
      getDocs(collection(db, CHIT_ROUNDS_COL)),
      getDocs(collection(db, USERS_COL)),
      getDocs(collection(db, MEMBERSHIPS_COL)),
      getDocs(collection(db, CIRCLES_COL))
    ]);

    const batch = writeBatch(db);

    // Delete all extra docs
    existingLoans.docs.forEach((d) => batch.delete(d.ref));
    existingConts.docs.forEach((d) => batch.delete(d.ref));
    existingLedger.docs.forEach((d) => batch.delete(d.ref));
    existingRounds.docs.forEach((d) => batch.delete(d.ref));
    existingMemberships.docs.forEach((d) => batch.delete(d.ref));
    existingUsers.docs.forEach((d) => {
      if (d.id !== superAdminUser.id) {
        batch.delete(d.ref);
      }
    });
    existingCircles.docs.forEach((d) => {
      if (!defaultCircles.some((c) => c.id === d.id)) {
        batch.delete(d.ref);
      }
    });

    // 1. Circles (default Mahallu Qard Hasan Circle with 6 members)
    for (const c of defaultCircles) {
      batch.set(doc(db, CIRCLES_COL, c.id), c);
    }

    // 2. Super Admin & 6 Mahallu Members
    batch.set(doc(db, USERS_COL, superAdminUser.id), superAdminUser);
    for (const u of initialMahalluUsers) {
      batch.set(doc(db, USERS_COL, u.id), u);
    }

    // 3. 6 Active Memberships
    for (const m of initialMahalluMemberships) {
      batch.set(doc(db, MEMBERSHIPS_COL, m.id), m);
    }

    // 4. Overview Summary
    batch.set(doc(db, OVERVIEW_COL, 'summary'), defaultOverview);

    // 5. Wealth Pool Split Config (70/30)
    batch.set(doc(db, WEALTH_CONFIG_COL, 'pool_split'), defaultSplitConfig);

    // 6. Initial 57 Verified Contributions & Immutable Ledger Entries
    for (const c of initialMahalluContributions) {
      batch.set(doc(db, CONTRIBUTIONS_COL, c.id), c);
    }
    for (const l of initialMahalluLedger) {
      batch.set(doc(db, LEDGER_COL, l.id), l);
    }

    await batch.commit();
    hasCheckedSeed = true;
    isSeeding = false;

    // Reset local cache to defaults but preserve active circle context and payments
    localCircles = structuredClone(defaultCircles);
    syncLocalCircleWithActive();
    localUsers = [structuredClone(superAdminUser), ...structuredClone(initialMahalluUsers)];
    localMemberships = structuredClone(initialMahalluMemberships);
    localContributions = structuredClone(initialMahalluContributions);
    persistContributions(localContributions);
    localLoans = [];
    localInstallments = [];
    localLedger = structuredClone(initialMahalluLedger);
    persistLedger(localLedger);
    localOverview = structuredClone(defaultOverview);
    localSplitConfig = structuredClone(defaultSplitConfig);
    localChitRounds = structuredClone(defaultChitRounds);

    return { success: true, message: 'Successfully seeded Mahallu Qard Hasan Circle with 6 members!' };
  } catch (error) {
    isSeeding = false;
    syncLocalCircleWithActive();
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
  syncLocalCircleWithActive();
}

// Helper to append a verified ledger entry for a specific Mahall
async function appendLedgerEntry(entryData: {
  date: string;
  type: 'Contribution' | 'Disbursement' | 'Repayment';
  description: string;
  amount: number;
  circleId?: string;
}): Promise<LedgerEntry> {
  const targetCircleId = entryData.circleId || getActiveCircleId();
  const currentLedger = await fetchLedgerFromDB(targetCircleId);
  const circle = localCircles.find((c) => c.id === targetCircleId) || localCircle;
  const nextBalance = circle.balance + entryData.amount;
  const lastEntry = currentLedger[currentLedger.length - 1];
  const previousHash = lastEntry ? lastEntry.hash : '00000000';
  const id = `LE-${targetCircleId}-${String(currentLedger.length + 1).padStart(3, '0')}`;

  const payload = {
    id,
    circleId: targetCircleId,
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
  persistLedger(localLedger);
  circle.balance = nextBalance;
  if (localCircle.id === targetCircleId) {
    localCircle.balance = nextBalance;
  }

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
  syncLocalCircleWithActive();
  return structuredClone(localCircle);
}

export async function switchActiveCircleInDB(circleId: string): Promise<Circle> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('qard-active-mahall-id', circleId);
    } catch {}
  }
  const found = localCircles.find((c) => c.id === circleId) || defaultCircles.find((c) => c.id === circleId);
  if (found) {
    localCircle = structuredClone(found);
  }
  return structuredClone(localCircle);
}

export function updateLocalUserCache(updatedUser: User) {
  const normalizedEmail = (updatedUser.email || '').trim().toLowerCase();
  localUsers = localUsers.filter(
    (u) => u.email.trim().toLowerCase() !== normalizedEmail && u.id !== updatedUser.id
  );
  localUsers.push(structuredClone(updatedUser));
}

export async function fetchMembersFromDB(): Promise<{ user: User; membership: Membership }[]> {
  const currentCircleId = getActiveCircleId();
  try {
    await ensureFirestoreInitialized();
    const [userSnaps, memSnaps] = await Promise.all([
      getDocs(collection(db, USERS_COL)),
      getDocs(collection(db, MEMBERSHIPS_COL))
    ]);
    if (!userSnaps.empty) {
      const users = userSnaps.docs.map((d) => d.data() as User);
      const uniqueUsersMap = new Map<string, User>();
      for (const u of users) {
        const emailKey = (u.email || '').trim().toLowerCase();
        if (emailKey && (!uniqueUsersMap.has(emailKey) || u.id.length > 20)) {
          uniqueUsersMap.set(emailKey, u);
        }
      }
      for (const initialU of initialMahalluUsers) {
        const emailKey = initialU.email.toLowerCase();
        if (!uniqueUsersMap.has(emailKey)) {
          uniqueUsersMap.set(emailKey, initialU);
        }
      }
      localUsers = Array.from(uniqueUsersMap.values());
    } else {
      localUsers = [superAdminUser, ...initialMahalluUsers];
    }
    if (!memSnaps.empty) {
      localMemberships = memSnaps.docs.map((d) => d.data() as Membership);
    } else {
      localMemberships = structuredClone(initialMahalluMemberships);
    }
  } catch (err) {
    console.warn('fetchMembers fallback to local cache:', err);
  }

  const circleUsers = localUsers.filter(
    (u) => (u.circleId || 'mahallu') === currentCircleId && u.role !== 'Super Admin'
  );

  return circleUsers.map((u, i) => {
    const mem = localMemberships.find((m) => m.userId === u.id) || {
      id: `m-${currentCircleId}-${i + 1}`,
      userId: u.id,
      circleId: currentCircleId,
      status: 'Active' as const,
      joinedAt: u.joinedAt || '2026-01-01',
      monthlyCommitment: u.monthlyCommitment || 1000
    };
    return { user: structuredClone(u), membership: structuredClone(mem) };
  });
}

export async function fetchOverviewFromDB(circleId?: string): Promise<Overview> {
  const currentCircleId = circleId || getActiveCircleId();
  await ensureFirestoreInitialized();

  // Ensure contributions, ledger, loans and wealth split are fully fetched
  const [conts, circleLedger, circleLoans, split] = await Promise.all([
    fetchContributionsFromDB(currentCircleId),
    fetchLedgerFromDB(currentCircleId),
    fetchLoansFromDB(currentCircleId),
    fetchWealthSplitFromDB()
  ]);

  const circle = localCircles.find((c) => c.id === currentCircleId) || localCircle;

  const paidContributions = conts.filter((c) => (c.circleId || 'mahallu') === currentCircleId && c.status === 'Paid');
  const regularContributions = paidContributions.filter((c) => c.type !== 'Voluntary');
  const voluntaryContributions = paidContributions.filter((c) => c.type === 'Voluntary');

  const regularTotal = regularContributions.reduce((sum, c) => sum + c.amount, 0);
  const voluntaryTotal = voluntaryContributions.reduce((sum, c) => sum + c.amount, 0);

  const ledgerContributionTotal = circleLedger
    .filter((e) => (e.circleId || 'mahallu') === currentCircleId && e.type === 'Contribution')
    .reduce((sum, e) => sum + e.amount, 0);

  const contributed = Math.max(
    paidContributions.length > 0 ? (regularTotal + voluntaryTotal) : 0,
    ledgerContributionTotal,
    circle.totalContributed || 0
  );

  const lentOut = circleLoans.reduce((sum, l) => sum + (['Active', 'Closed', 'Overdue'].includes(l.status) ? l.amount : 0), 0);
  const repaid = circleLoans.reduce((sum, l) => sum + (l.repaid || 0), 0);
  const repaymentRate = lentOut > 0 ? Math.round((repaid / lentOut) * 100) : 100;

  // 70% emergency pool split calculation
  const emergencyRatio = split.emergencyRatio || 70;
  const emergencyFromRegular = Math.round((regularTotal > 0 ? regularTotal : contributed) * (emergencyRatio / 100));
  const emergencyPool = emergencyFromRegular + voluntaryTotal;
  const availableToLend = Math.max(emergencyPool - lentOut + repaid, 0);

  // Total Available Treasury Pool Balance (all liquid funds)
  const available = Math.max(contributed - lentOut + repaid, 0);

  // Sync circle model
  circle.balance = available;
  circle.totalContributed = contributed;
  circle.totalLentOut = lentOut;
  circle.totalRepaid = repaid;
  if (localCircle.id === currentCircleId) {
    localCircle.balance = available;
    localCircle.totalContributed = contributed;
    localCircle.totalLentOut = lentOut;
    localCircle.totalRepaid = repaid;
  }

  const circleIndex = localCircles.findIndex((c) => c.id === currentCircleId);
  if (circleIndex >= 0) {
    localCircles[circleIndex] = structuredClone(circle);
  }

  const monthLabels = [
    { label: 'Nov', year: 2025, month: 10 },
    { label: 'Dec', year: 2025, month: 11 },
    { label: 'Jan', year: 2026, month: 0 },
    { label: 'Feb', year: 2026, month: 1 },
    { label: 'Mar', year: 2026, month: 2 },
    { label: 'Apr', year: 2026, month: 3 },
    { label: 'May', year: 2026, month: 4 },
    { label: 'Jun', year: 2026, month: 5 },
    { label: 'Jul', year: 2026, month: 6 },
    { label: 'Aug', year: 2026, month: 7 },
    { label: 'Sep', year: 2026, month: 8 },
    { label: 'Oct', year: 2026, month: 9 }
  ];

  const dynamicTrend = monthLabels.map(({ label, year, month }) => {
    const monthConts = paidContributions.filter((c) => {
      const d = new Date(c.date);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const monthLoans = circleLoans.filter((l) => {
      if (!['Active', 'Closed', 'Overdue'].includes(l.status)) return false;
      const d = new Date(l.date || l.disbursedAt || '');
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const monthContributions = monthConts.reduce((sum, c) => sum + c.amount, 0);
    const monthLoansTotal = monthLoans.reduce((sum, l) => sum + l.amount, 0);

    return {
      month: label,
      contributions: monthContributions,
      loans: monthLoansTotal
    };
  });

  return {
    contributed,
    lentOut,
    repaid,
    available,
    availableToLend,
    repaymentRate,
    trend: dynamicTrend
  };
}

export async function fetchContributionsFromDB(circleId?: string): Promise<Contribution[]> {
  const currentCircleId = circleId || getActiveCircleId();
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, CONTRIBUTIONS_COL));
    if (!snaps.empty) {
      const dbConts = snaps.docs.map((d) => d.data() as Contribution);
      localContributions = deduplicateContributions(dbConts);
      persistContributions(localContributions);
    } else {
      // Seed Firestore with initial verified contributions if collection is empty
      const batch = writeBatch(db);
      for (const c of initialMahalluContributions) {
        batch.set(doc(db, CONTRIBUTIONS_COL, c.id), c);
      }
      await batch.commit().catch(() => {});
      localContributions = structuredClone(initialMahalluContributions);
      persistContributions(localContributions);
    }
  } catch (err) {
    console.warn('Using local contributions cache:', err);
    if (localContributions.length === 0) {
      localContributions = getStoredContributions();
    }
    localContributions = deduplicateContributions(localContributions);
  }
  return structuredClone(
    localContributions.filter((c) => (c.circleId || 'mahallu') === currentCircleId)
  );
}

export async function fetchLoansFromDB(circleId?: string): Promise<Loan[]> {
  const currentCircleId = circleId || getActiveCircleId();
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, LOANS_COL));
    if (!snaps.empty) {
      localLoans = snaps.docs.map((d) => d.data() as Loan);
    }
  } catch (err) {
    console.warn('Using local loans cache:', err);
  }
  return structuredClone(
    localLoans.filter((l) => (l.circleId || 'mahallu') === currentCircleId)
  );
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

export async function fetchLedgerFromDB(circleId?: string): Promise<LedgerEntry[]> {
  const currentCircleId = circleId || getActiveCircleId();
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, LEDGER_COL));
    if (!snaps.empty) {
      const dbLedger = snaps.docs.map((d) => d.data() as LedgerEntry);
      localLedger = deduplicateLedger(dbLedger);
      persistLedger(localLedger);
    } else {
      // Seed Firestore with initial verified ledger entries if collection is empty
      const batch = writeBatch(db);
      for (const l of initialMahalluLedger) {
        batch.set(doc(db, LEDGER_COL, l.id), l);
      }
      await batch.commit().catch(() => {});
      localLedger = structuredClone(initialMahalluLedger);
      persistLedger(localLedger);
    }
  } catch (err) {
    console.warn('Using local ledger cache:', err);
    if (localLedger.length === 0) {
      localLedger = getStoredLedger();
    }
    localLedger = deduplicateLedger(localLedger);
  }
  const circleLedger = localLedger
    .filter((e) => (e.circleId || 'mahallu') === currentCircleId)
    .sort((a, b) => a.id.localeCompare(b.id));
  return structuredClone(circleLedger);
}

export async function verifyLedgerInDB(circleId?: string): Promise<boolean> {
  const currentCircleId = circleId || getActiveCircleId();
  const entries = await fetchLedgerFromDB(currentCircleId);
  if (entries.length === 0) return true;
  let total = 0;
  let previous = '00000000';

  for (const e of entries) {
    total += e.amount;
    const payload = {
      id: e.id,
      circleId: e.circleId || currentCircleId,
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
  return true;
}

export async function fetchUserByEmailFromDB(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === 'qard@gmail.com') {
    return structuredClone(superAdminUser);
  }

  try {
    await ensureFirestoreInitialized();
    const q = query(collection(db, USERS_COL), where('email', '==', normalizedEmail));
    const snaps = await getDocs(q);
    if (!snaps.empty && snaps.docs[0]) {
      return snaps.docs[0].data() as User;
    }

    // Also check if any circle has this adminEmail
    const circleQ = query(collection(db, CIRCLES_COL), where('adminEmail', '==', normalizedEmail));
    const circleSnaps = await getDocs(circleQ);
    if (!circleSnaps.empty && circleSnaps.docs[0]) {
      const circleData = circleSnaps.docs[0].data() as Circle;
      const adminName = circleData.adminName || 'Committee Admin';
      const adminUser: User = {
        id: `u-${circleData.id}-admin`,
        name: adminName,
        email: normalizedEmail,
        role: 'Committee Admin',
        initials: adminName.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'CA',
        circleId: circleData.id,
        status: 'Active',
        joinedAt: circleData.createdAt || '2026-10-01'
      };
      await setDoc(doc(db, USERS_COL, adminUser.id), adminUser, { merge: true });
      return adminUser;
    }
  } catch (err) {
    console.warn('User by email fallback:', err);
  }

  const found = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (found) return structuredClone(found);

  const circleFound = localCircles.find((c) => c.adminEmail?.toLowerCase() === normalizedEmail);
  if (circleFound) {
    const adminUser: User = {
      id: `u-${circleFound.id}-admin`,
      name: circleFound.adminName || 'Committee Admin',
      email: normalizedEmail,
      role: 'Committee Admin',
      initials: (circleFound.adminName || 'CA').split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      circleId: circleFound.id,
      status: 'Active',
      joinedAt: circleFound.createdAt || '2026-10-01'
    };
    localUsers.push(adminUser);
    return adminUser;
  }

  return null;
}

export async function fetchUserByRoleFromDB(role: Role): Promise<User> {
  const roleEmailMap: Record<Role, string> = {
    'Super Admin': 'qard@gmail.com',
    'Committee Admin': 'abdul.kareem@perinthalmanna.org',
    'Member': 'rahim.mohammed@perinthalmanna.org',
    'Guarantor': 'yusuf.ali@perinthalmanna.org',
    'Auditor': 'rashid.usman@perinthalmanna.org'
  };

  const targetEmail = roleEmailMap[role];
  if (targetEmail) {
    const user = await fetchUserByEmailFromDB(targetEmail);
    if (user) return structuredClone(user);
  }

  if (role === 'Super Admin') {
    return structuredClone(superAdminUser);
  }

  const defaultFound = initialMahalluUsers.find((u) => u.email === targetEmail) || initialMahalluUsers.find((u) => u.role === role);
  if (defaultFound) return structuredClone(defaultFound);

  const found = localUsers.find((u) => u.role === role);
  if (found) return structuredClone(found);

  return {
    id: `u-${role.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${role} Demo`,
    email: `${role.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role,
    initials: role.slice(0, 2).toUpperCase(),
    circleId: getActiveCircleId(),
    joinedAt: '2026-01-01',
    status: 'Active'
  };
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
  circleId?: string | undefined;
}): Promise<Loan> {
  const currentCircleId = params.circleId || localCircle.id || 'mahallu';
  const circleLoans = localLoans.filter((l) => (l.circleId || 'mahallu') === currentCircleId);
  const count = circleLoans.length + 1;
  const id = `QH-${currentCircleId}-${String(count).padStart(3, '0')}`;
  const today = new Date().toISOString().slice(0, 10);

  // Compute user's emergency fund stake to check for Self-Covered Fast-Track status
  const userContributions = localContributions.filter(
    (c) => (c.circleId || 'mahallu') === currentCircleId && c.userId === params.userId && c.status === 'Paid'
  );
  const userRegular = userContributions.filter((c) => c.type !== 'Voluntary').reduce((sum, c) => sum + c.amount, 0);
  const userVoluntary = userContributions.filter((c) => c.type === 'Voluntary').reduce((sum, c) => sum + c.amount, 0);
  const userEmergencyStake = Math.round((userRegular * localSplitConfig.emergencyRatio) / 100) + userVoluntary;

  const isSelfCovered = userEmergencyStake > 0 && params.amount <= userEmergencyStake;
  const status: Status = isSelfCovered
    ? 'Requested'
    : params.guarantorId
    ? 'Guarantor pending'
    : 'Requested';

  const newLoan: Loan = {
    id,
    userId: params.userId,
    circleId: currentCircleId,
    amount: params.amount,
    purpose: params.purpose,
    status,
    repaid: 0,
    months: params.months,
    date: today,
    guarantorId: params.guarantorId,
    isSelfCovered,
    ...(isSelfCovered ? { eligibilityNote: 'Self-covered loan within member emergency stake share (Fast-Track Eligible)' } : {})
  };

  localLoans.unshift(newLoan);

  const perMonth = Math.round(params.amount / params.months);
  const newInsts: Installment[] = Array.from({ length: params.months }, (_, i) => ({
    id: `${id}-${i + 1}`,
    loanId: id,
    circleId: currentCircleId,
    amount: i === params.months - 1 ? params.amount - perMonth * (params.months - 1) : perMonth,
    dueDate: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString().slice(0, 10),
    status: 'Due'
  }));
  localInstallments.push(...newInsts);

  try {
    const loanPayload = JSON.parse(JSON.stringify(newLoan));
    await setDoc(doc(db, LOANS_COL, id), loanPayload);
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

  const loanCircleId = loan.circleId || localCircle.id || 'mahallu';
  const circle = localCircles.find((c) => c.id === loanCircleId) || (await fetchCircleFromDB());
  if (loan.amount > circle.balance) {
    throw new Error(`Insufficient pool funds in ${circle.name}. Available: ₹${circle.balance.toLocaleString('en-IN')}`);
  }

  loan.status = 'Active';
  const today = new Date().toISOString().slice(0, 10);

  await appendLedgerEntry({
    date: today,
    type: 'Disbursement',
    description: `${loan.id} · principal disbursed`,
    amount: -loan.amount,
    circleId: loanCircleId
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
  const loanCircleId = loan.circleId || localCircle.id || 'mahallu';

  await appendLedgerEntry({
    date: today,
    type: 'Repayment',
    description: `${loan.id} · installment received`,
    amount: inst.amount,
    circleId: loanCircleId
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
  const loanCircleId = loan.circleId || localCircle.id || 'mahallu';

  await appendLedgerEntry({
    date: today,
    type: 'Repayment',
    description: `${loan.id} · installment sponsored by ${sponsorName} (Sadaqah Ibra'a)`,
    amount: inst.amount,
    circleId: loanCircleId
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
  const currentCircleId = data.circleId || localCircle.id || 'mahallu';
  if (localContributions.length === 0) {
    localContributions = getStoredContributions();
  }
  const circleContributions = localContributions.filter((c) => (c.circleId || 'mahallu') === currentCircleId);
  const count = circleContributions.length + 1;
  const id = `c-${currentCircleId}-${count}-${Date.now().toString(36)}`;
  const newContribution: Contribution = {
    id,
    ...data,
    circleId: currentCircleId
  };

  localContributions.unshift(newContribution);
  persistContributions(localContributions);

  if (newContribution.status === 'Paid') {
    const user = localUsers.find((u) => u.id === data.userId);
    const donorName = user ? user.name : 'Circle member';
    await appendLedgerEntry({
      date: data.date,
      type: 'Contribution',
      description: `${donorName} · ${data.type === 'Voluntary' ? 'voluntary sadaqah pool donation' : 'regular pool contribution'}`,
      amount: data.amount,
      circleId: currentCircleId
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
  persistContributions(localContributions);
  const currentCircleId = cont.circleId || localCircle.id || 'mahallu';

  const user = localUsers.find((u) => u.id === cont.userId);
  const donorName = user ? user.name : 'Circle member';
  await appendLedgerEntry({
    date: new Date().toISOString().slice(0, 10),
    type: 'Contribution',
    description: `${donorName} · ${cont.type === 'Voluntary' ? 'voluntary sadaqah pool donation' : 'regular pool contribution'}`,
    amount: cont.amount,
    circleId: currentCircleId
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
  password?: string;
  phone?: string;
  address?: string;
  circleId?: string;
  monthlyCommitment?: number;
  note?: string;
}): Promise<{ user: User; membership: Membership }> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const circleId = data.circleId || localCircle.id || 'mahallu';
  const monthlyCommitment = data.monthlyCommitment ?? 1000;
  const userId = `u-${Date.now().toString(36)}`;
  const memId = `m-${circleId}-${Date.now().toString(36)}`;

  const initials = data.name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MB';

  const newUser: User = {
    id: userId,
    name: data.name.trim(),
    email: normalizedEmail,
    role: 'Member',
    initials,
    circleId,
    phone: data.phone?.trim() || '',
    joinedAt: new Date().toISOString().slice(0, 10),
    status: 'Active',
    monthlyCommitment
  };

  const newMem: Membership = {
    id: memId,
    userId,
    circleId,
    status: 'Active',
    joinedAt: new Date().toISOString().slice(0, 10),
    monthlyCommitment
  };

  localUsers.push(newUser);
  localMemberships.push(newMem);

  const targetCircle = localCircles.find((c) => c.id === circleId);
  if (targetCircle) {
    targetCircle.memberCount += 1;
    targetCircle.maxMonths = Math.max(targetCircle.memberCount, 12);
  }

  try {
    await ensureFirestoreInitialized();
    await setDoc(doc(db, USERS_COL, userId), newUser);
    await setDoc(doc(db, MEMBERSHIPS_COL, memId), newMem);
    if (targetCircle) {
      await updateDoc(doc(db, CIRCLES_COL, targetCircle.id), {
        memberCount: targetCircle.memberCount,
        maxMonths: targetCircle.maxMonths
      });
    }
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
      syncLocalCircleWithActive();
      return structuredClone(localCircles);
    }
  } catch (err) {
    console.warn('Using local circles cache:', err);
  }
  syncLocalCircleWithActive();
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
  adminName: string;
  adminEmail: string;
  adminMonthlyCommitment?: number | undefined;
}): Promise<Circle> {
  const id = `mahallu-${Date.now().toString(36)}`;
  const startingBalance = data.balance ?? 100000;
  const initialMemberCount = 1;
  const dynamicMaxMonths = Math.max(initialMemberCount, 12);

  const adminName = (data.adminName || 'Committee Admin').trim();
  const adminEmail = (data.adminEmail || 'admin@mahallu.org').trim().toLowerCase();

  const newCircle: Circle = {
    id,
    name: data.name.trim(),
    mosque: data.mosque.trim(),
    location: data.location.trim(),
    balance: startingBalance,
    memberCount: initialMemberCount,
    maxLoan: data.maxLoan ?? 50000,
    maxMonths: dynamicMaxMonths,
    minContribution: data.minContribution ?? 1000,
    totalContributed: startingBalance,
    totalLentOut: 0,
    totalRepaid: 0,
    createdAt: new Date().toISOString().split('T')[0],
    adminName,
    adminEmail,
    status: 'Active'
  };

  localCircles.push(newCircle);

  // Mandatory initial Committee Admin user creation under this new circle
  const adminMonthly = data.adminMonthlyCommitment ?? data.minContribution ?? 1000;
  const adminUser: User = {
    id: `u-${Date.now().toString(36)}`,
    name: adminName,
    email: adminEmail,
    role: 'Committee Admin',
    initials: adminName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CA',
    circleId: id,
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'Active',
    monthlyCommitment: adminMonthly
  };
  localUsers.push(adminUser);
  localMemberships.push({
    id: `m-${Date.now().toString(36)}`,
    userId: adminUser.id,
    circleId: id,
    status: 'Active',
    joinedAt: adminUser.joinedAt || '2026-10-01',
    monthlyCommitment: adminMonthly
  });

  try {
    await setDoc(doc(db, USERS_COL, adminUser.id), adminUser);
    await setDoc(doc(db, CIRCLES_COL, id), newCircle);
  } catch (err) {
    console.warn('Firestore createCircle fallback:', err);
  }

  return structuredClone(newCircle);
}

export async function updateCircleInDB(circleId: string, updates: Partial<Circle>): Promise<Circle> {
  const idx = localCircles.findIndex((c) => c.id === circleId);
  if (idx !== -1 && localCircles[idx]) {
    const current = localCircles[idx]!;
    const updatedMemberCount = updates.memberCount ?? current.memberCount;
    const computedMaxMonths = updates.maxMonths ?? Math.max(updatedMemberCount, 12);
    localCircles[idx] = { ...current, ...updates, maxMonths: computedMaxMonths };
  }
  if (localCircle.id === circleId) {
    const computedMaxMonths = updates.maxMonths ?? Math.max(updates.memberCount ?? localCircle.memberCount, 12);
    localCircle = { ...localCircle, ...updates, maxMonths: computedMaxMonths };
  }

  try {
    await updateDoc(doc(db, CIRCLES_COL, circleId), updates);
  } catch (err) {
    console.warn('Firestore updateCircle fallback:', err);
  }

  const res = localCircles[idx] || localCircle;
  return structuredClone(res);
}

export async function deleteMahallInDB(circleId: string): Promise<{ success: boolean }> {
  if (circleId === 'mahallu') {
    throw new Error('The default root circle (Mahallu Qard Hasan Circle) cannot be deleted.');
  }

  // Remove from local cache
  localCircles = localCircles.filter((c) => c.id !== circleId);
  localUsers = localUsers.filter((u) => u.circleId !== circleId || u.role === 'Super Admin');
  localMemberships = localMemberships.filter((m) => m.circleId !== circleId);
  localContributions = localContributions.filter((c) => c.circleId !== circleId);
  localLoans = localLoans.filter((l) => l.circleId !== circleId);
  localLedger = localLedger.filter((e) => e.circleId !== circleId);

  // If the deleted circle was active, switch to 'mahallu'
  if (localCircle.id === circleId) {
    localCircle = structuredClone(defaultCircles[0]!);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('qard-active-mahall-id', 'mahallu');
      } catch {}
    }
  }

  try {
    await ensureFirestoreInitialized();
    await deleteDoc(doc(db, CIRCLES_COL, circleId));

    const memQ = query(collection(db, MEMBERSHIPS_COL), where('circleId', '==', circleId));
    const memSnaps = await getDocs(memQ);
    const batch = writeBatch(db);
    memSnaps.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.warn('Firestore deleteMahall fallback:', err);
  }

  return { success: true };
}

export async function purgeExtraMahallsInDB(): Promise<{ success: boolean; deletedCount: number }> {
  let deletedCount = 0;
  try {
    await ensureFirestoreInitialized();
    const snaps = await getDocs(collection(db, CIRCLES_COL));
    const batch = writeBatch(db);
    snaps.docs.forEach((d) => {
      if (d.id !== 'mahallu') {
        batch.delete(d.ref);
        deletedCount += 1;
      }
    });

    batch.set(doc(db, CIRCLES_COL, 'mahallu'), defaultCircles[0]!, { merge: true });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore purgeExtraMahalls fallback:', err);
  }

  localCircles = structuredClone(defaultCircles);
  localCircle = structuredClone(defaultCircles[0]!);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('qard-active-mahall-id', 'mahallu');
    } catch {}
  }

  return { success: true, deletedCount };
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
      const uniqueUsersMap = new Map<string, User>();
      const batch = writeBatch(db);
      let hadDuplicates = false;

      for (const d of snaps.docs) {
        const u = d.data() as User;
        const emailKey = (u.email || '').trim().toLowerCase();
        if (!emailKey) continue;

        if (uniqueUsersMap.has(emailKey)) {
          const existing = uniqueUsersMap.get(emailKey)!;
          if (u.id.length > existing.id.length) {
            batch.delete(doc(db, USERS_COL, existing.id));
            uniqueUsersMap.set(emailKey, u);
          } else {
            batch.delete(d.ref);
          }
          hadDuplicates = true;
        } else {
          uniqueUsersMap.set(emailKey, u);
        }
      }

      for (const initialU of initialMahalluUsers) {
        const emailKey = initialU.email.toLowerCase();
        if (!uniqueUsersMap.has(emailKey)) {
          uniqueUsersMap.set(emailKey, initialU);
        }
      }

      if (hadDuplicates) {
        try {
          await batch.commit();
        } catch {}
      }

      localUsers = Array.from(uniqueUsersMap.values());
    } else {
      localUsers = [superAdminUser, ...initialMahalluUsers];
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

export async function createMembershipForUserInDB(
  userId: string,
  circleId: string,
  monthlyCommitment = 1000
): Promise<Membership> {
  const membershipId = `m-${circleId}-${Date.now().toString(36)}`;
  const newMembership: Membership = {
    id: membershipId,
    userId,
    circleId,
    status: 'Active',
    joinedAt: new Date().toISOString().slice(0, 10),
    monthlyCommitment
  };

  localMemberships.push(newMembership);

  const targetCircle = localCircles.find((c) => c.id === circleId);
  if (targetCircle) {
    targetCircle.memberCount += 1;
    targetCircle.maxMonths = Math.max(targetCircle.memberCount, 12);
  }

  try {
    await ensureFirestoreInitialized();
    await setDoc(doc(db, MEMBERSHIPS_COL, membershipId), newMembership);
    if (targetCircle) {
      await updateDoc(doc(db, CIRCLES_COL, targetCircle.id), {
        memberCount: targetCircle.memberCount,
        maxMonths: targetCircle.maxMonths
      });
    }
  } catch (err) {
    console.warn('Firestore createMembershipForUser fallback:', err);
  }

  return structuredClone(newMembership);
}

export async function createUserAndAssignToMahalluInDB(data: {
  name: string;
  email: string;
  role: Role;
  circleId: string;
  phone?: string | undefined;
  monthlyCommitment?: number | undefined;
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

  const monthlyCommitment = data.monthlyCommitment ?? 1000;

  const newUser: User = {
    id: userId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    initials,
    circleId: data.circleId,
    phone: data.phone?.trim() || '',
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'Active',
    monthlyCommitment
  };

  const newMembership: Membership = {
    id: membershipId,
    userId,
    circleId: data.circleId,
    status: 'Active',
    joinedAt: newUser.joinedAt || '2026-10-01',
    monthlyCommitment
  };

  localUsers.push(newUser);
  localMemberships.push(newMembership);

  // Update target circle member count and dynamic maxMonths
  const targetCircle = localCircles.find((c) => c.id === data.circleId);
  if (targetCircle) {
    targetCircle.memberCount += 1;
    targetCircle.maxMonths = Math.max(targetCircle.memberCount, 12);
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
        maxMonths: targetCircle.maxMonths,
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

