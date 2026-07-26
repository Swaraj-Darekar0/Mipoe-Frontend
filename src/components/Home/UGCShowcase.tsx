import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Volume2, Flame, Heart, Eye, ArrowUpRight, Sparkles } from 'lucide-react';

export interface UGCClip {
  id: string;
  creatorName: string;
  creatorHandle: string;
  views: string;
  likes: string;
  title: string;
  tag: string;
  imageUrl: string;
  storeUsername: string;
  audioTrack?: string;
}

const DEFAULT_CLIPS: UGCClip[] = [
  {
    id: 'clip-1',
    creatorName: 'Ria Sharma',
    creatorHandle: '@RiaUnfiltered',
    views: '248.5K',
    likes: '34.2K',
    title: 'clock it - Beauty & different perfume ✨',
    tag: 'Beauty & Fragrance',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtWD9rHRb5-p37mcBab97RmHl6BEv2temcCLh98YYZq9qNsyIHsL0kqlg&s=10',
    storeUsername: 'riaunfiltered',
    audioTrack: 'Original Audio - @aarav.fits'
  },
  {
    id: 'clip-2',
    creatorName: 'Ashok Kumar',
    creatorHandle: '@riya_unfiltered',
    views: '512.0K',
    likes: '89.1K',
    title: 'Monochrome aesthetics review',
    tag: 'Gen-Z Fashion',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa0YO8bAujXXIatFG0psIns6JxrnVU2-mlvqZYAJ9n-Q&s=10',
    storeUsername: 'riyaunfiltered',
    audioTrack: 'Viral Sound - Synth Swell'
  },
  {
    id: 'clip-3',
    creatorName: 'Karan Patel',
    creatorHandle: '@karan_vibe',
    views: '184.2K',
    likes: '22.8K',
    title: 'Nico sure x Mipoe ',
    tag: 'Tech & Lifestyle',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjOkn7mZideRyVVUawYaEaqmLnqFhBtyYBLL2tTrm1bw&s=10',
    storeUsername: 'karanvibe',
    audioTrack: 'Ambient Beats #4'
  },
  {
    id: 'clip-4',
    creatorName: 'Ananya Roy',
    creatorHandle: '@ananya_glow',
    views: '390.4K',
    likes: '61.5K',
    title: 'Pay on reach campaign highlight',
    tag: 'Beauty & Skincare',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc2G8iZHTiGSzCj7yU46F6YaPJzCeXIOx_1XM_F4RDTw&s=10',
    storeUsername: 'ananyaglow',
    audioTrack: 'Original Sound - Ananya'
  },
  {
    id: 'clip-5',
    creatorName: 'Meera Kapoor',
    creatorHandle: '@meera_edits',
    views: '427.8K',
    likes: '72.4K',
    title: 'Desk setup that makes edits feel faster',
    tag: 'Creator Gear',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIREDGMPj24GIVlUR8m4W_8PdlBnLNpVpdS3Po-gocRA&s=10',
    storeUsername: 'meeraedits',
    audioTrack: 'Lo-fi Cut - Meera'
  },
  {
    id: 'clip-6',
    creatorName: 'Devansh Rao',
    creatorHandle: '@devanshdesk',
    views: '301.9K',
    likes: '48.6K',
    title: 'Budget tech I use for every shoot',
    tag: 'Tech Finds',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT480dOKYn2bDFC3UAjhxUEA7fz9brk_RE-SHvPlBjYeQ&s=10',
    storeUsername: 'devanshdesk',
    audioTrack: 'Creator Desk Mix'
  },
  {
    id: 'clip-7',
    creatorName: 'Isha Menon',
    creatorHandle: '@isha_glowfile',
    views: '276.3K',
    likes: '39.7K',
    title: 'No-filter skincare prep before filming',
    tag: 'Skincare Routine',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMjyaGQp-BpXvA_oExMBb57e0pqqLyg2HRIiYqmPGSHg&s=10',
    storeUsername: 'ishaglowfile',
    audioTrack: 'Soft Pop Loop'
  },
  {
    id: 'clip-8',
    creatorName: 'Zoya Khan',
    creatorHandle: '@zoya_fits',
    views: '638.2K',
    likes: '104.8K',
    title: 'Three fits, one tiny creator bag',
    tag: 'Fashion Finds',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKVeT38KlCmGbltySDiAx5AZ5OK3jsF0p8xnFvYwki8w&s',
    storeUsername: 'zoyafits',
    audioTrack: 'Runway Snap'
  },
  {
    id: 'clip-9',
    creatorName: 'Nikhil Verma',
    creatorHandle: '@nikhil_nomad',
    views: '219.6K',
    likes: '27.9K',
    title: 'Travel kit that survives long shoot days',
    tag: 'Travel Essentials',
    imageUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa-FpM--txkczbZ5h6SzBjIr6S0rw0MRmIx6NeM0Sswg&s=10',
    storeUsername: 'nikhilnomad',
    audioTrack: 'Street Reel Audio'
  }
];

interface UGCShowcaseProps {
  clips?: UGCClip[];
}

const UGCShowcase: React.FC<UGCShowcaseProps> = ({ clips = DEFAULT_CLIPS }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.4, 1]);

  return (
    <section 
      ref={containerRef}
      className="w-full bg-white text-slate-950 py-16 md:py-24 lg:py-28 grid-border relative overflow-hidden selection:bg-primary selection:text-white"
    >
      {/* Background Soft Orange Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] md:w-[560px] md:h-[560px] bg-[#FF5C00]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-[280px] h-[280px] md:w-[380px] md:h-[380px] bg-[#FF5C00]/5 rounded-full blur-[90px] pointer-events-none z-0"></div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 relative z-10">
        
        {/* Header Section: Typography Pairing (Helvetica + Parisienne Cursive) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="font-mono text-xs text-dusty-grey uppercase tracking-widest">
                UGC Clips Marketplace // S3 Live Feed
              </span>
            </div>
            
            <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tighter uppercase leading-[0.9]">
              REAL IMPACT, <br />
              REAL RESULTS
            </h2>
          </div>

          <p className="font-mono text-xs md:text-sm text-dusty-grey max-w-md leading-relaxed uppercase tracking-wider">
            Brands launch campaigns. Creators submit UGC clips. Mipoe’s platform ensures that every clip is optimized for engagement, reach, and conversion, delivering measurable results for both parties.
          </p>
        </div>

        <div className="relative -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 overflow-visible">
          <div className="pointer-events-none absolute inset-y-8 left-0 z-20 w-8 sm:w-12 bg-gradient-to-r from-white to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-8 right-0 z-20 w-8 sm:w-12 bg-gradient-to-l from-white to-transparent"></div>

          {/* Horizontal UGC Clips Array with Soft Blurred Edge Boundaries */}
          <motion.div 
            style={{ scale, opacity }}
            className="w-full overflow-x-auto overflow-y-visible px-4 sm:px-6 md:px-10 lg:px-14 py-8 md:py-10 scrollbar-none flex gap-4 sm:gap-5 md:gap-6 items-center justify-start xl:justify-center"
          >
            {clips.map((clip, index) => {
              // Subtle rotation offset for the fan/arc aesthetic
              const rotations = [-2.5, -1, 1.5, 2.5];
              const rotationAngle = rotations[index % rotations.length];
              const openCreatorStore = () => navigate(`/store/${clip.storeUsername}`);

              return (

                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.12 }}
                  whileHover={{ 
                    scale: 1.035, 
                    rotate: 0,
                    y: -6,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  onClick={openCreatorStore}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openCreatorStore();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${clip.creatorName}'s public store`}
                  style={{ rotate: `${rotationAngle}deg` }}
                  className="flex-shrink-0 w-[210px] sm:w-[235px] md:w-[255px] lg:w-[275px] xl:w-[290px] aspect-[9/16] relative rounded-2xl overflow-hidden bg-slate-950/90 border border-white/15 dark:border-white/10 orange-glow-shadow group cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_36px_rgba(255,92,0,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-white"
                >
                {/* 1. Backdrop Image */}
                <img 
                  src={clip.imageUrl} 
                  alt={clip.title}
                  className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110"
/>

                {/* 2. Soft Edge Vignette & Blur Layer */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none"></div>
                <div className="absolute inset-0 border-[12px] border-black/20 rounded-2xl backdrop-blur-[1px] pointer-events-none"></div> */}

                {/* 3. Top Bar: Creator Info & Live Tag */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-snow">
                      {clip.creatorHandle}
                    </span>
                  </div>

                  <div className="bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/10 text-white/80 group-hover:text-primary transition-colors">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 4. Center Play Indicator on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-1" />
                  </div>
                </div>

                {/* 5. Bottom Overlay: Title, Cursive Text, Stats & Audio Badge */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col gap-2 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <span className="font-mono text-[10px] text-primary uppercase tracking-widest">
                    {clip.tag}
                  </span>

                  <h3 className="font-display font-medium text-sm md:text-base text-snow leading-snug line-clamp-2">
                    {clip.title}
                  </h3>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-dusty-grey">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-white">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        {clip.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/30" />
                        {clip.likes}
                      </span>
                    </div>

                    <Volume2 className="w-3.5 h-3.5 text-dusty-grey" />
                  </div>
                </div>

                {/* Corner Glow Accent */}
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer Info & Call to Action */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 md:mt-16">
          <p className="font-mono text-xs md:text-sm text-dusty-grey max-w-md leading-relaxed uppercase tracking-wider">
            Discover the latest UGC clips from creators worldwide. Each clip is optimized for engagement, reach, and conversion, ensuring measurable results for brands and creators alike.
          </p>

          {/* Call to Action Button */}
          <a 
            href="login?role=creator" 
            className="group flex items-center gap-2 text-blue-500 hover:text-primary transition-colors uppercase tracking-widest font-bold"
          >
            <span>Explore All Clip Campaigns</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>

      </div>
    </section>
  );
};

export default UGCShowcase;
