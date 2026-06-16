import type { Listing, Criteria, ViewingNote } from './types'

/**
 * Returns a 0–100 score for a listing given the user's criteria.
 * Weighted sum of four dimensions: location, price, unit, condition.
 */
export function scoreListing(listing: Listing, criteria: Criteria): number {
  const location  = scoreLocation(listing, criteria)   // 0–100
  const price     = scorePrice(listing, criteria)      // 0–100
  const unit      = scoreUnit(listing, criteria)       // 0–100
  const condition = scoreCondition(listing.viewing_note ?? null) // 0–100

  const raw =
    location  * criteria.w_location +
    price     * criteria.w_price    +
    unit      * criteria.w_unit     +
    condition * criteria.w_condition

  return Math.round(raw)
}

function scoreLocation(l: Listing, c: Criteria): number {
  let score = 50  // neutral start

  // Preferred district: +30
  if (l.district && c.preferred_districts.includes(l.district)) score += 30
  else score -= 20

  // Tenure preference: +20
  if (c.preferred_tenure.includes(l.tenure)) score += 20

  return clamp(score)
}

function scorePrice(l: Listing, c: Criteria): number {
  if (!l.asking_price) return 50

  const budget = c.max_budget
  const ratio  = l.asking_price / budget  // 1.0 = exactly at budget

  // Full marks at 80% of budget, zero at 120%
  let score = 100 - ((ratio - 0.8) / 0.4) * 100

  // PSF vs benchmark
  if (l.psf && l.district) {
    const benchmark = c.psf_benchmarks[String(l.district)]
    if (benchmark) {
      const psfRatio = l.psf / benchmark
      if (psfRatio < 0.95)       score += 10  // below market
      else if (psfRatio > 1.10)  score -= 15  // above market
    }
  }

  return clamp(score)
}

function scoreUnit(l: Listing, c: Criteria): number {
  let score = 50

  // Floor level: higher is better (cap at 20)
  if (l.floor_level) {
    if (l.floor_level >= 20)       score += 25
    else if (l.floor_level >= 10)  score += 15
    else if (l.floor_level >= 5)   score += 5
    else                           score -= 10
  }

  // Size vs minimum
  if (l.unit_size_sqft) {
    const excess = l.unit_size_sqft - c.min_size_sqft
    if (excess >= 200)       score += 20
    else if (excess >= 0)    score += 10
    else                     score -= 20
  }

  // Good facings (N, NE, E, SE = no afternoon sun)
  if (l.facing) {
    const goodFacings = ['N', 'NE', 'E', 'SE']
    const badFacings  = ['W', 'SW']
    if (goodFacings.includes(l.facing))  score += 10
    if (badFacings.includes(l.facing))   score -= 15
  }

  // TOP year: newer is better
  if (l.top_year) {
    const age = new Date().getFullYear() - l.top_year
    if (age <= 5)       score += 15
    else if (age <= 10) score += 8
    else if (age > 20)  score -= 10
  }

  return clamp(score)
}

function scoreCondition(note: ViewingNote | null): number {
  if (!note) return 50  // no viewing yet — neutral

  const scores = [
    note.score_fixtures,
    note.score_flooring,
    note.score_kitchen,
    note.score_bathroom,
    note.score_natural_light,
    note.score_noise,
    note.score_facilities,
  ].filter((s): s is number => s !== null)

  if (scores.length === 0) return 50

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  let score = ((avg - 1) / 4) * 100  // convert 1–5 scale to 0–100

  // Deal breakers: each costs 15 points
  score -= (note.deal_breakers?.length ?? 0) * 15

  return clamp(score)
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Strong',  color: 'text-emerald-600' }
  if (score >= 55) return { label: 'Good',    color: 'text-blue-600'    }
  if (score >= 40) return { label: 'OK',      color: 'text-amber-600'   }
  return               { label: 'Weak',    color: 'text-red-500'      }
}

export function psfFairValueNote(
  psf: number | null,
  district: number | null,
  benchmarks: Record<string, number>
): string | null {
  if (!psf || !district) return null
  const bench = benchmarks[String(district)]
  if (!bench) return null
  const diff = ((psf - bench) / bench) * 100
  if (diff > 10)  return `${diff.toFixed(0)}% above D${district} median (S$${bench}/psf)`
  if (diff < -10) return `${Math.abs(diff).toFixed(0)}% below D${district} median (S$${bench}/psf)`
  return null
}
