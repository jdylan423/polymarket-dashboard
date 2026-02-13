export type DealStatus = 'active' | 'sold' | 'removed' | (string & {});

export type Deal = {
  id: number;
  external_id: string | null;
  source: string;
  title: string | null;
  price: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  roi: number | null;
  cash_flow: number | null;
  gross_income: number | null;
  url: string | null;
  description: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  broker_name: string | null;
  broker_company: string | null;
  broker_phone: string | null;
  broker_email: string | null;
  listing_date: string | null;
  first_seen: string;
  last_updated: string;
  status: DealStatus;
  metadata: unknown | null;
};

export type DealStats = {
  totalDeals: number;
  activeDeals: number;
  avgRoi: number | null;
  avgPrice: number | null;
  updatedLast24h: number;
  priceBuckets: { label: string; min: number; max: number; count: number }[];
};
