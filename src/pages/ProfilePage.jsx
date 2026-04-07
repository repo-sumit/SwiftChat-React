import React from 'react'
import { School, BookOpen, BadgeCheck, Phone, Globe, Bell, Lock, HelpCircle, ChevronRight, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'

const ITEMS = [
  { Icon: School,      label: 'School',         value: 'GPS Mehsana, Gujarat' },
  { Icon: BookOpen,    label: 'Class',          value: 'Class 6-B (38 students)' },
  { Icon: BadgeCheck,  label: 'Employee ID',    value: 'priya.mehsana.2847' },
  { Icon: Phone,       label: 'Phone',          value: '+91 98765 43210' },
  { Icon: Globe,       label: 'Language',       value: 'English' },
  { Icon: Bell,        label: 'Notifications',  value: 'Enabled' },
  { Icon: Lock,        label: 'Privacy',        value: '' },
  { Icon: HelpCircle,  label: 'Help & Support', value: '' },
]

const PROFILES = {
  teacher:   { name: 'Priya Mehta',  role: 'Teacher · GPS Mehsana',   initials: 'PM' },
  principal: { name: 'Ramesh Shah',  role: 'Principal · GPS Mehsana', initials: 'RS' },
  deo:       { name: 'Anita Joshi',  role: 'DEO · Ahmedabad',         initials: 'AJ' },
  parent:    { name: 'Suresh Patel', role: 'Parent · Ravi Patel',     initials: 'SP' },
}

export default function ProfilePage() {
  const { role, signOut, showToast } = useApp()
  const user = PROFILES[role] || { name: 'User', role: 'Guest', initials: 'U' }

  return (
    <div className="flex flex-col h-full bg-surface-secondary">
      <StatusBar />
      <div className="bg-primary px-3.5 pt-5 pb-5 flex flex-col items-center text-center flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-white/20 border-[3px] border-white/40 flex items-center justify-center mb-2">
          <span className="text-white font-bold text-[20px]">{user.initials}</span>
        </div>
        <div className="text-[18px] font-bold text-white">{user.name}</div>
        <div className="text-[11.5px] text-white/80 mt-0.5">{user.role}</div>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 mt-2.5 text-[10px] font-bold text-white">
          <ShieldCheck size={12} /> SSO Verified · Gujarat
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white mt-0">
          {ITEMS.map((item, i) => {
            const { Icon } = item
            return (
            <div
              key={i}
              onClick={() => showToast(`${item.label} settings`, 'info')}
              className="flex items-center gap-2.5 px-3.5 py-3 bg-white border-b border-bdr-light cursor-pointer transition-colors active:bg-surface-secondary"
            >
              <Icon size={17} className="text-txt-secondary flex-shrink-0" />
              <span className="text-[13px] font-medium flex-1 text-txt-primary">{item.label}</span>
              {item.value && <span className="text-[11px] text-txt-secondary">{item.value}</span>}
              <ChevronRight size={15} className="text-txt-tertiary flex-shrink-0" />
            </div>
          )})}
        </div>

        <div className="p-4">
          <button
            onClick={signOut}
            className="w-full bg-danger-light text-danger font-bold text-sm py-3.5 rounded-xl active:opacity-80 transition-opacity"
          >
            Sign Out
          </button>
          <p className="text-center text-[10px] text-txt-tertiary mt-3">
            SwiftChat v3.0 · Gujarat VSK Program · 🔒 OIDC/SAML
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
