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
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtWD9rHRb5-p37mcBab97RmHl6BEv2temcCLh98YYZq9qNsyIHsL0kqlg&s=10",
    w: 168,
    compactW: 136,
  },
  {
    text: "Clip had ₹40K sales",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa0YO8bAujXXIatFG0psIns6JxrnVU2-mlvqZYAJ9n-Q&s=10",
    w: 164,
    compactW: 132,
  },
  {
    text: "Reel had 12K clicks",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjOkn7mZideRyVVUawYaEaqmLnqFhBtyYBLL2tTrm1bw&s=10",
    w: 166,
    compactW: 134,
  },
  {
    text: "UGC had 90K views",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc2G8iZHTiGSzCj7yU46F6YaPJzCeXIOx_1XM_F4RDTw&s=10",
    w: 156,
    compactW: 128,
  },
  {
    text: "Story had 340 codes",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIREDGMPj24GIVlUR8m4W_8PdlBnLNpVpdS3Po-gocRA&s=10",
    w: 166,
    compactW: 134,
  },
  {
    text: "Clip had 512K views",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT480dOKYn2bDFC3UAjhxUEA7fz9brk_RE-SHvPlBjYeQ&s=10",
    w: 168,
    compactW: 136,
  },
  {
    text: "Reel had ₹75K GMV",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMjyaGQp-BpXvA_oExMBb57e0pqqLyg2HRIiYqmPGSHg&s=10",
    w: 158,
    compactW: 128,
  },
  {
    text: "UGC had 180K views",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtWD9rHRb5-p37mcBab97RmHl6BEv2temcCLh98YYZq9qNsyIHsL0kqlg&s=10",
    w: 168,
    compactW: 136,
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
