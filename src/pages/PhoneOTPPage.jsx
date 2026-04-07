import React, { useState, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

const OTP_LEN = 6

export default function PhoneOTPPage() {
  const { navigate, goBack, setRole, showToast } = useApp()
  const [otp, setOtp]     = useState(Array(OTP_LEN).fill(''))
  const inputRefs         = useRef([])

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next  = [...otp]
    next[i] = digit
    setOtp(next)
    if (digit && i < OTP_LEN - 1) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (!text) return
    const next = [...otp]
    text.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    inputRefs.current[Math.min(text.length, OTP_LEN - 1)]?.focus()
  }

  const filled = otp.every(d => d !== '')

  const handleVerify = () => {
    setRole('parent')
    navigate('home', true)
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: '#12122A' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0">
        <button
          onClick={goBack}
          className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span
          className="text-[15px] font-bold"
          style={{ color: '#F0F0FF', fontFamily: 'Montserrat, sans-serif' }}
        >
          Verify OTP
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Phone icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: 'rgba(56,106,246,0.15)' }}
        >
          📲
        </div>

        <div className="text-center">
          <h2
            className="text-[20px] font-bold mb-2"
            style={{ color: '#F0F0FF', fontFamily: 'Montserrat, sans-serif' }}
          >
            Enter 6-digit OTP
          </h2>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Sent to +91 ••••• 69802
          </p>
        </div>

        {/* OTP boxes */}
        <div className="flex gap-3" onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-11 h-13 text-center text-[20px] font-bold rounded-xl outline-none transition-all"
              style={{
                height: 52,
                background: d ? 'rgba(56,106,246,0.2)' : 'rgba(255,255,255,0.08)',
                border: `2px solid ${d ? '#3D5AFE' : 'rgba(255,255,255,0.12)'}`,
                color: '#F0F0FF',
                fontFamily: 'Montserrat, sans-serif',
              }}
            />
          ))}
        </div>

        {/* Resend */}
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Didn't receive?{' '}
          <span
            className="font-bold cursor-pointer"
            style={{ color: '#7B96FF' }}
            onClick={() => showToast('OTP resent ✓', 'ok')}
          >
            Resend OTP
          </span>
        </p>
      </div>

      {/* Verify button */}
      <div className="px-5 pb-8 flex-shrink-0">
        <button
          onClick={handleVerify}
          disabled={!filled}
          className="w-full bg-primary text-white font-bold text-[15px] py-3.5 rounded-pill disabled:opacity-40 disabled:pointer-events-none active:opacity-80 transition-opacity"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Verify &amp; Continue
        </button>
      </div>
    </div>
  )
}
