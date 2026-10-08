import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@tanstack/react-router';
import {
  Crown,
  Building2,
  Users,
  Wallet,
  HandCoins,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  ArrowLeftRight,
  Sparkles,
  Edit,
  Trash2,
  ShieldAlert,
  ChevronRight,
  Check,
  X,
  MapPin,
  Landmark,
  Coins,
  Phone,
  Mail,
  UserCheck,
  Scale,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circleService } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import { Money, PageIntro, SectionHeading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Circle, User, Role, SuperAdminStats, Membership } from '@/lib/types';

export function SuperAdminView() {
  const queryClient = useQueryClient();
  const { role, switchRole, switchCircle, circle: activeCircle, setAuthModalOpen } = useDemo();

  // Authorize /admin page ONLY for Super Admin
  if (role !== 'Super Admin') {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-card p-7 sm:p-9 shadow-2xl text-center space-y-5 animate-in fade-in-0">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-sm">
            <Lock size={32} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
              <Crown size={13} className="text-amber-500" />
              <span>Restricted Administrative Zone</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Super Admin Authorization Required
            </h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              The <strong>/admin</strong> console is strictly authorized for the <strong>Super Administrator</strong> account (<code className="text-foreground font-semibold">qard@gmail.com</code>).
              Your current active session (<span className="font-semibold text-primary">{role}</span>) does not possess federation-level management permissions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required Privilege:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Super Admin (Only)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Active Role:</span>
              <span className="font-semibold text-foreground">{role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Super Admin Email:</span>
              <span className="font-mono text-foreground font-medium">qard@gmail.com</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              onClick={() => {
                switchRole('Super Admin');
                toast.success('Switched session to Super Admin!');
              }}
              className="w-full rounded-xl py-5 font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <Crown size={16} />
              <span>Switch to Super Admin (qard@gmail.com)</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full rounded-xl py-5 font-semibold text-xs"
            >
              <Link to="/dashboard">
                <span>← Return to Community Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'mahalls' | 'members' | 'analytics'>('mahalls');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMahallFilter, setSelectedMahallFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modals state
  const [createMahallOpen, setCreateMahallOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editMahallOpen, setEditMahallOpen] = useState(false);
  const [editingMahall, setEditingMahall] = useState<Circle | null>(null);
  const [reassignRoleOpen, setReassignRoleOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ user: User; circle?: Circle | undefined; membership?: Membership | undefined } | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['superAdminStats'],
    queryFn: () => circleService.getSuperAdminStats()
  });

  const { data: allCircles = [], isLoading: circlesLoading } = useQuery({
    queryKey: ['allCircles'],
    queryFn: () => circleService.getAllCircles()
  });

  const { data: allUsersWithMahall = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsersWithMahallu'],
    queryFn: () => circleService.getAllUsersWithMahallu()
  });

  // Delete single Mahall Mutation
  const deleteMahallMutation = useMutation({
    mutationFn: async (circleId: string) => {
      return circleService.deleteMahall(circleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCircles'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      queryClient.invalidateQueries({ queryKey: ['allUsersWithMahallu'] });
      queryClient.invalidateQueries({ queryKey: ['activeCircle'] });
      toast.success('Mahall deleted successfully.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete Mahall');
    }
  });

  // Purge extra Mahalls Mutation
  const purgeMahallsMutation = useMutation({
    mutationFn: async () => {
      return circleService.purgeExtraMahalls();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCircles'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      queryClient.invalidateQueries({ queryKey: ['allUsersWithMahallu'] });
      queryClient.invalidateQueries({ queryKey: ['activeCircle'] });
      toast.success('Deleted extra Mahalls. Kept only Mahallu Qard Hasan Circle.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to purge Mahalls');
    }
  });

  // Filtered members list
  const filteredUsers = allUsersWithMahall.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.circle?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesMahall =
      selectedMahallFilter === 'all' || item.user.circleId === selectedMahallFilter || item.circle?.id === selectedMahallFilter;

    const matchesRole =
      selectedRoleFilter === 'all' || item.user.role === selectedRoleFilter;

    return matchesSearch && matchesMahall && matchesRole;
  });

  // Filtered mahalls list
  const filteredCircles = allCircles.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mosque.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
            <Crown size={14} className="text-amber-500" />
            <span>Super Administrator Console</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Mahallu Federation Central Hub
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Global monitoring, Mahallu creation, and multi-tier role assignments (Committee Admins, Members, Guarantors, Auditors).
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {allCircles.length > 1 && (
            <Button
              onClick={async () => {
                if (confirm('Are you sure you want to delete all other Mahalls and keep ONLY Mahallu Qard Hasan Circle?')) {
                  await purgeMahallsMutation.mutateAsync();
                }
              }}
              variant="outline"
              className="gap-2 rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs shadow-sm cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Delete Other Mahalls</span>
            </Button>
          )}

          <Button
            onClick={() => setCreateMahallOpen(true)}
            className="gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            <Plus size={16} />
            <span>Create New Mahall</span>
          </Button>

          <Button
            onClick={() => setAddMemberOpen(true)}
            variant="outline"
            className="gap-2 rounded-xl border-border bg-card hover:bg-muted font-bold text-xs shadow-sm"
          >
            <UserPlus size={16} className="text-primary" />
            <span>Assign User to Mahall</span>
          </Button>
        </div>
      </div>

      {/* Global Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Mahalls</span>
            <Building2 size={16} className="text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {stats?.totalMahalls ?? allCircles.length}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={11} />
            <span>All Circles Active</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Members</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {stats?.totalMembers ?? allUsersWithMahall.length}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            Across {stats?.totalMahalls ?? allCircles.length} Masjids
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Contributed</span>
            <Wallet size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2">
            <Money
              amount={stats?.totalContributedOverall ?? 1205000}
              className="font-display text-2xl font-bold text-foreground"
            />
          </div>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={11} />
            <span>Cumulative Pool</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">0% Qard Disbursed</span>
            <HandCoins size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <Money
              amount={stats?.totalLentOutOverall ?? 310000}
              className="font-display text-2xl font-bold text-foreground"
            />
          </div>
          <span className="mt-1 text-[10px] font-medium text-muted-foreground">
            {stats?.activeLoansCount ?? 14} Active Loans
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Treasury</span>
            <Coins size={16} className="text-purple-500" />
          </div>
          <div className="mt-2">
            <Money
              amount={stats?.totalTreasuryBalance ?? 880000}
              className="font-display text-2xl font-bold text-foreground"
            />
          </div>
          <span className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Available Liquidity
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Repayment Health</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.repaymentRateOverall ?? 98}%
          </p>
          <span className="mt-1 text-[10px] font-medium text-muted-foreground">
            0% Interest / 0 Riba
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 gap-3">
        <div className="flex rounded-2xl bg-muted p-1 border">
          <button
            type="button"
            onClick={() => setActiveTab('mahalls')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'mahalls'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 size={15} />
            <span>Mahalls Registry ({allCircles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'members'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={15} />
            <span>Members & Roles ({allUsersWithMahall.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scale size={15} />
            <span>Federation Governance</span>
          </button>
        </div>

        {/* Search and Filter bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, mosque, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl pl-8 text-xs"
            />
          </div>

          {activeTab === 'members' && (
            <select
              value={selectedMahallFilter}
              onChange={(e) => setSelectedMahallFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="all">All Mahalls</option>
              {allCircles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.mosque}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'members' && (
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="Committee Admin">Committee Admin</option>
              <option value="Member">Member</option>
              <option value="Guarantor">Guarantor</option>
              <option value="Auditor">Auditor</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MAHALLS REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'mahalls' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredCircles.map((c) => {
              const isActiveCircle = activeCircle?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-3xl border transition-all p-6 relative overflow-hidden flex flex-col justify-between ${
                    isActiveCircle
                      ? 'border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/40 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                          <Landmark size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-lg font-bold text-foreground">{c.name}</h3>
                            {isActiveCircle && (
                              <span className="rounded-md bg-primary/15 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary">
                                Active In App
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <MapPin size={13} className="text-primary" />
                            <span>{c.mosque} · {c.location}</span>
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        {c.status || 'Active'}
                      </span>
                    </div>

                    {/* Stats Grid for this Mahall */}
                    <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-2xl border bg-muted/30 p-3.5 text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium">Treasury</span>
                        <div className="mt-0.5">
                          <Money amount={c.balance} className="font-bold text-xs text-foreground" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium">Members</span>
                        <p className="mt-0.5 font-bold text-xs text-foreground">{c.memberCount} people</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium">Max Loan</span>
                        <div className="mt-0.5">
                          <Money amount={c.maxLoan} className="font-bold text-xs text-foreground" />
                        </div>
                      </div>
                    </div>

                    {/* Committee Admin Info */}
                    <div className="mt-4 rounded-xl border border-border/60 bg-card p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          {c.adminName ? c.adminName[0] : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-none">{c.adminName || 'Unassigned'}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Committee Admin ({c.adminEmail || 'admin@mahallu.org'})</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-primary">In Charge</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await switchCircle(c.id);
                        toast.success(`Switched active circle to: ${c.name}`);
                      }}
                      variant={isActiveCircle ? 'secondary' : 'default'}
                      className="flex-1 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <ArrowLeftRight size={14} />
                      <span>{isActiveCircle ? 'Currently Active' : 'Switch Context'}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingMahall(c);
                        setEditMahallOpen(true);
                      }}
                      className="rounded-xl text-xs font-semibold gap-1.5"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMahallFilter(c.id);
                        setActiveTab('members');
                      }}
                      className="rounded-xl text-xs font-semibold gap-1"
                    >
                      <Users size={13} />
                      <span>Users</span>
                    </Button>

                    {c.id !== 'mahallu' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete ${c.name} (${c.mosque})?`)) {
                            await deleteMahallMutation.mutateAsync(c.id);
                          }
                        }}
                        className="rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/30 gap-1 cursor-pointer"
                        title="Delete Mahall"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEMBERS & ROLE MANAGEMENT (UNDER MAHALLS) */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-5">
          {/* Mahall Filter Header Card */}
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Filter by Mahallu Circle
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select a specific mosque circle to isolate committee admins, members, guarantors, and auditors.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(selectedMahallFilter !== 'all' || selectedRoleFilter !== 'all' || searchQuery.trim() !== '') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedMahallFilter('all');
                      setSelectedRoleFilter('all');
                      setSearchQuery('');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                  >
                    <X size={13} />
                    <span>Reset Filters</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => setAddMemberOpen(true)}
                  className="h-8 gap-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                >
                  <UserPlus size={14} />
                  <span>Assign New User</span>
                </Button>
              </div>
            </div>

            {/* Quick-Filter Pills: All Mahalls + Each Registered Circle */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
              {/* All Mahalls Pill */}
              <button
                type="button"
                onClick={() => setSelectedMahallFilter('all')}
                className={`group flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedMahallFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                }`}
              >
                <Building2 size={13} className={selectedMahallFilter === 'all' ? 'text-primary-foreground' : 'text-primary'} />
                <span>All Mahalls</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-extrabold ${
                    selectedMahallFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-background text-foreground/80'
                  }`}
                >
                  {allUsersWithMahall.length}
                </span>
              </button>

              {/* Individual Circles Pills */}
              {allCircles.map((circleItem) => {
                const count = allUsersWithMahall.filter(
                  (u) => u.user.circleId === circleItem.id || u.circle?.id === circleItem.id
                ).length;
                const isSelected = selectedMahallFilter === circleItem.id;

                return (
                  <button
                    key={circleItem.id}
                    type="button"
                    onClick={() => setSelectedMahallFilter(circleItem.id)}
                    className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-2 ring-primary/20 font-bold'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                    }`}
                  >
                    <Landmark size={13} className={isSelected ? 'text-primary-foreground' : 'text-primary'} />
                    <span className="truncate max-w-[150px] sm:max-w-[180px]">{circleItem.mosque}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-background text-foreground/80'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filter Controls: Role Selector & Search Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-border/40">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Role:</span>
                {[
                  { label: 'All Roles', value: 'all' },
                  { label: 'Committee Admin', value: 'Committee Admin' },
                  { label: 'Member', value: 'Member' },
                  { label: 'Guarantor', value: 'Guarantor' },
                  { label: 'Auditor', value: 'Auditor' }
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRoleFilter(r.value)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedRoleFilter === r.value
                        ? 'bg-foreground text-background font-bold shadow-xs'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-muted-foreground font-medium">
                Showing <strong className="text-foreground">{filteredUsers.length}</strong> of{' '}
                <strong className="text-foreground">{allUsersWithMahall.length}</strong> persons
                {selectedMahallFilter !== 'all' && (
                  <span className="ml-1 text-primary font-semibold">
                    (in {allCircles.find((c) => c.id === selectedMahallFilter)?.mosque || 'selected Mahall'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Members Table or Empty State */}
          {filteredUsers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Users size={24} />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">
                  No members found matching filter
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {selectedMahallFilter !== 'all'
                    ? `There are currently no registered persons under ${
                        allCircles.find((c) => c.id === selectedMahallFilter)?.mosque || 'this Mahall'
                      }.`
                    : 'Try changing your search query or role filter.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMahallFilter('all');
                    setSelectedRoleFilter('all');
                    setSearchQuery('');
                  }}
                  className="rounded-xl text-xs"
                >
                  Clear All Filters
                </Button>

                <Button
                  size="sm"
                  onClick={() => setAddMemberOpen(true)}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <UserPlus size={13} />
                  <span>Assign First Member</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">User / Person</th>
                      <th className="px-5 py-3.5">Assigned Mahallu</th>
                      <th className="px-5 py-3.5">Role Under Mahall</th>
                      <th className="px-5 py-3.5">Monthly Commitment</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Joined Date</th>
                      <th className="px-5 py-3.5 text-right">Role Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((item) => {
                      const roleColor =
                        item.user.role === 'Super Admin'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : item.user.role === 'Committee Admin'
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                          : item.user.role === 'Guarantor'
                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                          : item.user.role === 'Auditor'
                          ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';

                      const isCurrentMahallFiltered =
                        selectedMahallFilter !== 'all' &&
                        (item.user.circleId === selectedMahallFilter || item.circle?.id === selectedMahallFilter);

                      const monthlyCommitment =
                        item.user.monthlyCommitment ?? item.membership?.monthlyCommitment ?? item.circle?.minContribution ?? 1000;

                      return (
                        <tr
                          key={item.user.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isCurrentMahallFiltered ? 'bg-primary/[0.015]' : ''
                          }`}
                        >
                          {/* User info */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0">
                                {item.user.initials}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{item.user.name}</p>
                                <p className="text-[11px] text-muted-foreground">{item.user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Mahallu info with Quick Filter click */}
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.circle?.id) {
                                  setSelectedMahallFilter(item.circle.id);
                                }
                              }}
                              className="text-left group/mahall cursor-pointer"
                              title="Click to filter by this Mahall"
                            >
                              <div className="flex items-center gap-1.5">
                                <Landmark size={13} className="text-primary shrink-0 group-hover/mahall:scale-110 transition-transform" />
                                <span className="font-semibold text-foreground group-hover/mahall:text-primary group-hover/mahall:underline transition-colors">
                                  {item.circle?.mosque || 'Mahallu Qard Hasan Circle'}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block ml-5">
                                {item.circle?.location || 'Kerala'}
                              </span>
                            </button>
                          </td>

                          {/* Role under Mahall */}
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${roleColor}`}>
                              {item.user.role === 'Super Admin' && <Crown size={12} className="text-amber-500" />}
                              {item.user.role === 'Committee Admin' && <ShieldCheck size={12} />}
                              {item.user.role === 'Guarantor' && <UserCheck size={12} />}
                              {item.user.role === 'Auditor' && <Scale size={12} />}
                              {item.user.role === 'Member' && <Users size={12} />}
                              <span>{item.user.role}</span>
                            </span>
                          </td>

                          {/* Monthly Commitment */}
                          <td className="px-5 py-3.5 font-mono font-bold text-xs text-foreground">
                            <Money amount={monthlyCommitment} />
                            <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={13} />
                              <span>Active</span>
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5 text-muted-foreground text-[11px]">
                            {item.user.joinedAt || '2026-01-01'}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTargetUser(item);
                                setReassignRoleOpen(true);
                              }}
                              className="rounded-xl text-xs font-bold gap-1.5 hover:border-primary/50"
                            >
                              <Edit size={12} />
                              <span>Change Role / Mahall</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FEDERATION GOVERNANCE & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Roles Distribution */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground">
                  Leadership & Member Distribution
                </h3>
                <ShieldCheck size={18} className="text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Distribution of roles across all registered Mahalls adhering to the Shariah Governance protocol.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { role: 'Committee Admins', count: allUsersWithMahall.filter((u) => u.user.role === 'Committee Admin').length, total: allUsersWithMahall.length, color: 'bg-purple-500' },
                  { role: 'Guarantors (Kafala)', count: allUsersWithMahall.filter((u) => u.user.role === 'Guarantor').length, total: allUsersWithMahall.length, color: 'bg-sky-500' },
                  { role: 'Auditors (Independent)', count: allUsersWithMahall.filter((u) => u.user.role === 'Auditor').length, total: allUsersWithMahall.length, color: 'bg-indigo-500' },
                  { role: 'Contributing Members', count: allUsersWithMahall.filter((u) => u.user.role === 'Member').length, total: allUsersWithMahall.length, color: 'bg-emerald-500' }
                ].map((item) => {
                  const pct = Math.round((item.count / (item.total || 1)) * 100);
                  return (
                    <div key={item.role} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{item.role}</span>
                        <span className="text-muted-foreground">{item.count} people ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zero-Riba Principles & Shariah Audit Guarantee */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground">
                  Zero-Riba Mahallu Federation Standard
                </h3>
                <Crown size={18} className="text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Under the Super Admin protocol, every Mahallu operates with 100% principal-only zero interest and cryptographic audit trails.
              </p>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <CheckCircle2 size={16} />
                  <span>Cross-Mahall Guarantee Network</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Members from one Mahallu can be vouched for by registered Guarantors from neighboring Mahalls with cryptographic ledger recording.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
                  <Sparkles size={16} />
                  <span>Compassionate Debt Relief (Quran 2:280)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Sadaqah Ibra'a allows wealthy brothers from any Mahallu to sponsor installments for struggling borrowers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW MAHALLU */}
      {/* ========================================================================= */}
      {createMahallOpen && (
        <CreateMahallModal
          onClose={() => setCreateMahallOpen(false)}
          onSuccess={() => {
            setCreateMahallOpen(false);
            queryClient.invalidateQueries({ queryKey: ['allCircles'] });
            queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
            queryClient.invalidateQueries({ queryKey: ['allUsersWithMahallu'] });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / ASSIGN MEMBER UNDER MAHALLU */}
      {/* ========================================================================= */}
      {addMemberOpen && (
        <AddMemberToMahallModal
          circles={allCircles}
          initialCircleId={selectedMahallFilter !== 'all' ? selectedMahallFilter : undefined}
          onClose={() => setAddMemberOpen(false)}
          onSuccess={() => {
            setAddMemberOpen(false);
            queryClient.invalidateQueries({ queryKey: ['allUsersWithMahallu'] });
            queryClient.invalidateQueries({ queryKey: ['allCircles'] });
            queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT MAHALLU */}
      {/* ========================================================================= */}
      {editMahallOpen && editingMahall && (
        <EditMahallModal
          circle={editingMahall}
          onClose={() => {
            setEditMahallOpen(false);
            setEditingMahall(null);
          }}
          onSuccess={() => {
            setEditMahallOpen(false);
            setEditingMahall(null);
            queryClient.invalidateQueries({ queryKey: ['allCircles'] });
            queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REASSIGN ROLE / MAHALL */}
      {/* ========================================================================= */}
      {reassignRoleOpen && targetUser && (
        <ReassignRoleModal
          item={targetUser}
          circles={allCircles}
          onClose={() => {
            setReassignRoleOpen(false);
            setTargetUser(null);
          }}
          onSuccess={() => {
            setReassignRoleOpen(false);
            setTargetUser(null);
            queryClient.invalidateQueries({ queryKey: ['allUsersWithMahallu'] });
            queryClient.invalidateQueries({ queryKey: ['allCircles'] });
            queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

function CreateMahallModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [mosque, setMosque] = useState('');
  const [location, setLocation] = useState('');
  const [balance, setBalance] = useState('100000');
  const [minContribution, setMinContribution] = useState('1000');
  const [maxLoan, setMaxLoan] = useState('50000');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('123456');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mosque.trim() || !location.trim()) {
      toast.error('Please provide Mahallu name, Mosque, and Location.');
      return;
    }
    if (!adminName.trim() || !adminEmail.trim()) {
      toast.error('Committee Admin name and email are mandatory for every new Mahallu.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await circleService.createMahall({
        name: name.trim(),
        mosque: mosque.trim(),
        location: location.trim(),
        balance: Number(balance) || 100000,
        minContribution: Number(minContribution) || 1000,
        maxLoan: Number(maxLoan) || 50000,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminMonthlyCommitment: Number(minContribution) || 1000
      });

      toast.success(`Successfully created Mahall: ${created.name}! Assigned ${adminName} as Committee Admin.`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Mahall');
    } finally {
      setSubmitting(false);
    }
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Create New Mahallu Circle</h2>
                  <p className="text-[11px] text-muted-foreground">Add a new mosque & assign its Committee Admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Mahallu Circle Name *</label>
                <Input
                  required
                  placeholder="e.g. Tirur Central Qard Hasan Circle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Juma Masjid / Mosque Name *</label>
                  <Input
                    required
                    placeholder="e.g. Tirur Town Juma Masjid"
                    value={mosque}
                    onChange={(e) => setMosque(e.target.value)}
                    className="mt-1 h-10 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Location (City, District) *</label>
                  <Input
                    required
                    placeholder="e.g. Tirur, Malappuram, Kerala"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Mandatory Committee Admin Assignment */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-primary" />
                    Assign Committee Admin (Mandatory)
                  </span>
                  <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                    Required
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Admin Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. Usman Haji"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="mt-0.5 h-9 rounded-xl text-xs bg-card"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Admin Email *</label>
                    <Input
                      type="email"
                      required
                      placeholder="admin@mahallu.org"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="mt-0.5 h-9 rounded-xl text-xs bg-card"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Admin Password (Login) *</label>
                  <div className="relative mt-0.5">
                    <Input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Password (min 6 chars)"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="h-9 rounded-xl text-xs bg-card pr-8 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Initial Financial Parameters */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider block">
                  Optional Parameters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Initial Capital (₹)</label>
                    <Input
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="mt-1 h-9 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Min Monthly (₹)</label>
                    <Input
                      type="number"
                      value={minContribution}
                      onChange={(e) => setMinContribution(e.target.value)}
                      className="mt-1 h-9 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Max Loan (₹)</label>
                    <Input
                      type="number"
                      value={maxLoan}
                      onChange={(e) => setMaxLoan(e.target.value)}
                      className="mt-1 h-9 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Dynamic Max Months Notice */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0 text-emerald-600" />
                  <span>
                    <strong>Repayment Term (Max Months):</strong> Scaled automatically with active Mahall members (1 month per member, min 12 months).
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl font-bold bg-primary text-primary-foreground"
                >
                  {submitting ? 'Creating Mahall...' : 'Create & Activate Mahall'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;
}

function AddMemberToMahallModal({
  circles,
  initialCircleId,
  onClose,
  onSuccess
}: {
  circles: Circle[];
  initialCircleId?: string | undefined;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [circleId, setCircleId] = useState(initialCircleId || circles[0]?.id || 'mahallu');
  const [role, setRole] = useState<Role>('Member');
  const [monthlyCommitment, setMonthlyCommitment] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter name and email.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await circleService.createUserUnderMahall({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        circleId,
        monthlyCommitment: Number(monthlyCommitment) || 1000
      });

      toast.success(`Assigned ${name} as ${role} (Monthly: ₹${Number(monthlyCommitment).toLocaleString('en-IN')})!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign user');
    } finally {
      setSubmitting(false);
    }
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Assign User to Mahall</h2>
              <p className="text-[11px] text-muted-foreground">Add member, set credentials & monthly commitment</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-foreground">Full Name *</label>
            <Input
              required
              placeholder="e.g. Ibrahim Kutty"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-9 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-foreground">Email Address *</label>
              <Input
                type="email"
                required
                placeholder="name@mahallu.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Account Password *</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 rounded-xl text-xs pr-8 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Phone Number (Optional)</label>
            <Input
              placeholder="+91 98470 XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 h-9 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-foreground">Assigned Mahallu</label>
              <select
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
              >
                {circles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mosque})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Role Under Mahall</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="mt-1 block w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="Member">Member (Saver / Borrower)</option>
                <option value="Guarantor">Guarantor (Kafala / Voucher)</option>
                <option value="Committee Admin">Committee Admin (Mahall Lead)</option>
                <option value="Auditor">Auditor (Independent Reviewer)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Assigned Monthly Commitment (₹)</label>
            <Input
              type="number"
              min={100}
              step={100}
              required
              placeholder="1000"
              value={monthlyCommitment}
              onChange={(e) => setMonthlyCommitment(e.target.value)}
              className="mt-1 h-9 rounded-xl text-xs font-mono font-bold"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Determines their monthly contribution and calculated stake in the Emergency Lending Fund.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-bold">
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
: null;
}

function EditMahallModal({
  circle,
  onClose,
  onSuccess
}: {
  circle: Circle;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(circle.name);
  const [mosque, setMosque] = useState(circle.mosque);
  const [location, setLocation] = useState(circle.location);
  const [balance, setBalance] = useState(String(circle.balance));
  const [maxLoan, setMaxLoan] = useState(String(circle.maxLoan));
  const [minContribution, setMinContribution] = useState(String(circle.minContribution));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await circleService.updateMahall(circle.id, {
        name: name.trim(),
        mosque: mosque.trim(),
        location: location.trim(),
        balance: Number(balance),
        maxLoan: Number(maxLoan),
        minContribution: Number(minContribution)
      });
      toast.success('Updated Mahallu parameters successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update Mahallu');
    } finally {
      setSubmitting(false);
    }
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-base font-bold text-foreground">Edit Mahallu Details</h2>
              <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground">Mahallu Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Mosque Name</label>
                <Input value={mosque} onChange={(e) => setMosque(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Location</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Treasury (₹)</label>
                  <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Max Loan (₹)</label>
                  <Input type="number" value={maxLoan} onChange={(e) => setMaxLoan(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Min Deposit (₹)</label>
                  <Input type="number" value={minContribution} onChange={(e) => setMinContribution(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-bold">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;
}

function ReassignRoleModal({
  item,
  circles,
  onClose,
  onSuccess
}: {
  item: { user: User; circle?: Circle | undefined; membership?: Membership | undefined };
  circles: Circle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(item.user.role);
  const [selectedCircleId, setSelectedCircleId] = useState(item.user.circleId || circles[0]?.id || 'mahallu');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await circleService.reassignUserRoleAndMahall(item.user.id, selectedRole, selectedCircleId);
      toast.success(`Updated ${item.user.name}'s role to ${selectedRole}!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reassign role');
    } finally {
      setSubmitting(false);
    }
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-primary" />
                <h2 className="font-display text-base font-bold text-foreground">Reassign Role & Mahall</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                {item.user.initials}
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">{item.user.name}</p>
                <p className="text-[11px] text-muted-foreground">{item.user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground">Assign Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="mt-1 block w-full rounded-xl border border-input bg-card px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="Committee Admin">Committee Admin (Mahall Leader)</option>
                  <option value="Member">Member (Borrower / Contributor)</option>
                  <option value="Guarantor">Guarantor (Kafala Voucher)</option>
                  <option value="Auditor">Auditor (Financial Oversight)</option>
                  <option value="Super Admin">Super Admin (Federation Level)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Assign / Transfer to Mahallu</label>
                <select
                  value={selectedCircleId}
                  onChange={(e) => setSelectedCircleId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-input bg-card px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.mosque} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-bold">
                  {submitting ? 'Saving...' : 'Update Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;
}
