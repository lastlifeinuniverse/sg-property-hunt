'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { scoreListing } from '@/lib/scoring'
import type { Listing, Criteria } from '@/lib/types'
import ListingCard from '@/components/ListingCard'
import { TrendingUp, Heart, Eye, List } from 'lucide-react'

const DEFAULT_CRITERIA: Criteria = {
  id: '', name: 'default',
  w_location: 0.25, w_price: 0.25, w_unit: 0.25, w_condition: 0.25,
  max_budget: 2_000_000, min_size_sqft: 700, min_floor: 3,
  preferred_districts: [10, 11, 15, 19, 20],
  preferred_tenure: ['freehold', '999yr'],
  max_psf: null, mrt_max_walk_min: 10,
  psf_benchmarks: {},
}

type ListingRow = Omit<Listing, 'latest_rating' | 'viewing_note'> & {
  latest_rating: Listing['latest_rating'][] | Listing['latest_rating'] | null
  viewing_note: Listing['viewing_note'][] | Listing['viewing_note'] | null
}

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([])
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'top' | 'liked' | 'visited' | 'all'>('top')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: rawListings }, { data: crit }] = await Promise.all([
      supabase
        .from('listings')
        .select('*, latest_rating:ratings(*), viewing_note:viewing_notes(*)')
        .neq('status', 'passed')
        .order('created_at', { ascending: false }),
      supabase.from('criteria').select('*').limit(1).maybeSingle(),
    ])

    const c: Criteria = crit ?? DEFAULT_CRITERIA
    setCriteria(c)

    const scored = (rawListings ?? []).map((l: ListingRow) => {
      // Get the latest rating (most recent by created_at)
      let lr: Listing['latest_rating'] | null = null
      if (Array.isArray(l.latest_rating) && l.latest_rating.length > 0) {
        const sorted = [...l.latest_rating].sort((a, b) => {
          const aDate = new Date(a?.created_at ?? 0).getTime()
          const bDate = new Date(b?.created_at ?? 0).getTime()
          return bDate - aDate
        })
        lr = sorted[0] ?? null
      } else if (!Array.isArray(l.latest_rating)) {
        lr = l.latest_rating
      }
      const vn = Array.isArray(l.viewing_note)  ? (l.viewing_note[0]  ?? null) : l.viewing_note
      const enriched: Listing = { ...l, latest_rating: lr, viewing_note: vn }
      return { ...enriched, score: scoreListing(enriched, c) }
    })

    setListings(scored)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const liked   = listings.filter(l => l.latest_rating?.decision === 'like')
  const visited = listings.filter(l => l.viewing_note)
  const top     = [...listings].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 10)

  const display = tab === 'top' ? top : tab === 'liked' ? liked : tab === 'visited' ? visited : listings

  const stats = [
    { label: 'Tracking',  value: listings.length, Icon: List,       color: 'text-gray-600'    },
    { label: 'Liked',     value: liked.length,    Icon: Heart,      color: 'text-emerald-600' },
    { label: 'Visited',   value: visited.length,  Icon: Eye,        color: 'text-blue-600'    },
    { label: 'Avg score', value: listings.length
        ? Math.round(listings.reduce((s, l) => s + (l.score ?? 0), 0) / listings.length)
        : 0,
      Icon: TrendingUp, color: 'text-indigo-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your structured property search — Singapore private resale</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <Icon size={18} className={`${color} mb-1`} />
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['top', 'liked', 'visited', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'top' ? 'Top Picks' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'liked' && liked.length > 0 && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full">
                {liked.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No listings here yet.</p>
          <p className="text-sm mt-1">
            {tab === 'all'
              ? 'Add your first listing to get started.'
              : 'Listings will appear here once you rate or visit them.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {display.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}
