'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { scoreListing, scoreLabel, psfFairValueNote } from '@/lib/scoring'
import type { Listing, Criteria } from '@/lib/types'
import { SG_DISTRICTS } from '@/lib/types'
import RatingButtons from '@/components/RatingButtons'
import ScoreBar from '@/components/ScoreBar'
import {
  ArrowLeft, ExternalLink, MapPin, BedDouble, Maximize2, Building2,
  Calendar, Pencil, ChevronRight,
} from 'lucide-react'

const DEFAULT_CRITERIA: Criteria = {
  id: '', name: 'default',
  w_location: 0.25, w_price: 0.25, w_unit: 0.25, w_condition: 0.25,
  max_budget: 2_000_000, min_size_sqft: 700, min_floor: 3,
  preferred_districts: [10, 11, 15, 19, 20],
  preferred_tenure: ['freehold', '999yr'],
  max_psf: null, mrt_max_walk_min: 10,
  psf_benchmarks: {},
}

const STATUS_OPTIONS = ['active','viewing','shortlisted','passed','transacted'] as const

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: l }, { data: crit }] = await Promise.all([
      supabase
        .from('listings')
        .select('*, latest_rating:ratings(*), viewing_note:viewing_notes(*)')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('criteria').select('*').limit(1).maybeSingle(),
    ])

    const c: Criteria = crit ?? DEFAULT_CRITERIA
    setCriteria(c)

    if (l) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lr: Listing['latest_rating'] | null = null
      if (Array.isArray((l as any).latest_rating) && (l as any).latest_rating.length > 0) {
        const sorted = [...(l as any).latest_rating].sort((a: any, b: any) => {
          const aDate = new Date(a?.created_at ?? 0).getTime()
          const bDate = new Date(b?.created_at ?? 0).getTime()
          return bDate - aDate
        })
        lr = sorted[0] ?? null
      } else if (!Array.isArray((l as any).latest_rating)) {
        lr = (l as any).latest_rating
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vn = Array.isArray((l as any).viewing_note)  ? ((l as any).viewing_note[0]  ?? null) : (l as any).viewing_note
      const enriched: Listing = { ...l, latest_rating: lr, viewing_note: vn }
      setListing({ ...enriched, score: scoreListing(enriched, c) })
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function updateStatus(status: string) {
    if (!listing) return
    setUpdatingStatus(true)
    await supabase.from('listings').update({ status }).eq('id', id)
    setListing(prev => prev ? { ...prev, status: status as Listing['status'] } : prev)
    setUpdatingStatus(false)
  }

  if (loading) return <div className="h-64 bg-white rounded-xl border animate-pulse" />
  if (!listing) return <div className="text-center py-16 text-gray-400">Listing not found.</div>

  const score = listing.score ?? null
  const fairNote = psfFairValueNote(listing.psf, listing.district, criteria.psf_benchmarks)
  const { color } = score !== null ? scoreLabel(score) : { color: '' }

  return (
    <div className="space-y-5 pb-8">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{listing.project_name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={13} />
              D{listing.district} · {SG_DISTRICTS[listing.district] ?? listing.area ?? '—'}
              {listing.address && ` · ${listing.address}`}
            </p>
          </div>
          {score !== null && (
            <div className="text-right shrink-0">
              <span className={`text-3xl font-bold ${color}`}>{score}</span>
              <p className="text-xs text-gray-400">/ 100</p>
            </div>
          )}
        </div>

        {score !== null && <ScoreBar score={score} />}

        {fairNote && (
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg">
            ⚠ {fairNote}
          </div>
        )}

        {/* Key facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { Icon: BedDouble,  label: 'Bedrooms',  value: listing.bedrooms != null ? `${listing.bedrooms} BR` : '—'          },
            { Icon: Maximize2,  label: 'Size',       value: listing.unit_size_sqft ? `${listing.unit_size_sqft.toLocaleString()} sqft` : '—' },
            { Icon: Building2,  label: 'Floor',      value: listing.floor_level ? `Level ${listing.floor_level}` : '—'         },
            { Icon: Calendar,   label: 'TOP',        value: listing.top_year ? String(listing.top_year) : '—'                  },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <Icon size={14} className="text-gray-400 mb-1" />
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-sm font-semibold text-gray-800">{value}</div>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {listing.asking_price ? `S$${(listing.asking_price / 1_000_000).toFixed(2)}M` : 'TBC'}
            </span>
            {listing.psf && (
              <span className="ml-2 text-sm text-gray-400">S${listing.psf.toLocaleString()}/psf</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{listing.tenure}</div>
            {listing.facing && <div className="text-sm text-gray-500">{listing.facing}-facing</div>}
          </div>
        </div>

        {listing.listing_url && (
          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ExternalLink size={14} /> View original listing
          </a>
        )}
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              disabled={updatingStatus}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                listing.status === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-viewing rating */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Pre-Viewing Rating</h2>
        <RatingButtons
          listingId={id}
          stage="pre_viewing"
          current={listing.latest_rating?.stage === 'pre_viewing' ? listing.latest_rating.decision : null}
          onSaved={load}
        />
      </div>

      {/* Viewing notes link */}
      <Link
        href={`/view/${id}`}
        className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4 group hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Pencil size={18} className="text-blue-600" />
          <div>
            <div className="font-medium text-blue-800">
              {listing.viewing_note ? 'Edit Viewing Notes' : 'Add Viewing Notes'}
            </div>
            <div className="text-xs text-blue-600 mt-0.5">
              {listing.viewing_note
                ? `Last updated ${new Date(listing.viewing_note.created_at).toLocaleDateString('en-SG')}`
                : 'Fill in after your site visit — mobile-friendly'}
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* Post-viewing rating (only show if viewing notes exist) */}
      {listing.viewing_note && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Post-Viewing Rating</h2>
          <RatingButtons
            listingId={id}
            stage="post_viewing"
            current={listing.latest_rating?.stage === 'post_viewing' ? listing.latest_rating.decision : null}
            onSaved={load}
          />
        </div>
      )}

      {/* Viewing notes summary */}
      {listing.viewing_note && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Viewing Notes Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              ['Fixtures',      listing.viewing_note.score_fixtures],
              ['Flooring',      listing.viewing_note.score_flooring],
              ['Kitchen',       listing.viewing_note.score_kitchen],
              ['Bathroom',      listing.viewing_note.score_bathroom],
              ['Natural light', listing.viewing_note.score_natural_light],
              ['Noise',         listing.viewing_note.score_noise],
              ['Facilities',    listing.viewing_note.score_facilities],
              ['Carpark',       listing.viewing_note.score_carpark],
            ] as [string, number | null][]).map(([label, val]) => val != null && (
              <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">{label}</div>
                <div className="text-lg font-bold text-gray-800">{val}<span className="text-xs font-normal text-gray-400">/5</span></div>
              </div>
            ))}
          </div>
          {listing.viewing_note.deal_breakers?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.viewing_note.deal_breakers.map(d => (
                <span key={d} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                  ⚠ {d.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
          {listing.viewing_note.notes_general && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">
              &ldquo;{listing.viewing_note.notes_general}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}
