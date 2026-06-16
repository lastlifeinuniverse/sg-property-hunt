'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { scoreListing } from '@/lib/scoring'
import type { Listing, Criteria } from '@/lib/types'
import { SG_DISTRICTS } from '@/lib/types'
import ScoreBar from '@/components/ScoreBar'
import { X, Plus } from 'lucide-react'

const DEFAULT_CRITERIA: Criteria = {
  id: '', name: 'default',
  w_location: 0.25, w_price: 0.25, w_unit: 0.25, w_condition: 0.25,
  max_budget: 2_000_000, min_size_sqft: 700, min_floor: 3,
  preferred_districts: [10, 11, 15, 19, 20],
  preferred_tenure: ['freehold', '999yr'],
  max_psf: null, mrt_max_walk_min: 10,
  psf_benchmarks: {},
}

const COMPARE_ROWS = [
  { label: 'District',    key: (l: Listing) => l.district ? `D${l.district} · ${SG_DISTRICTS[l.district] ?? ''}` : '—' },
  { label: 'Asking',      key: (l: Listing) => l.asking_price ? `S$${(l.asking_price/1_000_000).toFixed(2)}M` : '—'     },
  { label: 'PSF',         key: (l: Listing) => l.psf ? `S$${l.psf.toLocaleString()}/psf` : '—'                          },
  { label: 'Size',        key: (l: Listing) => l.unit_size_sqft ? `${l.unit_size_sqft.toLocaleString()} sqft` : '—'     },
  { label: 'Bedrooms',    key: (l: Listing) => l.bedrooms != null ? `${l.bedrooms} BR` : '—'                             },
  { label: 'Floor',       key: (l: Listing) => l.floor_level ? `Level ${l.floor_level}` : '—'                           },
  { label: 'Facing',      key: (l: Listing) => l.facing ?? '—'                                                           },
  { label: 'Tenure',      key: (l: Listing) => l.tenure                                                                  },
  { label: 'TOP',         key: (l: Listing) => l.top_year ? String(l.top_year) : '—'                                    },
  { label: 'Status',      key: (l: Listing) => l.status                                                                  },
  { label: 'Your rating', key: (l: Listing) => l.latest_rating ? `${l.latest_rating.decision} (${l.latest_rating.stage.replace('_',' ')})` : 'Not rated' },
]

export default function ComparePage() {
  const [all, setAll] = useState<Listing[]>([])
  const [selected, setSelected] = useState<Listing[]>([])
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA)
  const [loading, setLoading] = useState(true)
  const [picker, setPicker] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: rawListings }, { data: crit }] = await Promise.all([
      supabase.from('listings').select('*, latest_rating:ratings(*), viewing_note:viewing_notes(*)').order('created_at', { ascending: false }),
      supabase.from('criteria').select('*').limit(1).maybeSingle(),
    ])
    const c: Criteria = crit ?? DEFAULT_CRITERIA
    setCriteria(c)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scored = (rawListings ?? []).map((l: any) => {
      let lr: Listing['latest_rating'] | null = null
      if (Array.isArray(l.latest_rating)) {
        const sorted = [...l.latest_rating].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        lr = sorted[0] ?? null
      } else {
        lr = l.latest_rating
      }
      const vn = Array.isArray(l.viewing_note)  ? (l.viewing_note[0]  ?? null) : l.viewing_note
      const enriched: Listing = { ...l, latest_rating: lr, viewing_note: vn }
      return { ...enriched, score: scoreListing(enriched, c) }
    })
    setAll(scored)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function addToCompare(l: Listing) {
    if (selected.length >= 4) return
    if (selected.find(s => s.id === l.id)) return
    setSelected(s => [...s, l])
    setPicker(false)
  }

  function remove(id: string) {
    setSelected(s => s.filter(l => l.id !== id))
  }

  const available = all.filter(l => !selected.find(s => s.id === l.id))

  if (loading) return <div className="h-64 bg-white rounded-xl border animate-pulse" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare</h1>
          <p className="text-sm text-gray-500 mt-1">Side-by-side on normalised scores</p>
        </div>
        {selected.length < 4 && (
          <button
            onClick={() => setPicker(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={15} /> Add
          </button>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No listings selected.</p>
          <p className="text-sm mt-1">Click &ldquo;Add&rdquo; to pick up to 4 listings to compare.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-28">Criteria</th>
                {selected.map(l => (
                  <th key={l.id} className="px-4 py-3 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm leading-tight">{l.project_name}</span>
                      <button onClick={() => remove(l.id)} className="text-gray-300 hover:text-gray-500 mt-0.5 shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
              {/* Score row */}
              <tr className="bg-indigo-50 border-b border-indigo-100">
                <td className="px-4 py-3 text-xs font-semibold text-indigo-700">Overall Score</td>
                {selected.map(l => (
                  <td key={l.id} className="px-4 py-3 min-w-[180px]">
                    {l.score != null ? <ScoreBar score={l.score} size="sm" /> : <span className="text-gray-400">—</span>}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(({ label, key }) => {
                const values = selected.map(l => key(l))
                const isNumeric = values.some(v => /^S\$/.test(v) || /^\d/.test(v))
                const nums = isNumeric
                  ? values.map(v => parseFloat(v.replace(/[^0-9.]/g, '')))
                  : null
                const best = nums ? Math.max(...nums.filter(Boolean)) : null

                return (
                  <tr key={label} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 font-medium">{label}</td>
                    {selected.map((l, i) => {
                      const val = key(l)
                      const isBest = nums && best !== null && nums[i] === best && nums.filter(n => n === best).length === 1
                      return (
                        <td key={l.id} className={`px-4 py-3 text-sm font-medium ${isBest ? 'text-emerald-600' : 'text-gray-800'}`}>
                          {val}
                          {isBest && <span className="ml-1 text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">best</span>}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Picker modal */}
      {picker && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setPicker(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Pick a listing</h3>
            </div>
            {available.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">All listings already added.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {available.map(l => (
                  <button
                    key={l.id}
                    onClick={() => addToCompare(l)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">{l.project_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      D{l.district} · {l.asking_price ? `S$${(l.asking_price/1_000_000).toFixed(2)}M` : 'TBC'}
                      {l.score != null && ` · Score ${l.score}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
