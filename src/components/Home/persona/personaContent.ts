export type Persona = "creator" | "brand";

export interface HeadlineSegment {
  text: string;
  /** Carries the persona accent colour. */
  emphasis?: boolean;
  /** Set on the phrase the headline should land on: renders in the bold
   *  grotesque against the serif default, per the creator hero design. */
  strong?: boolean;
  /** Carries the band-and-dot emphasis treatment for optical scale. */
  highlight?: boolean;
}

export interface HeadlineLine {
  text: string;
  /** Carries the band-and-dot emphasis treatment. */
  highlight?: boolean;
  /** Carries the persona accent colour. */
  emphasis?: boolean;
  /** Optional strong font styling. */
  strong?: boolean;
}


export interface CarouselStep {
  number: string;
  title: string;
  description: string;
  tint: "peach" | "rose" | "mint" | "lavender" | "sky";
}

export interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue: (value: number) => string;
}

export interface ResultPart {
  text: string;
  emphasis?: boolean;
}

export interface CalculatorConfig {
  sliders: [SliderConfig, SliderConfig];
  computeResult: (a: number, b: number) => ResultPart[];
  disclaimer: string;
  handlePreview: string;
  ctaLabel: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PersonaContent {
  navLinks: string[];
  toggleLabel: string;
  hero: {
    headline: HeadlineSegment[];
    headlineLines?: readonly HeadlineLine[];
    subheadline: string;
    ctaLabel: string;
    ctaFootnote?: string;
  };
  ctaHref: string;
  carouselLabel: string;
  carouselIntro: string;
  steps: CarouselStep[];
  calculator: CalculatorConfig;
  faq: FaqItem[];
}

export const formatINR = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 100000) {
    return `₹${(rounded / 100000).toFixed(1)}L`;
  }
  if (rounded >= 1000) {
    return `₹${(rounded / 1000).toFixed(1)}K`;
  }
  return `₹${rounded.toLocaleString("en-IN")}`;
};

export const formatLakhViews = (value: number): string => `${(value / 100000).toFixed(1)} lakh`;

export const calculatorHeadline: HeadlineSegment[] = [
  { text: "Real Reach. " },
  { text: "REAL REVENUE", emphasis: true },
  { text: "." },
];

export const calculatorSubtext =
  "Calculate projected returns based on real platform payouts. Transparent, verified data with zero vanity metrics.";

export const personaContent: Record<Persona, PersonaContent> = {
  creator: {
    navLinks: ["How It Works", "Browse Campaigns", "Creator Payouts"],
    toggleLabel: "Brands",
    hero: {
      headline: [
        { text: "Your content already" },
        { text: "has an audience." },
        { text: "Get paid for it.", emphasis: true, highlight: true },
      ],
      headlineLines: [
        { text: "Your content already" },
        { text: "has an audience." },
        { text: "Get paid for it.", highlight: true, emphasis: true },
      ],
      subheadline: "No agency cuts. 500+ followers to start. Post reels and withdraw via UPI instantly.",
      ctaLabel: "Start Earning Today",
      ctaFootnote: "Zero fees to start • Instant UPI withdrawals",
    },
    ctaHref: "/creator/campaigns",
    carouselLabel: "HOW CREATORS EARN",
    
    carouselIntro: "No agency contact. No minimum followers. Just create.",
    steps: [
      {
        number: "01",
        title: "Sign Up. Open to Everyone.",
        description:
          "Have 500+ followers? Connect your socials and claim live briefs instantly.",
        tint: "peach",
      },
      {
        number: "02",
        title: "Pick Campaigns That Fit Your Vibe",
        description:
          "Browse active UGC briefs, affiliate links, and viral clipping campaigns.",
        tint: "mint",
      },
      {
        number: "03",
        title: "Post Your Content. That's It.",
        description:
          "Film in your authentic voice. No stiff corporate scripts or micromanaging.",
        tint: "sky",
      },
      {
        number: "04",
        title: "Views Turn Into ₹₹₹",
        description:
          "Earn per verified view, affiliate sale, or flat-fee UGC brief. One wallet.",
        tint: "lavender",
      },
      {
        number: "05",
        title: "Build Your Brand Track Record",
        description:
          "Grow your track record. Build credibility and unlock higher-paying deals.",
        tint: "rose",
      },
    ],
    calculator: {
      sliders: [
        {
          label: "Your followers",
          min: 500,
          max: 1000000,
          step: 500,
          defaultValue: 50000,
          formatValue: (v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString("en-IN")),
        },
        {
          label: "Monthly posts",
          min: 2,
          max: 30,
          step: 1,
          defaultValue: 8,
          formatValue: (v) => `${v}`,
        },
      ],
      computeResult: (followers, posts) => {
        // Tuned to hold up across the whole slider range (500–10L followers):
        //  - Reach: modeled at ~60% of follower count.
        //  - CPM payout: ₹85 per 1,000 verified views.
        //  - Base fee floor: guaranteed ₹75/post UGC fee floor.
        const viewsPerPost = followers * 0.6;
        const monthlyViews = viewsPerPost * posts;
        const cpmEarnings = (monthlyViews / 1000) * 85;
        const flatFeeFloor = posts * 75;
        const low = cpmEarnings * 0.8 + flatFeeFloor;
        const high = cpmEarnings * 1.5 + flatFeeFloor;
        return [
          { text: "Creators like you on sellr earn between " },
          { text: formatINR(low), emphasis: true },
          { text: " and " },
          { text: formatINR(high), emphasis: true },
          { text: " per month, withdrawn directly via UPI or bank transfer." },
        ];
      },
      disclaimer:
        "*Projections modeled at ₹85 per 1,000 verified views with ~60% organic reach on short-form reels, plus creator base fees. Payouts transfer directly via UPI or bank transfer once views are verified.",
      handlePreview: "sellr.in/your_handle",
      ctaLabel: "Join as a Creator →",
    },
    faq: [
      {
        question: "Do I need to be a big influencer to join?",
        answer:
          "Not at all. Whether you have 500 followers or 50,000, if your content connects with real audiences, brands on sellr want to work with you. You never need an agency deal or talent manager to claim active briefs.",
      },
      {
        question: "How exactly do I get paid?",
        answer:
          "You earn through pay-per-view payouts, affiliate sales commissions, or guaranteed flat fees for custom UGC videos. Campaign funds are safely locked in escrow upfront before you ever start filming. Once your content metrics are verified, earnings transfer directly to your UPI ID or bank account within 24 to 48 hours.",
      },
      {
        question: "Do I have to follow a brand script?",
        answer:
          "Never. Brands partner with sellr for authentic creator recommendations, not stiff corporate scripts. You receive a brief with key talking points, then shoot entirely in your own voice, style, and native language.",
      },
      {
        question: "What if I post content and it doesn't get many views?",
        answer:
          "You never owe anything or get penalized if a post underperforms. For view-based campaigns you simply earn on every verified view delivered, while flat-fee UGC deals pay your full agreed rate regardless of reach.",
      },
      {
        question: "Can I participate in multiple campaigns at the same time?",
        answer:
          "Yes, absolutely. You can run multiple brand campaigns, share affiliate links, and curate products in your storefront simultaneously. Your creator dashboard organizes all active briefs, deliverables, and payouts in real time.",
      },
    ],
  },
  brand: {
    navLinks: ["How It Works", "Campaign Types", "Pricing"],
    toggleLabel: "Creators",
    hero: {
      headline: [
        { text: "Stop burning ad spend" },
        { text: "on zero-trust ads." },
        { text: "Buy verified reach.", emphasis: true, highlight: true },
      ],
      headlineLines: [
        { text: "Stop burning ad spend" },
        { text: "on zero-trust ads." },
        { text: "Buy verified reach.", highlight: true, emphasis: true },
      ],
      subheadline: "Zero wasted budget. 100% escrow protected. Pay authentic creators for verified results.",
      ctaLabel: "Launch a Campaign",
      ctaFootnote: "Zero monthly retainers • 100% escrow protection",
    },
    ctaHref: "/login?role=brand",
    carouselLabel: "HOW BRANDS WIN",
    
    carouselIntro: "Set it. Watch creators run it. Pay for what lands.",
    steps: [
      {
        number: "01",
        title: "Set Your Campaign in Minutes",
        description:
          "Choose UGC, affiliate, or clipping formats. Set your target view budget.",
        tint: "peach",
      },
      {
        number: "02",
        title: "Creators Come to You",
        description:
          "Vetted creators apply directly to your brief. No agency markups or DMs.",
        tint: "mint",
      },
      {
        number: "03",
        title: "Authentic Content Goes Live",
        description:
          "Creators publish authentic stories that drive 3–6x higher audience trust.",
        tint: "sky",
      },
      {
        number: "04",
        title: "Every View. Every Sale. Every Rupee.",
        description:
          "Track verified views, clicks, and attributed revenue in live real time.",
        tint: "lavender",
      },
      {
        number: "05",
        title: "Pay Only for Results. Keep the Rest.",
        description:
          "Pay strictly for verified views or direct sales. 100% escrow protected.",
        tint: "rose",
      },
    ],
    calculator: {
      sliders: [
        {
          label: "Campaign budget",
          min: 10000,
          max: 500000,
          step: 5000,
          defaultValue: 150000,
          formatValue: (v) => formatINR(v),
        },
        {
          label: "Campaign weeks",
          min: 1,
          max: 12,
          step: 1,
          defaultValue: 4,
          formatValue: (v) => `${v}`,
        },
      ],
      computeResult: (budget, weeks) => {
        // Views = (budget / ratePer1K) * 1000 for ₹60–₹100 per 1,000 views, with multi-week compounding.
        // Revenue modeled at historical 3–6x ROAS.
        const weeksFactor = 1 + (weeks - 1) * 0.08;
        const viewsLow = (budget / 100) * 1000 * weeksFactor;
        const viewsHigh = (budget / 60) * 1000 * weeksFactor;
        const revenueLow = budget * 3;
        const revenueHigh = budget * 6;
        return [
          { text: "At this budget, your campaign reaches an estimated " },
          { text: formatLakhViews(viewsLow), emphasis: true },
          { text: " to " },
          { text: formatLakhViews(viewsHigh), emphasis: true },
          { text: " organic views and generates " },
          { text: formatINR(revenueLow), emphasis: true },
          { text: " to " },
          { text: formatINR(revenueHigh), emphasis: true },
          { text: " in attributed revenue." },
        ];
      },
      disclaimer:
        "*Projections based on an average rate of ₹60–₹100 per 1,000 verified views and historical 3–6x ROAS. All campaign funds stay in escrow, with unspent budget refundable to your bank or UPI at any time.",
      handlePreview: "sellr.in/your-brand",
      ctaLabel: "Launch a Campaign →",
    },
    faq: [
      {
        question: "Do I need a big budget to start?",
        answer:
          "No. You can launch a verified campaign starting from just ₹5,000. Because you pay strictly for verified views or direct conversions, every rupee goes toward real audience engagement rather than wasted impressions.",
      },
      {
        question: "How is this different from running Instagram or YouTube ads?",
        answer:
          "Traditional display ads push sponsored banners that audiences actively ignore, while sellr delivers peer-to-peer recommendations from trusted creators. This authentic social proof routinely drives 3–6x higher conversion rates compared to standard ad networks.",
      },
      {
        question: "What types of campaigns can I run?",
        answer:
          "You can run three distinct campaign formats: custom UGC videos, performance affiliate links, or viral clipping campaigns that turn long-form footage into short-form reels. Mix and match formats seamlessly from a unified brand dashboard.",
      },
      {
        question: "How do I know the views are real and not bots?",
        answer:
          "Every campaign view is validated through automated engagement tracking to filter out bots, duplicate loops, and spam impressions. Creators are paid only for authentic human reach, guaranteeing zero wasted budget on fraudulent traffic.",
      },
      {
        question: "How long until I see results?",
        answer:
          "Most campaigns receive creator applications within 24 to 48 hours of launch. You review submissions, approve content drafts, and track verified view metrics and conversions in real time from day one.",
      },
    ],
  },
};
