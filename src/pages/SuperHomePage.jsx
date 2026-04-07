import React, { useState } from 'react'
import { Search, Bell, Mic, ChevronRight, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'
import Logo from '../components/Logo'
import { getBotList } from '../utils/chatData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const ROLE_META = {
  teacher:   { name: 'Ms. Priya',  sub: 'Class 6-B · GPS Mehsana',   badge: 'Teacher'   },
  principal: { name: 'Mr. Rajesh', sub: 'GPS Mehsana',                badge: 'Principal' },
  deo:       { name: 'Mr. Amit',   sub: 'Ahmedabad District',         badge: 'DEO'       },
  parent:    { name: 'Suresh',     sub: "Ravi Patel's Parent",        badge: 'Parent'    },
}

// Context banners — role-specific priority alerts
const CONTEXT_BANNERS = {
  teacher: {
    variant: 'warn', emoji: '⚠️',
    title: '3 students at risk for Namo Laxmi',
    sub: 'Ravi 74% · Komal 71% · Isha 79% — Class 6-B',
    navTo: 'chat_ews', cta: 'View →',
  },
  principal: {
    variant: 'info', emoji: '📊',
    title: 'School attendance today: 88%',
    sub: 'Lowest: Class 6-B 74% · 34 parent alerts sent',
    canvas: { type: 'dashboard', scope: 'school' }, cta: 'Dashboard →',
  },
  deo: {
    variant: 'danger', emoji: '🔴',
    title: 'War Room Active · Daskroi 72.1%',
    sub: 'Day 1/14 · 142 schools below 70% threshold',
    navTo: 'chat_warroom', cta: 'Open →',
  },
  parent: {
    variant: 'warn', emoji: '⚠️',
    title: "Ravi's attendance: 74% — at risk",
    sub: 'Needs 80% for Namo Laxmi · 4 days remaining in March',
    navTo: 'chat_cschol', cta: 'Details →',
  },
}

// Quick action definitions per role
function getQuickActions(role) {
  switch (role) {
    case 'teacher': return [
      { emoji: '📅', label: 'Mark\nAttendance',  bg: '#FFF8E1', canvas: { type: 'attendance', classId: '6-B' } },
      { emoji: '📊', label: 'Class\nDashboard',  bg: '#EEF2FF', canvas: { type: 'dashboard',  scope: 'class' } },
      { emoji: '📝', label: 'XAMTA\nScan',       bg: '#E8F5E9', nav: 'chat_xamta' },
      { emoji: '🏅', label: 'Namo\nLaxmi',       bg: '#F3E5F5', nav: 'chat_namo_laxmi' },
      { emoji: '⚠️', label: 'At-Risk\nStudents', bg: '#FFEBEE', nav: 'chat_ews' },
      { emoji: '📨', label: 'Parent\nAlert',     bg: '#E3F2FD', nav: 'chat_tmsg' },
      { emoji: '📋', label: 'Generate\nReport',  bg: '#F0F4FF', canvas: { type: 'report',    classId: '6-B' } },
      { emoji: '👤', label: 'Student\nData',     bg: '#E8F5E9', canvas: { type: 'data-entry' } },
    ]
    case 'principal': return [
      { emoji: '📊', label: 'School\nDashboard', bg: '#EEF2FF', canvas: { type: 'dashboard',  scope: 'school' } },
      { emoji: '📅', label: 'Att.\nSummary',     bg: '#FFF8E1', canvas: { type: 'report',     reportType: 'attendance' } },
      { emoji: '📨', label: 'Parent\nOutreach',  bg: '#F3E5F5', nav: 'chat_parentbot' },
      { emoji: '🎯', label: 'War\nRoom',         bg: '#FFEBEE', nav: 'chat_warroom' },
      { emoji: '📋', label: 'Class\nPerf.',      bg: '#E8F5E9', canvas: { type: 'dashboard',  tab: 'classes' } },
      { emoji: '💰', label: 'DBT\nStatus',       bg: '#FFF8E1', nav: 'chat_dbt' },
      { emoji: '📄', label: 'Generate\nPDF',     bg: '#E3F2FD', canvas: { type: 'pdf' } },
      { emoji: '💬', label: 'Swift\nChat',       bg: '#EEF2FF', nav: 'chat_swift' },
    ]
    case 'deo': return [
      { emoji: '📊', label: 'District\nDash.',   bg: '#EEF2FF', canvas: { type: 'dashboard',  scope: 'district' } },
      { emoji: '💰', label: 'DBT\nReport',       bg: '#FFF8E1', nav: 'chat_dbt' },
      { emoji: '🎯', label: 'War\nRoom',         bg: '#FFEBEE', nav: 'chat_warroom' },
      { emoji: '🗺️', label: 'Block\nAnalysis',  bg: '#E8F5E9', canvas: { type: 'dashboard',  tab: 'blocks' } },
      { emoji: '📅', label: 'Att.\nSummary',     bg: '#F3E5F5', nav: 'chat_datt' },
      { emoji: '📋', label: 'District\nReport',  bg: '#F0F4FF', canvas: { type: 'report',     scope: 'district' } },
      { emoji: '🔴', label: 'Critical\nAlerts',  bg: '#FFEBEE', nav: 'chat_warroom' },
      { emoji: '💬', label: 'VSK\nIntelligence', bg: '#EEF2FF', nav: 'chat_swift' },
    ]
    case 'parent': return [
      { emoji: '📅', label: "Ravi's\nAtt.",      bg: '#FFF8E1', nav: 'chat_catt' },
      { emoji: '🏅', label: 'Scholar\nship',     bg: '#F3E5F5', nav: 'chat_cschol' },
      { emoji: '💬', label: 'Message\nTeacher',  bg: '#E3F2FD', nav: 'chat_tmsg' },
      { emoji: '📥', label: 'Download\nReport',  bg: '#E8F5E9', canvas: { type: 'pdf', docType: 'report-card' } },
    ]
    default: return []
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const BANNER_STYLES = {
  warn:   { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', ctaBg: '#FEF3C7', ctaText: '#D97706' },
  danger: { bg: '#FEF2F2', border: '#F87171', text: '#991B1B', ctaBg: '#FEE2E2', ctaText: '#DC2626' },
  info:   { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', ctaBg: '#DBEAFE', ctaText: '#2563EB' },
}

function ContextBanner({ banner, onAction }) {
  const s = BANNER_STYLES[banner.variant] || BANNER_STYLES.info
  return (
    <div
      className="mx-3.5 mb-3.5 px-3 py-2.5 rounded-2xl flex items-center gap-2.5 border"
      style={{ background: s.bg, borderColor: s.border + '60' }}
    >
      <span className="text-[18px] leading-none flex-shrink-0">{banner.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold truncate" style={{ color: s.text }}>{banner.title}</div>
        <div className="text-[11px] text-txt-secondary truncate mt-0.5">{banner.sub}</div>
      </div>
      <button
        onClick={onAction}
        className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors"
        style={{ background: s.ctaBg, color: s.ctaText }}
      >
        {banner.cta}
      </button>
    </div>
  )
}

function QuickActionCard({ item, onPress }) {
  return (
    <button
      onClick={onPress}
      className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border border-bdr-light active:scale-95 transition-all duration-150"
      style={{ background: item.bg || '#F5F7FA' }}
    >
      <span className="text-[22px] leading-none">{item.emoji}</span>
      <span className="text-[10px] font-semibold text-txt-primary text-center leading-tight whitespace-pre-line">
        {item.label}
      </span>
    </button>
  )
}

function RecentChatItem({ bot, onPress }) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 border-b border-bdr-light transition-colors active:bg-surface-secondary text-left"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-[20px] flex-shrink-0"
        style={{ background: bot.bg }}
      >
        {bot.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-[14px] font-bold text-txt-primary truncate pr-2">{bot.name}</span>
          <span className="text-[11px] text-txt-tertiary flex-shrink-0">{bot.time}</span>
        </div>
        <div className="text-[12px] text-txt-secondary truncate">{bot.msg}</div>
      </div>
      {bot.unread > 0 && (
        <div className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center px-1 flex-shrink-0">
          {bot.unread}
        </div>
      )}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SuperHomePage() {
  const { role, navigate, openCanvas, showToast } = useApp()
  const [searchVal, setSearchVal] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const meta = ROLE_META[role] || ROLE_META.teacher
  const banner = CONTEXT_BANNERS[role]
  const quickActions = getQuickActions(role)
  const bots = getBotList(role)

  // Handle banner CTA
  const handleBannerAction = () => {
    if (!banner) return
    if (banner.navTo) navigate(banner.navTo)
    else if (banner.canvas) openCanvas({ ...banner.canvas, role })
  }

  // Handle quick action tap
  const handleQuickAction = item => {
    if (item.nav) navigate(item.nav)
    else if (item.canvas) openCanvas({ ...item.canvas, role })
  }

  // Handle search submit
  const handleSearchSubmit = () => {
    const q = searchVal.trim().toLowerCase()
    if (!q) return
    if (q.includes('attendance') || q.includes('mark')) {
      openCanvas({ type: 'attendance', classId: '6-B', role })
    } else if (q.includes('dashboard') || q.includes('summary') || q.includes('performance')) {
      openCanvas({ type: 'dashboard', scope: role === 'deo' ? 'district' : role === 'principal' ? 'school' : 'class', role })
    } else if (q.includes('pdf') || q.includes('download')) {
      openCanvas({ type: 'pdf', role })
    } else if (q.includes('report')) {
      openCanvas({ type: 'report', role })
    } else if (q.includes('data') || q.includes('form') || q.includes('student')) {
      openCanvas({ type: 'data-entry', role })
    } else {
      navigate('chat_swift')
    }
    setSearchVal('')
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar />

      {/* Top header */}
      <div className="h-14 px-3.5 flex items-center gap-2.5 border-b border-bdr-light bg-white flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Logo size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-txt-primary">SwiftChat</span>
            <span className="text-[9px] font-bold bg-primary-light text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              {meta.badge}
            </span>
          </div>
          <div className="text-[11px] text-txt-secondary truncate">{meta.sub}</div>
        </div>
        <button
          onClick={() => showToast('3 new alerts', 'info')}
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-txt-secondary active:bg-surface-secondary transition-colors flex-shrink-0"
        >
          <Bell size={19} />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-danger border border-white" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* Greeting */}
        <div className="px-3.5 pt-4 pb-3.5">
          <div className="text-[21px] font-bold text-txt-primary leading-tight">
            {getGreeting()}, {meta.name} 👋
          </div>
          <div className="text-[13px] text-txt-secondary mt-1">
            What would you like to do today?
          </div>
        </div>

        {/* Search / command bar */}
        <div className="px-3.5 mb-3.5">
          <div
            className={`flex items-center gap-2.5 h-12 px-3.5 rounded-2xl border transition-all ${
              searchFocused
                ? 'border-primary shadow-[0_0_0_3px_rgba(56,106,246,0.12)] bg-white'
                : 'border-bdr bg-surface-secondary'
            }`}
          >
            <Search size={16} className="text-txt-tertiary flex-shrink-0" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder='Ask anything or start a workflow…'
              className="flex-1 bg-transparent text-[13px] text-txt-primary placeholder-txt-tertiary outline-none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => { setSearchFocused(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
            />
            <button onClick={handleSearchSubmit} className="flex-shrink-0">
              <Mic size={16} className="text-txt-tertiary" />
            </button>
          </div>

          {/* Search suggestions (shown when focused + empty) */}
          {searchFocused && !searchVal && (
            <div className="mt-2 bg-white border border-bdr rounded-2xl shadow-modal overflow-hidden animate-fade-in z-10 relative">
              {[
                { icon: '📅', text: 'Mark attendance for Class 6' },
                { icon: '📊', text: 'Show today\'s attendance summary' },
                { icon: '📋', text: 'Generate report card' },
                { icon: '📄', text: 'Generate and download PDF' },
              ].map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => { setSearchVal(s.text); setTimeout(handleSearchSubmit, 100) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-txt-secondary hover:bg-surface-secondary transition-colors border-b border-bdr-light last:border-0"
                >
                  <span className="text-base">{s.icon}</span>
                  <span className="text-left">{s.text}</span>
                  <ChevronRight size={14} className="ml-auto text-txt-tertiary" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Context banner */}
        {banner && <ContextBanner banner={banner} onAction={handleBannerAction} />}

        {/* Quick Actions */}
        <div className="px-3.5 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[13px] font-bold text-txt-primary">Quick Actions</span>
            </div>
            <button className="text-[12px] text-primary font-semibold">See all</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((item, i) => (
              <QuickActionCard
                key={i}
                item={item}
                onPress={() => handleQuickAction(item)}
              />
            ))}
          </div>
        </div>

        {/* Divider: Recent Conversations */}
        <div className="px-3.5 mb-2 flex items-center justify-between">
          <span className="text-[13px] font-bold text-txt-primary">Recent Conversations</span>
          <span className="text-[11px] text-txt-tertiary">{bots.length} active</span>
        </div>

        {/* Chat list */}
        {bots.map(bot => (
          <RecentChatItem
            key={bot.id}
            bot={bot}
            onPress={() => navigate('chat_' + bot.id)}
          />
        ))}

        {/* Spacer */}
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}
