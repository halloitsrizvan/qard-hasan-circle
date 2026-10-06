import { circle, users, memberships, contributions, loans, installments, ledger, overview, fingerprint } from '@/data/seed';
import type { Circle, User, Membership, Contribution, Loan, Installment, LedgerEntry, Overview, Role } from '@/lib/types';
export interface AuthService { getDemoUser(role: Role): Promise<User> }
export interface CircleService { getActive(): Promise<Circle>; getMembers(): Promise<{user:User;membership:Membership}[]>; getOverview():Promise<Overview> }
export interface ContributionService { list(): Promise<Contribution[]> }
export interface LoanService { list():Promise<Loan[]>; getInstallments(id:string):Promise<Installment[]> }
export interface LedgerService { list():Promise<LedgerEntry[]>; verify():Promise<boolean> }
const copy = <T,>(value:T):T => structuredClone(value);
export const authService:AuthService = { async getDemoUser(role) { const index=role==='Committee Admin'?0:role==='Member'?1:role==='Guarantor'?3:7;return {...copy(users[index]),role}; } };
export const circleService:CircleService = {async getActive(){return copy(circle)},async getMembers(){return memberships.map(m=>({membership:copy(m),user:copy(users.find(u=>u.id===m.userId) ?? users[0])}))},async getOverview(){return copy(overview)}};
export const contributionService:ContributionService = {async list(){return copy(contributions)}};
export const loanService:LoanService = {async list(){return copy(loans)},async getInstallments(id){return copy(installments.filter(i=>i.loanId===id))}};
export const ledgerService:LedgerService = {async list(){return copy(ledger)},async verify(){let total=0,previous='00000000';for(const e of ledger){total+=e.amount; const {hash,...rest}=e;if(e.balance!==total||e.previousHash!==previous||hash!==fingerprint(JSON.stringify(rest)))return false;previous=hash;}return total===circle.balance}};
export const circleQueries = {overview:{queryKey:['overview'],queryFn:()=>circleService.getOverview()},loans:{queryKey:['loans'],queryFn:()=>loanService.list()},ledger:{queryKey:['ledger'],queryFn:()=>ledgerService.list()},members:{queryKey:['members'],queryFn:()=>circleService.getMembers()},contributions:{queryKey:['contributions'],queryFn:()=>contributionService.list()}};
