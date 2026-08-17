export type Persona = "creator" | "brand";

export interface HeadlineSegment {
  text: string;
  /** Carries the persona accent colour. */
  emphasis?: boolean;
  /** Set on the phrase the headline should land on: renders in the bold
   *  grotesque against the serif default, per the creator hero design. */
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
  { text: "How " },
  { text: "RICH", emphasis: true },
  { text: " is Rich?" },
];

export const calculatorSubtext =
  "Based on real campaign data across active sellr creators and brands. No fluff. No vanity projections.";

export const personaContent: Record<Persona, PersonaContent> = {
  creator: {
    navLinks: ["How It Works", "Browse Campaigns", "Creator Payouts"],
    toggleLabel: "Brands",
    hero: {
      headline: [
        { text: "Your " },
        { text: "CONTENT", emphasis: true },
        { text: " Already Has " },
        { text: "an Audience. Get ", strong: true },
        { text: "PAID", emphasis: true },
        { text: " For It." },
      ],
      subheadline: "No agency. No gatekeepers. No minimum follower count. Just post, earn, repeat.",
      ctaLabel: "Start Earning Today",
      ctaFootnote: "whats upp!!"
    },
    ctaHref: "/login?role=creator",
    carouselLabel: "HOW CREATORS EARN",
    
    carouselIntro: "No agency contact. No minimum followers. Just create.",
    steps: [
      {
        number: "01",
        title: "Sign Up. No Gatekeeping.",
        description:
          "Whether you have 500 followers or 5 lakh — if your content resonates, there's a campaign for you. Create a profile. Connect your Instagram or YouTube.",
        tint: "peach",
      },
      {
        number: "02",
        title: "Pick Campaigns That Fit Your Vibe",
        description:
          "UGC video campaigns. Affiliate product links. Viral clip briefs. Browse live brand campaigns and apply to what matches your content style and audience.",
        tint: "mint",
      },
      {
        number: "03",
        title: "Post Your Content. That's It.",
        description:
          "Film it your way. No corporate scripts. No stiff brand guidelines. Brands on sellr want authentic, not polished-to-death. Your real voice is the product.",
        tint: "sky",
      },
      {
        number: "04",
        title: "Views Turn Into ₹₹₹",
        description:
          "Every verified view earns you CPV payouts. Affiliate sales earn you commissions. UGC content earns you flat fees. Three income streams, one platform.",
        tint: "lavender",
      },
      {
        number: "05",
        title: "Build Your Brand. Not Just Your Feed.",
        description:
          "Your sellr store, your creator profile, your campaign history — it all builds your creator credibility. The more you do, the more brands come to you.",
        tint: "rose",
      },
    ],
    calculator: {
      sliders: [
        {
          label: "How many followers do you have?",
          min: 500,
          max: 1000000,
          step: 500,
          defaultValue: 50000,
          formatValue: (v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString("en-IN")),
        },
        {
          label: "How many campaign posts per month?",
          min: 2,
          max: 30,
          step: 1,
          defaultValue: 8,
          formatValue: (v) => `${v}`,
        },
      ],
      computeResult: (followers, posts) => {
        // Placeholder formula, tuned to hold up across the whole slider
        // range (500–10L followers), not just the high end:
        //  - Reach: short-form posts on Instagram/YouTube routinely reach
        //    well beyond the follower count via Explore/Shorts feeds, so
        //    views per post are modeled at ~60% of follower count.
        //  - CPV payout: a flat ₹0.10 per verified view (mid-point of the
        //    platform's ₹0.08–₹0.20 CPV band that brands pay into).
        //  - Flat-fee floor: a guaranteed ~₹75/post UGC flat fee so even a
        //    small creator sees a real, non-trivial number, not ₹20–40.
        // Replace with real data once available.
        const viewsPerPost = followers * 0.6;
        const monthlyViews = viewsPerPost * posts;
        const cpvEarnings = monthlyViews * 0.1;
        const flatFeeFloor = posts * 75;
        const low = cpvEarnings * 0.8 + flatFeeFloor;
        const high = cpvEarnings * 1.5 + flatFeeFloor;
        return [
          { text: "Creators like you on sellr earn between " },
          { text: formatINR(low), emphasis: true },
          { text: " and " },
          { text: formatINR(high), emphasis: true },
          { text: " per month from CPV payouts and per-post fees combined." },
        ];
      },
      disclaimer:
        "*Estimated using an average CPV of ₹0.10 per view, ~60% of your followers viewing each post, and a small guaranteed fee per post. Actual earnings vary by niche, engagement, and campaign mix.",
      handlePreview: "sellr.in/your_handle",
      ctaLabel: "Join as a Creator →",
    },
    faq: [
      {
        question: "Do I need to be a big influencer to join?",
        answer:
          "No. This is literally the point of sellr. If your content is good and your audience trusts you — even 500 followers — there are brands here that want to work with you. The era of \"wait for a DM from a marketing agency\" is over. You come here, browse live campaigns, and apply directly.",
      },
      {
        question: "How exactly do I get paid?",
        answer:
          "Three ways, depending on campaign type: CPV Payout — you earn per verified view on your campaign content. Affiliate Commission — you earn a % of every sale driven by your unique link. UGC Flat Fee — brands pay a fixed rate for the content you create, regardless of views. Payouts go directly to your linked payout account after verification.",
      },
      {
        question: "Do I have to follow a brand script?",
        answer:
          "Brands on sellr specifically want authentic content — not scripted ads. They give you a brief (product, key message, do's and don'ts), and you create in your own style, your own language, your own voice. That's the whole reason creators on this platform convert better than traditional ads.",
      },
      {
        question: "What if I post content and it doesn't get many views?",
        answer:
          "Your payout scales with your reach — so lower views means lower CPV payout, but you never go into debt or get penalized. The risk is on the brand, not on you. For UGC campaigns (flat fee), you get paid regardless of view count. Build your audience and your earnings grow with it.",
      },
      {
        question: "Can I participate in multiple campaigns at the same time?",
        answer:
          "Yes — absolutely. Browse active campaigns, apply to as many as fit your content style, and run them simultaneously. Your sellr creator profile tracks all active campaigns, earnings, and payouts in one place. More campaigns = more income streams, simple.",
      },
    ],
  },
  brand: {
    navLinks: ["How It Works", "Campaign Types", "Pricing"],
    toggleLabel: "Creators",
    hero: {
      headline: [
        { text: "Stop " },
        { text: "BURNING", emphasis: true },
        { text: " Budget on Ads Nobody Trusts. Start " },
        { text: "BUYING", emphasis: true },
        { text: " Real Reach." },
      ],
      subheadline: "Set a campaign. Set a budget. Pay only when results hit. Creators do the rest.",
      ctaLabel: "Launch a Campaign",
      ctaFootnote: "whats upp!!"
    },
    ctaHref: "/login?role=brand",
    carouselLabel: "HOW BRANDS WIN",
    
    carouselIntro: "Set it. Watch creators run it. Pay for what lands.",
    steps: [
      {
        number: "01",
        title: "Set Your Campaign in Minutes",
        description:
          "Choose your campaign type — UGC content, product affiliate links, or viral clip campaigns. Define your budget, your brief, your CPV. We handle the rest.",
        tint: "peach",
      },
      {
        number: "02",
        title: "Creators Come to You",
        description:
          "No cold outreach. No agency middlemen. India's creator pool comes to your brief. Pick creators based on niche, reach, engagement, and audience demographics.",
        tint: "mint",
      },
      {
        number: "03",
        title: "Authentic Content Goes Live",
        description:
          "Real creators. Real audiences. Real trust. Your brand gets peer-to-peer storytelling — the only format Gen-Z and Millennial India actually listens to.",
        tint: "sky",
      },
      {
        number: "04",
        title: "Every View. Every Sale. Every Rupee.",
        description:
          "Your dashboard tracks views, clicks, conversions, and affiliate commissions in real-time. No spreadsheets, no agency reports, no ambiguity.",
        tint: "lavender",
      },
      {
        number: "05",
        title: "Pay Only for Results. Keep the Rest.",
        description:
          "CPV-based billing. You only pay per verified view or per conversion. Your ad budget finally works as hard as you do.",
        tint: "rose",
      },
    ],
    calculator: {
      sliders: [
        {
          label: "How much are you investing?",
          min: 10000,
          max: 500000,
          step: 5000,
          defaultValue: 150000,
          formatValue: (v) => formatINR(v),
        },
        {
          label: "For how many weeks?",
          min: 1,
          max: 12,
          step: 1,
          defaultValue: 4,
          formatValue: (v) => `${v}`,
        },
      ],
      computeResult: (budget, weeks) => {
        // Placeholder formula: views = budget / CPV (₹0.08–₹0.20 range from the
        // disclaimer), with a modest multi-week compounding factor. Revenue
        // uses the 3–6x ROAS range. Replace with real data once available.
        const weeksFactor = 1 + (weeks - 1) * 0.08;
        const viewsLow = (budget / 0.2) * weeksFactor;
        const viewsHigh = (budget / 0.08) * weeksFactor;
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
        "*Projections based on average CPV of ₹0.08–₹0.20, 3–6x ROAS from comparable campaigns, and a modest reach boost for longer campaigns. Actual results may vary by niche and creator mix.",
      handlePreview: "sellr.in/your-brand",
      ctaLabel: "Launch a Campaign →",
    },
    faq: [
      {
        question: "Do I need a big budget to start?",
        answer:
          "No. You can launch a campaign starting from ₹5,000. Our CPV model means you only spend money when real viewers actually watch your content — not just when an ad loads on someone's screen. Start small, scale what works.",
      },
      {
        question: "How is this different from running Instagram or YouTube ads?",
        answer:
          "Ads are push. sellr is pull. When a creator who already has a trusting audience talks about your product — that's earned media, not paid media. Our data shows 3–6x higher conversion rates vs. display ads in the same category, because the recommendation comes from a real person, not a brand.",
      },
      {
        question: "What types of campaigns can I run?",
        answer:
          "Three types — and you can mix them: UGC Video Campaigns (creators make authentic content about your product), Affiliate Campaigns (creators drive sales, you pay per conversion), and Clipping Campaigns (creators cut and post viral-format short clips of your existing video content). One dashboard. Three growth levers.",
      },
      {
        question: "How do I know the views are real and not bots?",
        answer:
          "Every view is verified through the platform's engagement tracking before any payout is processed. Creators only get paid for verified organic reach. That means your billing is 100% tied to real human eyeballs — not inflated impressions bought off an exchange.",
      },
      {
        question: "How long until I see results?",
        answer:
          "Most campaigns get their first creator submissions within 48 hours of going live. Campaigns with a clear brief and competitive CPV are typically fully staffed within 72 hours. You'll see real-time data on views and conversions from day one — no waiting for a monthly agency report.",
      },
    ],
  },
};
