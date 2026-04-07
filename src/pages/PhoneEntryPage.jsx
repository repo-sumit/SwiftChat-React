import React, { useState } from 'react'
import { ArrowLeft, Delete } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Shield3D from '../assets/icons/Shield3D'
import EllipseLarge from '../assets/icons/EllipseLarge'

// ── Numeric keypad (shown on mobile, hidden on md+) ────────────────────────
const KEYS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  [',','0','.'],
]

function NumPad({ onKey, onDelete }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 pb-3 md:hidden">
      {KEYS.flat().map(k => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className="h-12 rounded-2xl text-[18px] font-medium text-txt-primary active:bg-bdr transition-colors"
          style={{ background: k === ',' || k === '.' ? '#E8EDF5' : '#F4F6FA' }}
        >
          {k}
        </button>
      ))}
      {/* Delete key */}
      <button
        onClick={onDelete}
        className="h-12 rounded-2xl flex items-center justify-center active:bg-bdr transition-colors col-start-3"
        style={{ background: '#E8EDF5' }}
      >
        <Delete size={18} className="text-txt-secondary" />
      </button>
    </div>
  )
}

export default function PhoneEntryPage() {
  const { navigate, goBack } = useApp()
  const [phone, setPhone] = useState('')

  const handleKey = (k) => {
    if (k === ',' || k === '.') return
    setPhone(p => (p + k).slice(0, 10))
  }
  const handleDelete = () => setPhone(p => p.slice(0, -1))

  const handleNativeChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
  }

  const canProceed = phone.length === 10

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Hero illustration (same style as LoginPage slide 2 = shield) ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{ height: 220, background: '#F4F6FA' }}
      >
        <div className="absolute" style={{ width: 200, height: 200, left: '50%', top: '50%', transform: 'translate(-50%,-54%)', opacity: 0.15 }}>
          <EllipseLarge size={200} />
        </div>
        <div className="absolute top-5 right-5 text-right">
          <p className="text-[12px] font-medium text-txt-secondary">Trusted by</p>
          <p className="text-[13px] font-bold text-txt-secondary">10+ State Education<br />Boards</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield3D width={110} height={132} />
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="rounded-full" style={{ width: i===1?20:8, height:8, background: i===1?'#386AF6':'#C5CBDC' }} />
          ))}
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 pt-6 pb-4">
          <h2
            className="text-[18px] font-bold text-txt-primary mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Enter your mobile number
          </h2>

          {/* Phone input row */}
          <div
            className="flex items-center mt-4 rounded-xl border-[1.5px] overflow-hidden transition-colors"
            style={{ borderColor: phone.length > 0 ? '#386AF6' : '#E8EDF5' }}
          >
            {/* Country code */}
            <div className="flex items-center gap-1.5 px-3 py-3 border-r border-bdr bg-white flex-shrink-0">
              <span className="text-[16px]">🇮🇳</span>
              <span className="text-[13px] font-bold text-txt-primary">+91</span>
              <span className="text-[10px] text-txt-tertiary">▾</span>
            </div>
            {/* Native input (visible on desktop, also receives numpad taps) */}
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={handleNativeChange}
              placeholder="80897 69802"
              className="flex-1 px-3 py-3 text-[15px] font-semibold text-txt-primary bg-white outline-none"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>

          <p className="text-[11px] text-txt-secondary mt-2">
            By continuing, I agree to SwiftChat's{' '}
            <span className="text-primary cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-primary cursor-pointer">User Privacy Policy</span>
          </p>

          {/* Send OTP button */}
          <button
            onClick={() => navigate('phone_otp')}
            disabled={!canProceed}
            className="w-full mt-4 bg-primary text-white font-bold text-[15px] py-3.5 rounded-pill disabled:opacity-40 disabled:pointer-events-none active:opacity-80 transition-opacity"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Send OTP
          </button>
        </div>

        {/* Numeric keypad — mobile only */}
        <div className="flex-1 flex flex-col justify-end">
          <NumPad onKey={handleKey} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  )
}
