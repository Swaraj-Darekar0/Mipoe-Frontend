import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const GridSection: React.FC = () => {
  return (
    <section className="w-full grid-border p-6 md:p-10 lg:p-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
        {/* Article 1 */}
        <article className="flex flex-col gap-3 group cursor-pointer">
          <div className="relative w-full aspect-video border-2 border-dark-void dark:border-snow overflow-hidden bg-glucon-grey">
            <img
              alt="Abstract view of campaigns showing hoodie merchandise"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPr9KlRPIDslGWdyl7IgNlugetivA7t84F6iwPO6JAbY_9UU9r1ObwTeurX6_OWcUb8MJatH0Zr3COAs2bvIZT8rAWIwbiiSHaAGxmAq0G-ZVoKdbJB9XFD_AyXo6hVbvCR9wtAGkdyHaua6HzyrE_BZQlUrenmeDtqm7XBp7xcIdKZpdZvbcvJZlsuz31g6zOb4euwAByo3fmrzTY3oHWQ92jXvA2vqRqCUOCCq2R42HR0GOxTVwm-Qr7WNp3YefzGsj9HDxSOUmB"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 backdrop-blur-sm">
              <span className="bg-dark-void text-primary px-3 py-1 font-mono text-xs uppercase">
                View Case
              </span>
            </div>
          </div>
          <div className="flex justify-between items-end border-t border-dusty-grey pt-2">
            <h3 className="font-mono text-sm text-dusty-grey uppercase tracking-wider">
              01 // Campaigns
            </h3>
            <ArrowUpRight className="w-4 h-4 text-dusty-grey" />
          </div>
        </article>

        {/* Article 2 */}
        <article className="flex flex-col gap-3 group cursor-pointer">
          <div className="relative w-full aspect-video border-2 border-dark-void dark:border-snow bg-dark-void flex items-center justify-center overflow-hidden">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-orange-400 transform rotate-45 group-hover:rotate-0 transition-transform duration-500 shadow-xl"></div>
            <div className="absolute bottom-2 left-2 font-mono text-[10px] text-dusty-grey opacity-50">
              ECOSYSTEM_CORE
            </div>
          </div>
          <div className="flex justify-between items-end border-t border-dusty-grey pt-2">
            <h3 className="font-mono text-sm text-dusty-grey uppercase tracking-wider">
              02 // The Ecosystem
            </h3>
            <ArrowUpRight className="w-4 h-4 text-dusty-grey" />
          </div>
        </article>

        {/* Article 3 */}
        <article className="flex flex-col gap-3 group cursor-pointer">
          <div className="relative w-full aspect-video border-2 border-dark-void dark:border-snow overflow-hidden bg-glucon-grey">
            <img
              alt="Data visualization showing real reach metrics"
              className="w-full h-full object-cover invert dark:invert-0 hover:scale-105 transition-transform duration-500 opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrMetRYK_NteVpW8SzPc-1Aa3r1cAOHVNvBmHt-jK0ulKUI1cyItqXvSdKKFdXFLVgd2EC-HwqBzPho3koiH9rnBAxm4QjOl7zphE6JoR9mnkCE18op938a90vxD0DVoavSU7_DxoDK1ITvwN5mEAstMW9HYWqZoWZc0zCaKfZ8DEu0NqZCQMeIQ-ReW8yyerMjraQfIvsdt5u3gAgnqj5sU7SkhRJhOJ4BGSCVNFClh1KNrpPoPDuhuypIlgIL61AWzkpCXOi8ImG"
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"></div>
          </div>
          <div className="flex justify-between items-end border-t border-dusty-grey pt-2">
            <h3 className="font-mono text-sm text-dusty-grey uppercase tracking-wider">
              03 // Real Reach
            </h3>
            <ArrowUpRight className="w-4 h-4 text-dusty-grey" />
          </div>
        </article>
      </div>
    </section>
  );
};

export default GridSection;