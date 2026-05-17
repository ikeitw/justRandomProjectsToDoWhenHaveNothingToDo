'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import Eyebrow from '@/components/ui/Eyebrow';
import Hairline from '@/components/ui/Hairline';
import CTA from '@/components/ui/CTA';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'plan' | 'profiles' | 'playback' | 'audio' | 'downloads' | 'devices' | 'notifications' | 'privacy' | 'help';

interface Stats {
  historyCount: number;
  watchlistCount: number;
  progressCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR: { id: Tab; label: string }[] = [
  { id: 'plan',          label: 'Plan & billing' },
  { id: 'profiles',      label: 'Profile' },
  { id: 'playback',      label: 'Playback' },
  { id: 'audio',         label: 'Audio & subtitles' },
  { id: 'downloads',     label: 'Downloads' },
  { id: 'devices',       label: 'Devices' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy',       label: 'Privacy' },
  { id: 'help',          label: 'Help' },
];

const PLANS = [
  {
    id: 'reader',
    tier: 'Reader',
    price: '6',
    tagline: 'An evening here and there.',
    features: ['1 device', '1080p HD', 'Stereo', 'Limited library', 'With sponsors'],
  },
  {
    id: 'cinema',
    tier: 'Cinema',
    price: '14',
    tagline: 'The whole library, in 4K.',
    features: ['2 devices', '4K HDR · Dolby Vision', '5.1 Surround', 'Full library', 'No sponsors'],
  },
  {
    id: 'premiere',
    tier: 'Premiere',
    price: '22',
    tagline: 'Studio access. Early premieres.',
    features: ['4 devices', '4K · Dolby Atmos', 'Lossless audio', "Director's commentary", 'Premieres 7 days early'],
  },
] as const;

// Cosmetic device list — no server-side device tracking exists yet
const DEVICES = [
  { name: 'MacBook Pro',             location: 'Home',  time: 'This device', current: true  },
  { name: 'iPhone · Mobile',         location: 'Home',  time: '12 min ago',  current: false },
  { name: 'iPad · Reading',          location: 'Away',  time: '2 days ago',  current: false },
  { name: 'Smart TV · Guest room',   location: 'Home',  time: '6 days ago',  current: false },
];

const LS_KEY = 'streamix-settings';

function loadToggles() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
  } catch { return null; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [stats, setStats]         = useState<Stats | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  // Toggles persisted to localStorage
  const [toggles, setToggles] = useState({
    autoplay:        true,
    reduceMotion:    false,
    ambientLighting: true,
    cellular:        false,
    smartDownloads:  true,
    newEpisodes:     true,
    editorialPicks:  true,
    marketingEmails: false,
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Hydrate toggles from localStorage after mount
  useEffect(() => {
    const saved = loadToggles();
    if (saved) setToggles((prev) => ({ ...prev, ...saved }));
  }, []);

  // Fetch account stats once
  useEffect(() => {
    if (!user) return;
    fetch('/api/auth/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, [user]);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggle = (key: string) => {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  if (loading || !user) return null;

  const currentPlan = PLANS.find((p) => p.id === user.plan) ?? PLANS[0];

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen pt-24 pb-20 relative" style={{ background: 'var(--oled)', color: 'var(--ivory)' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 text-sm font-medium transition-all"
          style={{
            background: toast.ok ? 'var(--card)' : '#3a1515',
            border: `1px solid ${toast.ok ? 'var(--accent)' : '#7a3535'}`,
            color: toast.ok ? 'var(--ivory)' : '#f87171',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <Eyebrow label={`Account · ${user.name}`} />
            <h1
              className="mt-3"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(28px, 5vw, 72px)',
                lineHeight: 0.95,
                letterSpacing: '-0.025em',
                color: 'var(--ivory)',
              }}
            >
              Settings &amp; subscription
            </h1>
          </div>
          <div className="flex items-center gap-4 pb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em' }}>
            <span className="text-[var(--dim)] uppercase">Member since {memberSince}</span>
            <span className="w-px h-4 bg-[var(--dimmer)]" />
            <span style={{ color: 'var(--accent)' }}>● {currentPlan.tier.toUpperCase()} TIER</span>
          </div>
        </div>

        <Hairline className="mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">

          {/* Sidebar */}
          <aside>
            <nav className="flex flex-col gap-0.5">
              {SIDEBAR.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="flex items-center justify-between px-4 py-3 text-left w-full transition-colors"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--ivory)' : 'var(--dim)',
                      background: active ? 'var(--surface)' : 'transparent',
                      borderLeft: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
                    }}
                  >
                    {item.label}
                    {active && (
                      <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 8 12" fill="none">
                        <path d="M1 1l6 5-6 5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Stats summary */}
            {stats && (
              <div className="mt-6 p-4 border border-[var(--hairline-soft)]" style={{ background: 'var(--graphite)' }}>
                <Eyebrow label="Your activity" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Watched', val: stats.historyCount },
                    { label: 'Saved',   val: stats.watchlistCount },
                    { label: 'In progress', val: stats.progressCount },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ivory)' }}>{s.val}</div>
                      <div className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dim)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className="mt-5 w-full text-left px-4 py-2 text-xs text-[var(--dim)] hover:text-[var(--ivory)] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Sign Out
            </button>
          </aside>

          {/* Main panel */}
          <div className="min-w-0">
            {activeTab === 'plan'          && <PlanTab user={user} refreshUser={refreshUser} showToast={showToast} />}
            {activeTab === 'profiles'      && <ProfileTab user={user} refreshUser={refreshUser} showToast={showToast} logout={logout} />}
            {activeTab === 'playback'      && <PlaybackTab toggles={toggles} toggle={toggle} />}
            {activeTab === 'audio'         && <AudioTab />}
            {activeTab === 'downloads'     && <DownloadsTab toggles={toggles} toggle={toggle} />}
            {activeTab === 'devices'       && <DevicesTab />}
            {activeTab === 'notifications' && <NotificationsTab toggles={toggles} toggle={toggle} />}
            {activeTab === 'privacy'       && <PrivacyTab showToast={showToast} logout={logout} />}
            {activeTab === 'help'          && <HelpTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan tab ─────────────────────────────────────────────────────────────────

function PlanTab({
  user,
  refreshUser,
  showToast,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  refreshUser: () => Promise<void>;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const activePlan = user.plan ?? 'reader';

  const switchPlan = async (planId: string) => {
    if (planId === activePlan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? 'Failed to switch plan', false);
        return;
      }
      await refreshUser();
      showToast(`Switched to ${PLANS.find((p) => p.id === planId)?.tier} plan`);
    } catch {
      showToast('Network error', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <Eyebrow label="01 · Your plan" />
        <h2 className="mt-3 mb-8" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>
          Three ways to watch
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              active={activePlan === plan.id}
              saving={saving}
              onSelect={() => switchPlan(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* Billing — cosmetic; no payment system */}
      <Panel eyebrow="06 · Billing" title="Next payment">
        <div className="py-2 pb-1 text-xs mb-4" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--dim)', textTransform: 'uppercase' }}>
          Payment processing coming soon
        </div>
        <div className="flex flex-wrap items-end gap-8 py-1 pb-4">
          {[
            { label: 'Amount', value: `€${PLANS.find((p) => p.id === activePlan)?.price ?? '—'}.00` },
            { label: 'Method', value: 'VISA · 4421' },
          ].map((r) => (
            <div key={r.label}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--dim)', marginBottom: 6 }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: r.label === 'Amount' ? 40 : 20, color: 'var(--ivory)', lineHeight: 1 }}>{r.value}</div>
            </div>
          ))}
        </div>
        <Hairline className="mt-2 mb-4" />
        <div className="flex items-center gap-3">
          <CTA variant="ghost" size="sm">Update payment</CTA>
          <CTA variant="ghost" size="sm">View invoices</CTA>
        </div>
      </Panel>
    </div>
  );
}

function PlanCard({
  plan,
  active,
  saving,
  onSelect,
}: {
  plan: typeof PLANS[number];
  active: boolean;
  saving: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className="relative p-7 transition-colors"
      style={{
        border: `1px solid ${active ? 'var(--accent)' : 'var(--hairline)'}`,
        background: active ? 'rgba(200,155,90,0.04)' : 'var(--graphite)',
        cursor: active ? 'default' : 'pointer',
        opacity: saving && !active ? 0.6 : 1,
      }}
      onClick={active ? undefined : onSelect}
    >
      {active && (
        <div
          className="absolute -top-px -left-px px-2.5 py-1"
          style={{ background: 'var(--accent)', color: 'var(--oled)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', fontWeight: 700 }}
        >
          YOUR PLAN
        </div>
      )}
      <div style={{ marginTop: active ? 16 : 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: active ? 'var(--accent)' : 'var(--dim)' }}>
          {plan.tier}
        </div>
        <div className="flex items-baseline gap-1 mt-5">
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 52, color: 'var(--ivory)', lineHeight: 1 }}>€{plan.price}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'var(--dim)' }}>/ MO</span>
        </div>
        <div className="mt-3 mb-6" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--text-2)', lineHeight: 1.4 }}>
          {plan.tagline}
        </div>
        <Hairline />
        <div className="flex flex-col gap-3 mt-5">
          {plan.features.map((f) => (
            <div key={f} className="flex items-center gap-2.5" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-2)' }}>
              <span className="flex-shrink-0 h-px w-3" style={{ background: active ? 'var(--accent)' : 'var(--dimmer)' }} />
              {f}
            </div>
          ))}
        </div>
        <div className="mt-6">
          {active
            ? <CTA variant="ghost" size="sm">Current plan</CTA>
            : <CTA variant="outline" size="sm" onClick={onSelect}>Switch to {plan.tier}</CTA>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({
  user,
  refreshUser,
  showToast,
  logout,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  refreshUser: () => Promise<void>;
  showToast: (msg: string, ok?: boolean) => void;
  logout: () => Promise<void>;
}) {
  const [nameVal, setNameVal]       = useState(user.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);

  const [curPw, setCurPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError]   = useState('');

  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const saveName = async () => {
    if (nameVal.trim() === user.name) { setNameEditing(false); return; }
    setNameSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? 'Failed to save', false); return; }
      await refreshUser();
      showToast('Display name updated');
      setNameEditing(false);
    } catch {
      showToast('Network error', false);
    } finally {
      setNameSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const d = await res.json();
      if (!res.ok) { setPwError(d.error ?? 'Failed to update password'); return; }
      setCurPw(''); setNewPw('');
      showToast('Password updated successfully');
    } catch {
      setPwError('Network error');
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/me', { method: 'DELETE' });
      if (!res.ok) { showToast('Failed to delete account', false); return; }
      await logout();
    } catch {
      showToast('Network error', false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow label="02 · Profile" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>
          Your account
        </h2>
      </div>

      {/* Identity */}
      <Panel eyebrow="Identity" title="Display name">
        <div className="py-3 flex items-center gap-4">
          <div
            className="w-14 h-14 flex items-center justify-center flex-shrink-0"
            style={{ background: '#1c1915', border: '1px solid var(--accent)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--ivory)' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {nameEditing ? (
              <div className="flex items-center gap-3">
                <input
                  autoFocus
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameEditing(false); setNameVal(user.name); } }}
                  maxLength={100}
                  className="flex-1 bg-transparent border-b border-[var(--accent)] text-[var(--ivory)] text-sm py-1 outline-none"
                  style={{ fontFamily: 'var(--font-sans)' }}
                />
                <CTA variant="accent" size="sm" onClick={saveName} disabled={nameSaving}>
                  {nameSaving ? 'Saving…' : 'Save'}
                </CTA>
                <button
                  onClick={() => { setNameEditing(false); setNameVal(user.name); }}
                  className="text-xs text-[var(--dim)] hover:text-[var(--ivory)] transition-colors"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ivory)' }}>{user.name}</span>
                <button
                  onClick={() => setNameEditing(true)}
                  className="text-xs text-[var(--dim)] hover:text-[var(--accent)] transition-colors"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  Edit
                </button>
              </div>
            )}
            <div className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--dim)' }}>{user.email}</div>
          </div>
        </div>
        <Hairline className="mt-2 mb-4" />
        <Link href="/profiles">
          <CTA variant="outline" size="sm">Switch profiles</CTA>
        </Link>
      </Panel>

      {/* Password */}
      <Panel eyebrow="Security" title="Change password">
        <form onSubmit={changePassword} className="space-y-0 pt-2">
          <SettingRow label="Current password">
            <input
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
              placeholder="••••••••"
              className="bg-transparent border border-[var(--hairline)] focus:border-[var(--accent)] text-[var(--ivory)] text-xs px-3 py-1.5 w-48 outline-none transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
              autoComplete="current-password"
            />
          </SettingRow>
          <SettingRow label="New password">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              className="bg-transparent border border-[var(--hairline)] focus:border-[var(--accent)] text-[var(--ivory)] text-xs px-3 py-1.5 w-48 outline-none transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
              autoComplete="new-password"
            />
          </SettingRow>
          {pwError && (
            <div className="py-2 text-xs" style={{ color: '#f87171', fontFamily: 'var(--font-sans)' }}>{pwError}</div>
          )}
          <div className="pt-4">
            <CTA variant="accent" size="sm" disabled={pwSaving || !curPw || !newPw}>
              {pwSaving ? 'Updating…' : 'Update password'}
            </CTA>
          </div>
        </form>
      </Panel>

      {/* Danger zone */}
      <Panel eyebrow="Danger zone" title="Delete account">
        <div className="py-3 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-sans)', color: 'var(--dim)' }}>
          Permanently deletes your account, watch history, saved list, and all playback progress. This cannot be undone.
        </div>
        {!delConfirm ? (
          <button
            onClick={() => setDelConfirm(true)}
            className="text-xs transition-colors"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dim)' }}
          >
            Delete my account
          </button>
        ) : (
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="text-xs px-4 py-2 transition-colors"
              style={{ background: '#3a1515', border: '1px solid #7a3535', color: '#f87171', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              {deleting ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button
              onClick={() => setDelConfirm(false)}
              className="text-xs text-[var(--dim)] hover:text-[var(--ivory)] transition-colors"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            >
              Cancel
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── Playback tab ─────────────────────────────────────────────────────────────

function PlaybackTab({ toggles, toggle }: { toggles: Record<string, boolean>; toggle: (k: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="03 · Playback" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Streaming quality</h2>
      </div>
      <Panel eyebrow="Video" title="Picture settings">
        <SettingRowDisplay label="Resolution" value="4K HDR (2160p)" />
        <SettingRowDisplay label="HDR format" value="Dolby Vision" />
        <SettingRowDisplay label="Frame rate" value="Auto (up to 60 fps)" />
        <SettingRowToggle label="Reduce motion" toggled={toggles.reduceMotion} onToggle={() => toggle('reduceMotion')} />
        <SettingRowToggle label="Ambient lighting sync" toggled={toggles.ambientLighting} onToggle={() => toggle('ambientLighting')} />
      </Panel>
      <Panel eyebrow="Auto-play" title="Continue watching">
        <SettingRowToggle label="Auto-play next episode" toggled={toggles.autoplay} onToggle={() => toggle('autoplay')} />
        <SettingRowDisplay label="Post-credits scenes" value="Show" />
        <SettingRowDisplay label="Skip recaps" value="Auto" />
        <SettingRowDisplay label="Skip intros" value="Prompt" />
      </Panel>
      <CosmecticBadge text="Playback preferences are saved on this device only" />
    </div>
  );
}

// ─── Audio tab ────────────────────────────────────────────────────────────────

function AudioTab() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="04 · Audio" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Audio &amp; subtitles</h2>
      </div>
      <Panel eyebrow="Audio" title="Sound settings">
        <SettingRowDisplay label="Default audio" value="English (Dolby Atmos)" />
        <SettingRowDisplay label="Audio quality" value="Lossless · 5.1" />
        <SettingRowDisplay label="Normalize volume" value="On" />
        <SettingRowDisplay label="Night mode" value="Off" />
      </Panel>
      <Panel eyebrow="Subtitles" title="Caption settings">
        <SettingRowDisplay label="Default subtitles" value="Off" />
        <SettingRowDisplay label="Subtitle language" value="English" />
        <SettingRowDisplay label="Font size" value="Medium" />
        <SettingRowDisplay label="Style" value="White · Shadow" />
      </Panel>
      <CosmecticBadge text="Audio preferences are saved on this device only" />
    </div>
  );
}

// ─── Downloads tab ────────────────────────────────────────────────────────────

function DownloadsTab({ toggles, toggle }: { toggles: Record<string, boolean>; toggle: (k: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="05 · Storage" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Data &amp; downloads</h2>
      </div>
      <Panel eyebrow="Downloads" title="Download settings">
        <SettingRowDisplay label="Download quality" value="High · 4K" />
        <SettingRowToggle label="Use cellular data" toggled={toggles.cellular} onToggle={() => toggle('cellular')} />
        <SettingRowToggle label="Smart downloads" toggled={toggles.smartDownloads} onToggle={() => toggle('smartDownloads')} />
        <SettingRowDisplay label="Auto-delete watched" value="After 7 days" />
      </Panel>
      <CosmecticBadge text="Download settings are saved on this device only" />
    </div>
  );
}

// ─── Devices tab ──────────────────────────────────────────────────────────────

function DevicesTab() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="05 · Devices" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Devices signed in</h2>
      </div>
      <CosmecticBadge text="Device tracking is not yet available — this list is illustrative" />
      <Panel eyebrow="Sessions" title="Connected devices">
        {DEVICES.map((d) => (
          <div key={d.name} className="flex items-center gap-4 py-4 border-b border-[var(--hairline-soft)]">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.current ? 'var(--accent)' : 'var(--dimmer)' }} />
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ivory)' }}>{d.name}</div>
              <div className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dim)' }}>{d.location}</div>
            </div>
            <div className="hidden sm:block mr-4" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: d.current ? 'var(--accent)' : 'var(--dim)' }}>{d.time}</div>
            <button
              className="border border-[var(--hairline)] px-3 py-1.5 text-[var(--dim)] hover:text-[var(--ivory)] hover:border-[var(--accent)]/40 transition-colors flex-shrink-0"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              {d.current ? 'Current' : 'Sign out'}
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ─── Notifications tab ────────────────────────────────────────────────────────

function NotificationsTab({ toggles, toggle }: { toggles: Record<string, boolean>; toggle: (k: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="07 · Preferences" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Notifications</h2>
      </div>
      <Panel eyebrow="Push & email" title="Alert preferences">
        <SettingRowToggle label="New episodes" toggled={toggles.newEpisodes} onToggle={() => toggle('newEpisodes')} />
        <SettingRowToggle label="Editorial picks" toggled={toggles.editorialPicks} onToggle={() => toggle('editorialPicks')} />
        <SettingRowDisplay label="Premieres" value="Email only" />
        <SettingRowDisplay label="Recommendations" value="Weekly digest" />
        <SettingRowToggle label="Marketing emails" toggled={toggles.marketingEmails} onToggle={() => toggle('marketingEmails')} />
      </Panel>
      <CosmecticBadge text="Notification delivery infrastructure coming soon — preferences saved locally" />
    </div>
  );
}

// ─── Privacy tab ──────────────────────────────────────────────────────────────

function PrivacyTab({
  showToast,
  logout,
}: {
  showToast: (msg: string, ok?: boolean) => void;
  logout: () => Promise<void>;
}) {
  const clearHistory = async () => {
    if (!confirm('Clear your entire watch history? This cannot be undone.')) return;
    try {
      await fetch('/api/history', { method: 'DELETE' });
      showToast('Watch history cleared');
    } catch {
      showToast('Failed to clear history', false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="08 · Privacy" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Privacy &amp; data</h2>
      </div>
      <Panel eyebrow="Your data" title="Manage data">
        <div className="py-3 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-sans)', color: 'var(--dim)' }}>
          Your watch history and saved list are stored securely and never sold to third parties.
        </div>
        <Hairline className="my-2" />
        <div className="flex flex-wrap items-center gap-4 pt-3">
          <button
            onClick={clearHistory}
            className="text-xs border border-[var(--hairline)] px-4 py-2 text-[var(--dim)] hover:text-[var(--ivory)] hover:border-[var(--accent)]/40 transition-colors"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Clear watch history
          </button>
          <button
            onClick={() => { if (confirm('Clear your entire saved list?')) fetch('/api/watchlist', { method: 'DELETE' }).catch(() => {}); }}
            className="text-xs border border-[var(--hairline)] px-4 py-2 text-[var(--dim)] hover:text-[var(--ivory)] hover:border-[var(--accent)]/40 transition-colors"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Clear saved list
          </button>
        </div>
      </Panel>
    </div>
  );
}

// ─── Help tab ─────────────────────────────────────────────────────────────────

function HelpTab() {
  const faqs = [
    { q: 'How do I switch plans?',            a: 'Go to Settings → Plan & billing and click any plan card. Changes take effect immediately.' },
    { q: 'How do I change my display name?',  a: 'Go to Settings → Profile, click "Edit" next to your name, and save.' },
    { q: 'How do I reset my password?',       a: 'Go to Settings → Profile and use the Change Password form.' },
    { q: 'Can I delete my account?',          a: 'Yes. Settings → Profile → Delete account. This is permanent and removes all your data.' },
    { q: 'What is saved to my account?',      a: 'Watch history, saved list, and playback progress are stored server-side. Playback settings are device-local.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow label="09 · Help" />
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 32, color: 'var(--ivory)' }}>Help &amp; support</h2>
      </div>
      <Panel eyebrow="FAQs" title="Common questions">
        <div className="divide-y divide-[var(--hairline-soft)]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary
                className="flex items-center justify-between cursor-pointer list-none"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ivory)', fontWeight: 500 }}
              >
                {faq.q}
                <svg className="w-3 h-3 flex-shrink-0 ml-4 text-[var(--dim)] group-open:rotate-180 transition-transform" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-sans)', color: 'var(--dim)' }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 sm:p-8 border border-[var(--hairline-soft)]" style={{ background: 'var(--graphite)' }}>
      <Eyebrow label={eyebrow} />
      <div className="mt-2 mb-5" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ivory)' }}>{title}</div>
      <Hairline />
      <div>{children}</div>
    </div>
  );
}

function SettingRowDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[var(--hairline-soft)]">
      <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--ivory)', minWidth: 100, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function SettingRowToggle({ label, toggled, onToggle }: { label: string; toggled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[var(--hairline-soft)]">
      <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-2)' }}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="relative w-8 h-4 rounded-full flex-shrink-0 transition-colors"
          style={{ background: toggled ? 'var(--accent)' : 'var(--hairline)' }}
          aria-label={toggled ? 'Disable' : 'Enable'}
        >
          <span
            className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
            style={{ left: toggled ? '18px' : '2px', background: toggled ? 'var(--oled)' : 'var(--dim)' }}
          />
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--ivory)', minWidth: 28, textAlign: 'right' }}>
          {toggled ? 'On' : 'Off'}
        </span>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[var(--hairline-soft)]">
      <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-2)' }}>{label}</span>
      {children}
    </div>
  );
}

function CosmecticBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-[var(--hairline-soft)]" style={{ background: 'var(--graphite)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>ⓘ {text}</span>
    </div>
  );
}
