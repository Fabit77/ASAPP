export type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
export type User = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  is_public: boolean;
};
export type PublicUser = Omit<User, "email">;
export type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string | null;
  owner_id: string;
  role?: Role;
};
export type Collection = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string;
  cover_image_url: string | null;
};
export type Drop = {
  id: string;
  organization_id: string;
  collection_id: string | null;
  title: string;
  slug: string;
  description: string;
  artwork_url: string;
  date: string | Date;
  start_date_time: string | Date;
  end_date_time: string | Date | null;
  venue_name: string | null;
  city: string | null;
  country: string | null;
  max_supply: number | null;
  claim_count: number;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  status: "DRAFT" | "PUBLISHED" | "ENDED" | "ARCHIVED";
  claims_paused: boolean;
  position: number;
  organization_name?: string;
  organization_slug?: string;
  claimed_at?: string | Date;
  collection_name?: string;
  collection_slug?: string;
};
export type Claim = {
  id: string;
  user_id: string;
  drop_id: string;
  claim_method: "QR" | "SECRET_WORD";
  claimed_at: string | Date;
};
export type ClaimMethod = {
  id: string;
  drop_id: string;
  type: "QR" | "SECRET_WORD" | "GPS";
  config: { hash?: string };
  code: string | null;
  active: boolean;
};
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
