'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { scoreListing } from '@/lib/scoring'
import type { Listing, Criteria, ListingStatus } from '@/lib/types'
import { SG_DISTRICTS } from '@/lib/types'
import ListingCard from '@/components/ListingCard'
import { Search, SlidersHorizontal } from 'lucide-react'

const DEFAULT_CRITERIA: Criteria = {
  id: '', name: 'default',
  w_location: 0.25, w_price: 0.25, w_unit: 0.25, w_condition: 0.25,
  max_budget: 2_000_000, min_size_sqft: 700, min_floor: 3,
  preferred_districts: [10, 11, 15, 19, 20],
  preferred_tenure: ['freehold', '999yr'],
  max_psf: null, mrt_max_walk_min: 10,
  psf_benchmarks: {},
}

type SortKey = 'score' | 'price_asc' | 'price_desc' | 'newest'

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('score')
  const [filterDistrict, setFilterDistrict] = useState<number | ''>('')
  const [filterStatus, setFilterStatus] = useState<ListingStatus | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: rawListings }, { data: crit }] = await Promise.all([
      supabase
        .from('listings')
        .select('*, latest_rating:ratings(*), viewing_note:viewing_notes(*)')
        .order('created_at', { ascending: false }),
      supabase.from('criteria').select('*').limit(1).maybeSingle(),
    ])

    const c: Criteria = crit ?? DEFAULT_CRITERIA
    setCriteria(c)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scored = (rawListings ?? []).map((l: any) => {
      let lr: Listing['latest_rating'] | null = null
      if (Array.isArray(l.latest_rating) && l.latest_rating.length > 0) {
        const sorted = [...l.latest_rating].sort((a: any, b: any) => {
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

  const filtered = listings
    .filter(l => {
      if (search && !l.project_name.toLowerCase().includes(search.toLowerCase()) &&
          !(l.area?.toLowerCase().includes(search.toLowerCase()))) return false
      if (filterDistrict && l.district !== filterDistrict) return false
      if (filterStatus && l.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'score')      return (b.score ?? 0) - (a.score ?? 0)
      if (sort === 'price_asc')  return (a.asking_price ?? 0) - (b.asking_price ?? 0)
      if (sort === 'price_desc') return (b.asking_price ?? 0) - (a.asking_price ?? 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const usedDistricts = [...new Set(listings.map(l => l.district))].sort((a, b) => a - b)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Listings</h1>
        <span className="text-sm text-gray-400">{filtered.length} of {listings.length}</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <SlidersHorizontal size={15} /> Filters
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search project or area…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={filterDistrict}
            onChange={e => setFilterDistrict(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All districts</option>
            {usedDistricts.map(d => (
              <option key={d} value={d}>D{d} · {SG_DISTRICTS[d]}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ListingStatus | '')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All statuses</option>
            {['active','viewing','shortlisted','passed','transacted'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="score">Sort: Score</option>
            <option value="price_asc">Sort: Price ↑</option>
            <option value="price_desc">Sort: Price ↓</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl border h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}
