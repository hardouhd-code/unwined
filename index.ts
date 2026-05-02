export type WineType = "rouge" | "blanc" | "rose" | "mousseux" | "autre";

export interface Wine {
  id: string | number;
  type: WineType;
  country: string;
  region: string;
  year?: number;
  producer?: string;
  name?: string;
  tasted: boolean;
  rating: number | null;
  storage: boolean;
  notes?: string;
  quantity: number;
  lowStockThreshold: number;
  story?: string;
  anecdote?: string;
  addedAt?: string;
  grapes?: string;
  price_range?: string;
  budget?: "budget" | "milieu" | "prestige";
  boir_url?: string;
  boir_price?: string | null;
  boir_found?: boolean;
  boir_image?: string | null;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  cave?: Wine[];
}

export interface ClaudeWineSuggestion {
  topPick: {
    name: string;
    producer: string;
    type: WineType;
    country: string;
    region: string;
    year: number;
    match: number;
    confidence?: number;
    why: string;
    story: string;
    taste_profile: {
      nose?: string;
      palate?: string;
      finish?: string;
      body?: string;
      acidity?: string;
      tannins?: string;
    };
    serving: {
      temperature?: string;
      pairing?: string;
    };
    emoji?: string;
    grapes?: string;
    price_range?: string;
  };
  boirSuggestions?: Array<{
    name: string;
    reason: string;
  }>;
}
