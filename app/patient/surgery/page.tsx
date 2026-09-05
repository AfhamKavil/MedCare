'use client';

import { useRouter } from 'next/navigation';

export default function PatientSurgery() {
  const router = useRouter();

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Back"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#A8DADC] flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm-1 6v5H7l5 5 5-5h-4V8h-2z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">MedCare</span>
          </div>
          <span className="text-xs bg-[#A8DADC]/20 text-[#A8DADC] px-2 py-0.5 rounded-full font-semibold">Surgery Types</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">
          Sign Out
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 md:px-10 py-10 flex flex-col gap-10">
        {/* ── Page Title ── */}
        <section>
          <p className="text-xs text-[#A8DADC] uppercase tracking-widest font-semibold">Procedures</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">Select Surgery</h1>
          <p className="text-gray-400 text-sm mt-1">Choose a surgery type to view the procedure details.</p>
        </section>

        {/* ── Buttons ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/patient/surgery/lassik')}
            className="group bg-[#A8DADC] h-[250px] rounded-[2rem] p-8 flex flex-col justify-between shadow-lg transition-transform hover:scale-105 cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/20 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gray-900/15 flex items-center justify-center mb-4">
                <span className="text-2xl">👁️</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Lassik Surgery</h3>
              <div className="mt-5 inline-flex items-center gap-2 font-bold text-sm text-gray-900 group-hover:translate-x-1 transition-transform">
                View Details
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/patient/surgery/appendix')}
            className="group bg-[#FAD2E1] h-[250px] rounded-[2rem] p-8 flex flex-col justify-between shadow-lg transition-transform hover:scale-105 cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/20 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gray-900/15 flex items-center justify-center mb-4">
                <span className="text-2xl">⚕️</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Appendix Surgery</h3>
              <div className="mt-5 inline-flex items-center gap-2 font-bold text-sm text-gray-900 group-hover:translate-x-1 transition-transform">
                View Details
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/patient/surgery/add')}
            className="group bg-[#E5D9F2] h-[250px] rounded-[2rem] p-8 flex flex-col justify-between shadow-lg transition-transform hover:scale-105 cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/20 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gray-900/15 flex items-center justify-center mb-4">
                <span className="text-2xl">➕</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Add Custom</h3>
              <div className="mt-5 inline-flex items-center gap-2 font-bold text-sm text-gray-900 group-hover:translate-x-1 transition-transform">
                Upload New
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}
