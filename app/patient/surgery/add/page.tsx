'use client';

import { useRouter } from 'next/navigation';

export default function AddSurgeryContent() {
  const router = useRouter();

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patient/surgery')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Back"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E5D9F2] flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm-1 6v5H7l5 5 5-5h-4V8h-2z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">MedCare</span>
          </div>
          <span className="text-xs bg-[#E5D9F2]/20 text-[#E5D9F2] px-2 py-0.5 rounded-full font-semibold">Add Content</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">
          Sign Out
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 md:px-10 py-10 flex flex-col gap-10">
        <section>
          <p className="text-xs text-[#E5D9F2] uppercase tracking-widest font-semibold">Custom Upload</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">Add Surgery Details</h1>
          <p className="text-gray-400 text-sm mt-1">Upload images or add text content for a new surgery procedure.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Upload Images Option */}
          <div className="bg-[#1A1D24] rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#A8DADC]/10 flex items-center justify-center text-2xl">
                🖼️
              </div>
              <h2 className="text-xl font-bold text-white">Upload Images</h2>
            </div>
            <p className="text-gray-400 text-sm">Select multiple images to create a step-by-step visual guide for the procedure.</p>
            
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors p-8 cursor-pointer min-h-[200px]">
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-semibold text-gray-300">Click to browse files</span>
              <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF up to 5MB</span>
              <input type="file" multiple className="hidden" />
            </label>

            <button className="w-full py-3 bg-[#A8DADC] text-gray-900 font-bold rounded-xl hover:bg-[#b8e4e6] transition-colors">
              Upload Images
            </button>
          </div>

          {/* Upload Text Option */}
          <div className="bg-[#1A1D24] rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAD2E1]/10 flex items-center justify-center text-2xl">
                📝
              </div>
              <h2 className="text-xl font-bold text-white">Upload Text Guide</h2>
            </div>
            <p className="text-gray-400 text-sm">Write or paste the detailed procedure steps, guidelines, or recovery instructions.</p>
            
            <textarea 
              className="flex-1 w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FAD2E1]/50 resize-none min-h-[200px]"
              placeholder="Enter procedure details here..."
            />

            <button className="w-full py-3 bg-[#FAD2E1] text-gray-900 font-bold rounded-xl hover:bg-[#ffdfec] transition-colors">
              Save Text Content
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}
