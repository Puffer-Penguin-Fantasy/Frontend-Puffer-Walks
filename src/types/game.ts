export interface Game {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  deposit_amount: string;
  min_daily_steps: string;
  start_time: string;
  end_time: string;
  no_of_days: string;
  is_sponsored: boolean;
  is_paused: boolean;
  is_public: boolean;
  required_nft: string;
  participants: string[];
  participants_count: number;
  prize_pool: string;
  sponsored_pool: string;
  sponsor_name: string;
  sponsor_amount: string;
  sponsor_image_url: string;
  joinCode?: string;
  isClaimed?: boolean;
  userCompletedDays?: number;
  userMissedDays?: number;
}
