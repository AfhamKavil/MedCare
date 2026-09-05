'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import eye1 from './images/eye_1.png';
import eye2 from './images/eye_2.png';
import eye3 from './images/eye_3.png';
import eye4 from './images/eye_4.png';
import eye5 from './images/eye_5.png';
import eye6 from './images/eye_6.png';
import eye7 from './images/eye_7.png';
import eye8 from './images/eye_8.png';

const images = [
  eye1.src,
  eye2.src,
  eye3.src,
  eye4.src,
  eye5.src,
  eye6.src,
  eye7.src,
  eye8.src
];

export default function LassikSurgery() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReadMoreOpen, setIsReadMoreOpen] = useState(false);

  const goNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="bg-[#121212] h-screen overflow-hidden text-white font-sans flex flex-col">
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
            <div className="w-7 h-7 rounded-lg bg-[#A8DADC] flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm-1 6v5H7l5 5 5-5h-4V8h-2z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">MedCare</span>
          </div>
          <span className="text-xs bg-[#A8DADC]/20 text-[#A8DADC] px-2 py-0.5 rounded-full font-semibold">Lassik Surgery</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">
          Sign Out
        </button>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 md:px-10 py-6 flex flex-col md:flex-row gap-8 flex-1 min-h-0">

        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="w-full md:w-40 shrink-0 flex flex-col gap-4 h-full animate-fadeIn">
            <h2 className="text-base font-bold shrink-0">Procedure Steps</h2>
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-4 md:pb-0 hide-scrollbar flex-1 min-h-0">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-24 h-16 md:w-full md:h-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${currentIndex === idx ? 'border-[#A8DADC] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <section className="flex-1 flex flex-col gap-4 overflow-y-auto hide-scrollbar pb-6">
          <div className="flex items-center gap-3 shrink-0">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-2 bg-[#1A1D24] rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
               aria-label="Toggle Sidebar"
             >
               <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>
             {!isSidebarOpen && <span className="text-sm text-gray-400 font-semibold">Show Sidebar</span>}
          </div>

          <div className="bg-[#1A1D24] rounded-[2rem] p-4 border border-white/5 shadow-xl flex items-center justify-center relative w-full aspect-video md:aspect-auto md:h-[75vh] shrink-0">
            <img
              src={images[currentIndex]}
              alt={`Step ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between shrink-0 mt-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all ${currentIndex === 0
                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/15'
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={() => setIsReadMoreOpen(true)}
              className="text-[#A8DADC] hover:text-white transition-colors text-base font-semibold underline underline-offset-4"
            >
              Read More
            </button>

            <button
              onClick={goNext}
              disabled={currentIndex === images.length - 1}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all ${currentIndex === images.length - 1
                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                : 'bg-[#A8DADC] text-gray-900 hover:bg-[#b8e4e6]'
                }`}
            >
              Next
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

      </main>

      {/* Read More Modal */}
      {isReadMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1A1D24] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setIsReadMoreOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-4">
              {/* Malayalam Column */}
              <div className="flex flex-col gap-4 text-gray-300">
                <h2 className="text-2xl font-bold text-[#A8DADC] mb-2">LASIK യാത്ര — രോഗികൾക്കുള്ള ലളിതമായ ഗൈഡ്</h2>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="text-white font-semibold mb-1">1. LASIK എന്താണ്?</h3>
                    <p>LASIK എന്നത് കാഴ്ച മെച്ചപ്പെടുത്തുന്നതിനായി കണ്ണിലെ cornea (കോർണിയ)-യുടെ ആകൃതി ലേസർ ഉപയോഗിച്ച് മാറ്റുന്ന ഒരു refractive eye procedure ആണ്. LASIK ചെയ്യുന്നതിന് മുമ്പ്, ഇത് നിങ്ങൾക്ക് അനുയോജ്യമാണോ എന്ന് നേത്രരോഗ വിദഗ്ധൻ പരിശോധിക്കും.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-1">2. ആദ്യം കണ്ണ് പരിശോധിക്കും</h3>
                    <p>LASIK-ന് മുമ്പ് ഡോക്ടർ കണ്ണിന്റെ ആരോഗ്യവും കാഴ്ചയും വിശദമായി പരിശോധിക്കും. കണ്ണിന്റെ വിവിധ അളവുകളും കോർണിയയുടെ അവസ്ഥയും വിലയിരുത്തുന്നത് ചികിത്സ നിങ്ങൾക്ക് അനുയോജ്യമാണോ എന്ന് തീരുമാനിക്കാൻ സഹായിക്കും.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">3. കണ്ണ് മരവിപ്പിക്കും</h3>
                    <p>നടപടിക്ക് മുമ്പ് കണ്ണിൽ numbing eye drops നൽകും. ഇത് കണ്ണിന്റെ അനുഭൂതി താൽക്കാലികമായി കുറയ്ക്കാൻ സഹായിക്കുന്നു, അതിനാൽ നടപടിക്കിടെ അസ്വസ്ഥത കുറവായിരിക്കും.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">4. കോർണിയയുടെ മുകളിൽ ചെറിയ flap ഉണ്ടാക്കും</h3>
                    <p>LASIK നടപടിയുടെ ഭാഗമായി കോർണിയയുടെ മുകളിൽ വളരെ നേർത്ത ഒരു flap ഉണ്ടാക്കുന്നു. ഈ flap ശ്രദ്ധാപൂർവ്വം മാറ്റിവെച്ചാണ് താഴെയുള്ള കോർണിയയിൽ ലേസർ ചികിത്സ നടത്തുന്നത്.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">5. ലേസർ കോർണിയയുടെ ആകൃതി മാറ്റും</h3>
                    <p>ലേസർ ഉപയോഗിച്ച് കോർണിയയുടെ ആകൃതി കൃത്യമായി മാറ്റുന്നു. ഇതിലൂടെ കണ്ണിലേക്ക് പ്രവേശിക്കുന്ന പ്രകാശം retina-യിൽ കൂടുതൽ ശരിയായ രീതിയിൽ focus ചെയ്യാൻ സഹായിക്കുന്നു.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">6. Flap വീണ്ടും ശരിയായ സ്ഥാനത്ത് വയ്ക്കും</h3>
                    <p>ലേസർ ചികിത്സ കഴിഞ്ഞ ശേഷം, കോർണിയയിലെ നേർത്ത flap അതിന്റെ സ്വാഭാവിക സ്ഥാനത്തേക്ക് തിരിച്ചുവയ്ക്കുന്നു. സാധാരണയായി കണ്ണ് സ്വാഭാവികമായി സുഖപ്പെടുന്ന പ്രക്രിയ ആരംഭിക്കും.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">7. ഇനി കണ്ണിന് വിശ്രമം</h3>
                    <p>നടപടിക്ക് ശേഷം ഡോക്ടർ നൽകുന്ന നിർദ്ദേശങ്ങൾ കൃത്യമായി പാലിക്കണം. നിർദ്ദേശിച്ച eye drops ഉപയോഗിക്കുക, കണ്ണിന് ആവശ്യമായ വിശ്രമം നൽകുക, കൂടാതെ നിർദ്ദേശിച്ച follow-up പരിശോധനകളിൽ പങ്കെടുക്കുക.</p>
                    <p className="mt-2 text-[#FAD2E1]">കാഴ്ച ഉടൻ തന്നെ എല്ലാവർക്കും പൂർണ്ണമായി സ്ഥിരപ്പെടണമെന്നില്ല; recovery വ്യക്തിയിൽ നിന്ന് വ്യക്തിയിലേക്ക് വ്യത്യാസപ്പെടാം.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">8. LASIK യാത്ര പൂർത്തിയായി!</h3>
                    <p>LASIK-ന് ശേഷം കാഴ്ച മെച്ചപ്പെടാൻ തുടങ്ങാം, എന്നാൽ ഫലം ഓരോ വ്യക്തിയിലും വ്യത്യസ്തമായിരിക്കും. ഡോക്ടറുടെ നിർദ്ദേശങ്ങൾ പാലിക്കുകയും ആവശ്യമായ follow-up തുടരുകയും ചെയ്യുന്നത് recovery-യുടെ പ്രധാന ഭാഗമാണ്.</p>
                  </div>

                  <div className="bg-[#A8DADC]/10 p-4 rounded-xl border border-[#A8DADC]/20 mt-6">
                    <p className="font-semibold text-[#A8DADC]">ഓർമ്മിക്കുക:</p>
                    <p className="text-xs mt-1">LASIK എല്ലാവർക്കും അനുയോജ്യമാകണമെന്നില്ല. നിങ്ങളുടെ കണ്ണിന്റെ ആരോഗ്യവും കാഴ്ചയുടെ അവസ്ഥയും പരിശോധിച്ച ശേഷം നേത്രരോഗ വിദഗ്ധനാണ് ഇത് നിങ്ങൾക്ക് അനുയോജ്യമാണോ എന്ന് തീരുമാനിക്കുന്നത്.</p>
                  </div>
                </div>
              </div>

              {/* English Column */}
              <div className="flex flex-col gap-4 text-gray-300">
                <h2 className="text-2xl font-bold text-[#A8DADC] mb-2">LASIK Journey — A Simple Guide</h2>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="text-white font-semibold mb-1">1. What is LASIK?</h3>
                    <p>LASIK is a refractive eye procedure that uses a laser to reshape the cornea, the clear front surface of the eye, to help improve vision. Before undergoing LASIK, an ophthalmologist will assess whether the procedure is suitable for you.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">2. First, your eyes will be examined</h3>
                    <p>Before LASIK, the doctor carefully evaluates your vision and overall eye health. Measurements of the eye and assessment of the cornea help determine whether LASIK is appropriate for you.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">3. Numbing eye drops will be used</h3>
                    <p>Before the procedure, numbing eye drops are placed in the eye. These temporarily reduce sensation and help minimize discomfort during the procedure.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">4. A thin corneal flap is created</h3>
                    <p>During LASIK, a very thin flap is created on the cornea. The flap is carefully lifted so that the underlying corneal tissue can be treated with the laser.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">5. The laser reshapes the cornea</h3>
                    <p>A precisely controlled laser reshapes the cornea. This helps incoming light focus more appropriately on the retina, which can improve the way you see.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">6. The flap is returned to its original position</h3>
                    <p>After the laser treatment, the thin corneal flap is carefully repositioned. The eye then begins its natural healing process.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">7. Give your eyes time to recover</h3>
                    <p>After the procedure, follow your doctor’s instructions carefully. Use prescribed eye drops, give your eyes appropriate rest, and attend the recommended follow-up appointments.</p>
                    <p className="mt-2 text-[#FAD2E1]">Vision does not necessarily become completely stable immediately for everyone. Recovery can vary from person to person.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">8. The LASIK journey is complete!</h3>
                    <p>After LASIK, vision may improve, but results vary between individuals. Following your doctor’s instructions and continuing the recommended follow-up care are important parts of recovery.</p>
                  </div>

                  <div className="bg-[#A8DADC]/10 p-4 rounded-xl border border-[#A8DADC]/20 mt-6">
                    <p className="font-semibold text-[#A8DADC]">Remember:</p>
                    <p className="text-xs mt-1">LASIK is not suitable for everyone. An ophthalmologist should examine your eyes and determine whether the procedure is appropriate for you based on your individual eye health and vision.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
