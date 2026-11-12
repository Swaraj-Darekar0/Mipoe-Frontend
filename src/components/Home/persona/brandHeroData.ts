export type BrandMode = "traditional" | "sellr";

export interface TraditionalCapsuleItem {
  text: string;
  w: number;
  compactW: number;
}

export interface SellrCapsuleItem {
  text: string;
  imageUrl: string;
  w: number;
  compactW: number;
}

/**
 * Traditional acquisition channels with snug, content-fitted widths.
 */
export const TRADITIONAL_CAPSULES: readonly TraditionalCapsuleItem[] = [
  { text: "Facebook Ads", w: 124, compactW: 104 },
  { text: "Instagram Boost", w: 142, compactW: 118 },
  { text: "Celebrity Shoutout", w: 160, compactW: 130 },
  { text: "PR Agency Retainer", w: 162, compactW: 132 },
  { text: "Billboard Campaign", w: 162, compactW: 132 },
  { text: "Influencer Agency Fee", w: 182, compactW: 146 },
  { text: "Google PPC Ads", w: 134, compactW: 112 },
  { text: "Sponsored Podcast", w: 156, compactW: 126 },
];

/**
 * sellr. mode verified results with thumbnail on far left + snug, content-fitted widths.
 */
export const SELLR_CAPSULES: readonly SellrCapsuleItem[] = [
  {
    text: "Clip had 248K views",
    imageUrl: "/thumbnails/real_clip_1.webp",
    w: 196,
    compactW: 156,
  },
  {
    text: "Clip had ₹40K sales",
    imageUrl: "/thumbnails/real_clip_2.webp",
    w: 192,
    compactW: 152,
  },
  {
    text: "Reel had 12K clicks",
    imageUrl: "/thumbnails/real_clip_3.webp",
    w: 194,
    compactW: 154,
  },
  {
    text: "UGC had 90K views",
    imageUrl: "/thumbnails/real_clip_4.webp",
    w: 192,
    compactW: 152,
  },
  {
    text: "Story had 340 codes",
    imageUrl: "/thumbnails/real_clip_5.webp",
    w: 198,
    compactW: 158,
  },
  {
    text: "Clip had 512K views",
    imageUrl: "/thumbnails/real_clip_6.webp",
    w: 196,
    compactW: 156,
  },
  {
    text: "Reel had ₹75K GMV",
    imageUrl: "/thumbnails/real_clip_7.webp",
    w: 194,
    compactW: 154,
  },
  {
    text: "UGC had 180K views",
    imageUrl: "/thumbnails/real_clip_8.webp",
    w: 198,
    compactW: 158,
  },
];

export interface PayoutItem {
  text: string;
  isProfit: boolean;
}

export const TRADITIONAL_PAYOUTS: readonly PayoutItem[] = [
  { text: "−₹80,000", isProfit: false },
  { text: "+₹20,000", isProfit: true },
  { text: "−₹35,000", isProfit: false },
  { text: "+₹12,000", isProfit: true },
  { text: "−₹55,000", isProfit: false },
  { text: "+₹42,000", isProfit: true },
  { text: "−₹90,000", isProfit: false },
  { text: "+₹18,000", isProfit: true },
];

export const SELLR_PAYOUTS: readonly PayoutItem[] = [
  { text: "+₹40,000", isProfit: true },
  { text: "+₹72,000", isProfit: true },
  { text: "+₹1,10,000", isProfit: true },
  { text: "+₹85,000", isProfit: true },
  { text: "+₹1,60,000", isProfit: true },
  { text: "+₹54,000", isProfit: true },
  { text: "+₹95,000", isProfit: true },
  { text: "+₹2,20,000", isProfit: true },
];
