'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'Patient' | 'Doctor' | 'Nurse' | null;

interface LoginModal {
  isOpen: boolean;
  role: Role;
}

const ROUTE_MAP: Record<string, string> = {
  Patient: '/patient/dashboard',
  Doctor: '/doctor/dashboard',
  Nurse: '/nurse/dashboard',
};

const CARD_ACCENT: Record<string, string> = {
  Patient: 'bg-[#A8DADC]',
  Doctor: 'bg-[#FFCDB2]',
  Nurse: 'bg-[#E5D9F2]',
};

export default function Home() {
  const router = useRouter();
  const [loginModal, setLoginModal] = useState<LoginModal>({ isOpen: false, role: null });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const openModal = (role: Role) => {
    setLoginModal({ isOpen: true, role });
    setUsername('');
    setPassword('');
    setError('');
    setSuccess(false);
  };

  const closeModal = () => {
    setLoginModal({ isOpen: false, role: null });
    setError('');
    setSuccess(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setSuccess(true);
      setError('');
      setTimeout(() => {
        router.push(ROUTE_MAP[loginModal.role!]);
      }, 800);
    } else {
      setError('Invalid credentials. Try username: admin / password: admin');
    }
  };

  return (
    <div className="bg-[#0A0D14] text-white min-h-screen font-sans">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#90E0EF] flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 4a1 1 0 00-1 1v4H7a1 1 0 000 2h4v4a1 1 0 002 0v-4h4a1 1 0 000-2h-4V7a1 1 0 00-1-1z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">MedCare</span>
          </div>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {['Overview', 'Specialties', 'Diagnostics', 'Specialists', 'Patient Portal'].map((item) => (
              <button
                key={item}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button aria-label="Support" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button aria-label="Notifications" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors relative">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#90E0EF]"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#90E0EF] flex items-center justify-center ml-1">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4-1.5 4-4s-1.3-4-4-4-4 1.5-4 4 1.3 4 4 4zm0 2c-3.3 0-6 1.7-6 4v1h12v-1c0-2.3-2.7-4-6-4z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── HERO ── */}
        <section className="relative w-full h-[480px] rounded-[28px] overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjngYqoPq8iv7y_TSKCqeJragd4Kf7JOdruPwNtW_uZ44nN1SlNjV8KqhVEWqE97DKXuMGw470gmzKGSXcLAlRF5C9JiZaTjum2e6I8TrgVQ_TKQs8NPWrvBYb59ujPdE9bpP3wczDO1Mu1mA8KoZ9cA2nNqlHqzP9Dlr_j6ZvzAvZA9GCBTvmYYUCm-X3Fia0cOgB3aioRMt9nep5xKWusJb6_iwpB9g6SjJe5wmcf-bDs5XgGs2Rpw"
            alt="Healthcare professionals"
            className="absolute inset-0 w-full h-full object-cover brightness-75"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14] via-[#0A0D14]/90 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14]/80 via-transparent to-transparent z-10" />

          {/* Hero content */}
          <div className="relative z-20 h-full flex flex-col justify-between p-8 md:p-12">
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 self-start">
              <span className="w-2 h-2 rounded-full bg-[#90E0EF] animate-pulse" />
              <span className="text-xs font-semibold text-[#90E0EF] tracking-wider uppercase">Intelligent Healthcare Connected</span>
            </div>

            {/* Bottom text block */}
            <div className="flex flex-col gap-4 max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Decentralized Clinical Access</span>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                Precision medicine,<br />unified for modern care teams.
              </h1>
              <p className="text-gray-400 text-base max-w-xl">
                Seamlessly harmonizing 24/7 specialist access, continuous patient biometric telemetry, and streamlined electronic health records into one secure ecosystem.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button className="bg-[#90E0EF] text-black font-semibold rounded-full px-6 py-3 hover:bg-[#a8e8f0] transition-colors text-sm flex items-center gap-2">
                  Explore Network
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-white/5">
          {[
            { icon: '🛡️', value: 'HIPAA Tier 4', label: 'Zero-Trust Protocol' },
            { icon: '⚡', value: '< 3.2 min', label: 'Median Tele-Triage' },
            { icon: '🔗', value: '99.98%', label: 'EMR Uptime SLA' },
            { icon: '📋', value: '1.2M+', label: 'Clinical Consults' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── SELECT PORTAL ── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs text-[#90E0EF] uppercase tracking-widest font-semibold mb-1">Federated Identity Access</p>
              <h2 className="text-3xl font-bold">Select Portal</h2>
              <p className="text-gray-400 text-sm mt-1 max-w-md">
                Choose your dedicated access gateway to proceed to your encrypted workspace.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              End-to-end encrypted SSO active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient */}
            <button
              onClick={() => openModal('Patient')}
              className="group bg-[#A8DADC] h-[280px] rounded-3xl p-6 flex flex-col justify-between text-left text-gray-900 cursor-pointer hover:scale-[1.02] transition-transform duration-200 relative overflow-hidden shadow-lg"
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/20 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">Personal Gateway</span>
              </div>
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-widest opacity-60 font-semibold mb-1">Individual Care</p>
                <h3 className="text-2xl font-bold tracking-tight">Patient Portal</h3>
                <p className="text-sm opacity-75 mt-1">Health records, appointments & prescriptions</p>
                <div className="mt-4 flex items-center gap-1 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Enter Portal
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Doctor */}
            <button
              onClick={() => openModal('Doctor')}
              className="group bg-[#FFCDB2] h-[280px] rounded-3xl p-6 flex flex-col justify-between text-left text-gray-900 cursor-pointer hover:scale-[1.02] transition-transform duration-200 relative overflow-hidden shadow-lg"
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/20 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">Physician Suite</span>
              </div>
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-widest opacity-60 font-semibold mb-1">Practitioners</p>
                <h3 className="text-2xl font-bold tracking-tight">Doctor Portal</h3>
                <p className="text-sm opacity-75 mt-1">Clinical toolkit, charts & calculators</p>
                <div className="mt-4 flex items-center gap-1 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Enter Portal
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Nurse */}
            <button
              onClick={() => openModal('Nurse')}
              className="group bg-[#E5D9F2] h-[280px] rounded-3xl p-6 flex flex-col justify-between text-left text-gray-900 cursor-pointer hover:scale-[1.02] transition-transform duration-200 relative overflow-hidden shadow-lg"
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/20 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">Ward Operations</span>
              </div>
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-widest opacity-60 font-semibold mb-1">Triage & Stations</p>
                <h3 className="text-2xl font-bold tracking-tight">Nurse Portal</h3>
                <p className="text-sm opacity-75 mt-1">Ward handovers, vitals & bedside logs</p>
                <div className="mt-4 flex items-center gap-1 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Enter Portal
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ── BOTTOM ROW ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {/* Nurse Line (2 cols) */}
          <div className="md:col-span-2 bg-[#FAD2E1] rounded-[28px] p-8 flex flex-col justify-between relative overflow-hidden text-gray-900 min-h-[220px]">
            <div className="absolute -bottom-8 -right-8 text-black/5">
              <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm-1 6v5H7l5 5 5-5h-4V8h-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#FAD2E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Direct Medical Response</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight leading-snug">
                Need urgent triage assistance<br />or prescription verification?
              </h3>
              <p className="text-sm opacity-75 mt-2 max-w-md">
                Our certified triage nurses and on-call physicians respond in under 4 minutes, ensuring critical continuity without waiting rooms.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button className="h-11 px-6 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center gap-2 hover:bg-black transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Connect to Nurse Line (1-800-MED-CARE)
              </button>
              <button className="h-11 px-5 rounded-xl bg-white/40 hover:bg-white/60 text-gray-900 text-sm font-medium transition-colors">
                Diagnostic FAQ
              </button>
            </div>
          </div>

          {/* Live Telemetry (1 col) */}
          <div className="bg-[#14171F] rounded-[28px] p-6 flex flex-col justify-between border border-white/5 min-h-[220px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#90E0EF] animate-pulse" />
                <span className="text-sm font-semibold">Live System Telemetry</span>
              </div>
              <span className="text-xs text-gray-500">v4.92</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: '❤️', label: 'Vitals Telemetry Nodes', value: '14,209 Online', color: 'text-[#90E0EF]' },
                { icon: '💊', label: 'Auto-Dispense Verifications', value: '100% Synced', color: 'text-gray-300' },
                { icon: '🔒', label: 'Encrypted Vault Status', value: 'Secure (0 Alert)', color: 'text-[#E5D9F2]' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
              <span>Server: US-East-Primary</span>
              <span className="text-[#90E0EF] hover:underline cursor-pointer">View Log →</span>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-bold text-gray-400">MedCare Precision Health Systems</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Clinical Safety</a>
            <a href="#" className="hover:text-white transition-colors">Data Security</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
          <span>© 2026 MedCare Platform. All rights reserved.</span>
        </div>
      </footer>

      {/* ── LOGIN MODAL ── */}
      {loginModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-[#1A1D24] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div
                  className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 ${
                    loginModal.role === 'Patient'
                      ? 'bg-[#A8DADC]/20 text-[#A8DADC]'
                      : loginModal.role === 'Doctor'
                      ? 'bg-[#FFCDB2]/20 text-[#FFCDB2]'
                      : 'bg-[#E5D9F2]/20 text-[#E5D9F2]'
                  }`}
                >
                  {loginModal.role} Portal
                </div>
                <h2 className="text-2xl font-bold">{loginModal.role} Portal Login</h2>
                <p className="text-sm text-gray-400 mt-1">Enter your credentials to access your workspace.</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 ml-4"
                aria-label="Close"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Username or Phone Number
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full h-11 rounded-xl bg-[#101214] border border-white/8 text-white text-sm px-4 placeholder:text-gray-600 focus:outline-none focus:border-[#90E0EF] focus:ring-1 focus:ring-[#90E0EF]/30 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 rounded-xl bg-[#101214] border border-white/8 text-white text-sm px-4 placeholder:text-gray-600 focus:outline-none focus:border-[#90E0EF] focus:ring-1 focus:ring-[#90E0EF]/30 transition-all"
                />
              </div>

              {/* Error / Success */}
              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Login successful! Redirecting to {loginModal.role} dashboard…
                </p>
              )}

              <button
                type="submit"
                disabled={success}
                className="mt-2 h-11 w-full rounded-xl bg-[#90E0EF] text-black font-bold text-sm hover:bg-[#a8e8f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {success ? 'Redirecting…' : `Login to ${loginModal.role} Portal`}
              </button>

              <p className="text-center text-xs text-gray-600 mt-1">
                Hint: use <span className="text-gray-400 font-mono">admin</span> / <span className="text-gray-400 font-mono">admin</span>
              </p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
