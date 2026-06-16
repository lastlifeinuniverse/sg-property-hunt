export type Tenure = 'freehold' | '999yr' | '99yr'
export type Facing = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW'
export type ListingStatus = 'active' | 'viewing' | 'shortlisted' | 'passed' | 'transacted'
export type Decision = 'like' | 'dislike' | 'maybe'
export type RatingStage = 'pre_viewing' | 'post_viewing'

export interface Listing {
  id: string
  created_at: string
  project_name: string
  district: number
  area: string | null
  address: string | null
  lat: number | null
  lng: number | null
  floor_level: number | null
  unit_size_sqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  facing: Facing | null
  asking_price: number | null
  psf: number | null
  tenure: Tenure
  top_year: number | null
  listing_url: string | null
  listing_source: string
  days_on_market: number | null
  agent_name: string | null
  agent_contact: string | null
  status: ListingStatus
  // joined
  latest_rating?: Rating | null
  viewing_note?: ViewingNote | null
  score?: number | null
}

export interface Rating {
  id: string
  created_at: string
  listing_id: string
  decision: Decision
  stage: RatingStage
  reasons: string[]
  notes: string | null
}

export interface ViewingNote {
  id: string
  created_at: string
  listing_id: string
  viewed_at: string | null
  agent_asking: number | null
  score_fixtures: number | null
  score_flooring: number | null
  score_kitchen: number | null
  score_bathroom: number | null
  score_natural_light: number | null
  score_noise: number | null
  score_facilities: number | null
  score_carpark: number | null
  has_renovation: boolean
  reno_age_years: number | null
  deal_breakers: string[]
  notes_general: string | null
  notes_unit: string | null
  notes_building: string | null
  notes_area: string | null
  photos: string[]
}

export interface Criteria {
  id: string
  name: string
  w_location: number
  w_price: number
  w_unit: number
  w_condition: number
  max_budget: number
  min_size_sqft: number
  min_floor: number
  preferred_districts: number[]
  preferred_tenure: Tenure[]
  max_psf: number | null
  mrt_max_walk_min: number
  psf_benchmarks: Record<string, number>  // district -> median PSF
}

// Reason tag options for like/dislike
export const DISLIKE_REASONS = [
  { value: 'price_high',      label: 'Price too high' },
  { value: 'psf_high',        label: 'PSF above benchmark' },
  { value: 'low_floor',       label: 'Floor too low' },
  { value: 'facing_west',     label: 'West-facing (afternoon heat)' },
  { value: 'small_size',      label: 'Too small' },
  { value: 'old_top',         label: 'TOP too old' },
  { value: 'leasehold',       label: 'Leasehold concern' },
  { value: 'far_mrt',         label: 'Too far from MRT' },
  { value: 'bad_district',    label: 'Not preferred district' },
  { value: 'layout',          label: 'Bad layout' },
  { value: 'no_carpark',      label: 'No carpark' },
  { value: 'noise',           label: 'Noisy location' },
]

export const LIKE_REASONS = [
  { value: 'good_price',      label: 'Good value' },
  { value: 'high_floor',      label: 'High floor' },
  { value: 'good_facing',     label: 'Good facing' },
  { value: 'large_size',      label: 'Good size' },
  { value: 'freehold',        label: 'Freehold' },
  { value: 'near_mrt',        label: 'Near MRT' },
  { value: 'good_layout',     label: 'Great layout' },
  { value: 'good_facilities', label: 'Good facilities' },
  { value: 'quiet',           label: 'Quiet location' },
  { value: 'good_school',     label: 'Good school zone' },
]

export const DEAL_BREAKERS = [
  { value: 'water_stain',     label: 'Water stains / seepage' },
  { value: 'old_wiring',      label: 'Old wiring / DB box' },
  { value: 'west_heat',       label: 'Intense west-facing heat' },
  { value: 'highway_noise',   label: 'Highway noise' },
  { value: 'mrt_noise',       label: 'MRT noise' },
  { value: 'corridor_unit',   label: 'Corridor-facing unit' },
  { value: 'ground_floor',    label: 'Ground floor privacy issue' },
  { value: 'bad_lift',        label: 'Lift lobby issues' },
  { value: 'pest',            label: 'Pest evidence' },
  { value: 'low_ceiling',     label: 'Low ceiling height' },
]

export const SG_DISTRICTS: Record<number, string> = {
  1: 'Boat Quay / Raffles Place',
  2: 'Chinatown / Tanjong Pagar',
  3: 'Queenstown / Tiong Bahru',
  4: 'Harbourfront / Telok Blangah',
  5: 'Buona Vista / West Coast',
  6: 'City Hall / Clarke Quay',
  7: 'Beach Road / Bugis',
  8: 'Little India / Farrer Park',
  9: 'Orchard / River Valley',
  10: 'Bukit Timah / Holland',
  11: 'Newton / Novena',
  12: 'Toa Payoh / Balestier',
  13: 'Macpherson / Potong Pasir',
  14: 'Geylang / Paya Lebar',
  15: 'East Coast / Marine Parade',
  16: 'Bedok / Upper East Coast',
  17: 'Changi / Loyang',
  18: 'Tampines / Pasir Ris',
  19: 'Hougang / Punggol / Sengkang',
  20: 'Ang Mo Kio / Bishan / Thomson',
  21: 'Clementi / Upper Bukit Timah',
  22: 'Boon Lay / Jurong / Tuas',
  23: 'Hillview / Bukit Batok',
  24: 'Lim Chu Kang / Tengah',
  25: 'Kranji / Woodgrove',
  26: 'Mandai / Upper Thomson',
  27: 'Yishun / Sembawang',
  28: 'Seletar / Yio Chu Kang',
}
