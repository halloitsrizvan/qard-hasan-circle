import type { Circle, User, Membership, Contribution, Loan, Installment, LedgerEntry, Overview } from '@/lib/types';
export const circle: Circle = { id: 'mahallu', name: 'Mahallu Qard Hasan Circle', mosque: 'Perinthalmanna Juma Masjid', location: 'Perinthalmanna, Kerala', balance: 150000, memberCount: 12, maxLoan: 50000, maxMonths: 12, minContribution: 500 };
const names = ['Abdul Kareem', 'Rahim Mohammed', 'Fathima Nasrin', 'Yusuf Ali', 'Ayesha Hameed', 'Muhammed Shafi', 'Khadija Basheer', 'Ibrahim Kutty', 'Nabeela Hassan', 'Farhan Ahmed', 'Suhara Abdul', 'Rashid Usman'];
export const users: User[] = names.map((name, i) => ({ id: `u${i+1}`, name, initials: name.split(' ').map(n=>n[0]).join(''), email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`, role: i === 0 ? 'Committee Admin' : 'Member' }));
export const memberships: Membership[] = users.map((u, i)=>({id:`m${i+1}`, userId:u.id, circleId:circle.id, status:'Active', joinedAt:'2026-01-01'}));
export const contributions: Contribution[] = Array.from({length:14}, (_,i)=>({id:`c${i+1}`,userId:`u${i%12+1}`,amount:15000,date:`2026-${String(Math.floor(i/2)+1).padStart(2,'0')}-${i%2 ? '18' : '05'}`,type:i%4===0?'Voluntary':'Regular',status:'Paid'}));
export const loans: Loan[] = [
{id:'QH-006',userId:'u2',amount:30000,purpose:"Mother’s surgery",status:'Requested',repaid:0,months:6,date:'2026-10-05',guarantorId:'u4'},
{id:'QH-005',userId:'u3',amount:20000,purpose:'Education expenses',status:'Guarantor pending',repaid:0,months:8,date:'2026-10-03',guarantorId:'u4'},
{id:'QH-004',userId:'u6',amount:40000,purpose:'Small business support',status:'Active',repaid:10000,months:8,date:'2026-08-12',guarantorId:'u8'},
{id:'QH-003',userId:'u5',amount:20000,purpose:'Home repairs',status:'Closed',repaid:20000,months:4,date:'2026-03-15',guarantorId:'u7'},
{id:'QH-002',userId:'u10',amount:25000,purpose:'Medical expenses',status:'Overdue',repaid:10000,months:5,date:'2026-06-10',guarantorId:'u4'},
{id:'QH-001',userId:'u11',amount:15000,purpose:'Family support',status:'Waived',repaid:0,months:5,date:'2026-02-15',guarantorId:'u8'},
];
export const installments: Installment[] = loans.flatMap(l=>Array.from({length:l.months},(_,i)=>({id:`${l.id}-${i+1}`,loanId:l.id,amount:l.amount/l.months,dueDate:`2026-${String(Math.min(i+4,12)).padStart(2,'0')}-15`,status:l.status==='Waived'?'Waived':i<Math.round(l.repaid/(l.amount/l.months))?'Paid':l.status==='Overdue'&&i===2?'Overdue':'Due'})));
// Deterministic demo chain fingerprints, not production cryptographic verification.
export function fingerprint(value: string): string { let h=2166136261; for(const c of value) h=Math.imul(h^c.charCodeAt(0),16777619); return (h>>>0).toString(16).padStart(8,'0'); }
const transactions = [
...contributions.map(c=>({date:c.date,type:'Contribution' as const,description:`${users.find(u=>u.id===c.userId)?.name} · pool contribution`,amount:c.amount})),
...loans.filter(l=>!['Requested','Guarantor pending'].includes(l.status)).map(l=>({date:l.date,type:'Disbursement' as const,description:`${l.id} · principal disbursed`,amount:-l.amount})),
...Array.from({length:22},(_,i)=>({date:`2026-${String(5+Math.floor(i/4)).padStart(2,'0')}-${String(3+(i%4)*6).padStart(2,'0')}`,type:'Repayment' as const,description:`${i<11?'QH-003':i<17?'QH-004':'QH-002'} · installment received`,amount:i<10?1800:i===10?2000:i<16?1600:i===16?2000:2000}))
].sort((a,b)=>a.date.localeCompare(b.date));
let balance=0, previousHash='00000000';
export const ledger: LedgerEntry[] = transactions.map((t,i)=>{balance+=t.amount; const id=`LE-${String(i+1).padStart(3,'0')}`;const hash=fingerprint(JSON.stringify({id,...t,balance,previousHash}));const entry={id,...t,balance,hash,previousHash};previousHash=hash;return entry;});
export const overview: Overview = {contributed:210000,lentOut:45000,repaid:40000,available:150000,repaymentRate:89,trend:[{month:'Nov',contributions:0,loans:0},{month:'Dec',contributions:0,loans:0},{month:'Jan',contributions:30000,loans:0},{month:'Feb',contributions:30000,loans:15000},{month:'Mar',contributions:30000,loans:20000},{month:'Apr',contributions:30000,loans:0},{month:'May',contributions:30000,loans:0},{month:'Jun',contributions:30000,loans:25000},{month:'Jul',contributions:30000,loans:0},{month:'Aug',contributions:0,loans:40000},{month:'Sep',contributions:0,loans:0},{month:'Oct',contributions:0,loans:0}]};
