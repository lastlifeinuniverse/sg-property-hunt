'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DEAL_BREAKERS } from '@/lib/types'
import type { ViewingNote } from '@/lib/types'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const SCORE_FIELDS = [
  { key: 'score_fixtures',     label: 'Fixtures & fittings' },
  { key: 'score_flooring',     label: 'Flooring condition'  },
  { key: 'score_kitchen',      label: 'Kitchen'             },
  { key: 'score_bathroom',     label: 'Bathroom(s)'         },
  { key: 'score_natural_light',label: 'Natural light'       },
  { key: 'score_noise',        label: 'Noise level'         },
  { key: 'score_facilities',   label: 'Facilities (pool/gym)'},
  { key: 'score_carpark',      label: 'Carpark'             },
] as const

type ScoreKey = typeof SCORE_FIELDS[number]['key']

type FormState = {
  viewed_at: string
  agent_asking: string
  scores: Record<ScoreKey, number | null>
  has_renovation: boolean
  reno_age_years: string
  deal_breakers: string[]
  notes_general: string
  notes_unit: string
  notes_building: string
  notes_area: string
}

function StarRating({ value, onChange, label }: { value: number | null; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              value != null && n <= value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-indigo-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ViewingNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    viewed_at: new Date().toISOString().slice(0, 10),
    agent_asking: '',
    scores: {
      score_fixtures: null, score_flooring: null, score_kitchen: null,
      score_bathroom: null, score_natural_light: null, score_noise: null,
      score_facilities: null, score_carpark: null,
    },
    has_renovation: false,
    reno_age_years: '',
    deal_breakers: [],
    notes_general: '',
    notes_unit: '',
    notes_building: '',
    notes_area: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [projectName, setProjectName] = useState('')

  const load = useCallback(async () => {
    const [{ data: listing }, { data: note }] = await Promise.all([
      supabase.from('listings').select('project_name').eq('id', id).maybeSingle(),
      supabase.from('viewing_notes').select('*').eq('listing_id', id).maybeSingle(),
    ])
    if (listing) setProjectName(listing.project_name)
    if (note) {
      const n = note as ViewingNote
      setForm({
        viewed_at: n.viewed_at ?? new Date().toISOString().slice(0, 10),
        agent_asking: n.agent_asking ? String(n.agent_asking) : '',
        scores: {
          score_fixtures:      n.score_fixtures,
          score_flooring:      n.score_flooring,
          score_kitchen:       n.score_kitchen,
          score_bathroom:      n.score_bathroom,
          score_natural_light: n.score_natural_light,
          score_noise:         n.score_noise,
          score_facilities:    n.score_facilities,
          score_carpark:       n.score_carpark,
        },
        has_renovation: n.has_renovation,
        reno_age_years: n.reno_age_years ? String(n.reno_age_years) : '',
        deal_breakers: n.deal_breakers ?? [],
        notes_general:  n.notes_general  ?? '',
        notes_unit:     n.notes_unit     ?? '',
        notes_building: n.notes_building ?? '',
        notes_area:     n.notes_area     ?? '',
      })
    }
  }, [id])

  useEffect(() => { load() }, [load])

  function toggleDealBreaker(v: string) {
    setForm(f => ({
      ...f,
      deal_breakers: f.deal_breakers.includes(v)
        ? f.deal_breakers.filter(x => x !== v)
        : [...f.deal_breakers, v],
    }))
  }

  async function save() {
    setSaving(true)
    await supabase.from('viewing_notes').upsert({
      listing_id:          id,
      viewed_at:           form.viewed_at || null,
      agent_asking:        form.agent_asking ? Number(form.agent_asking) : null,
      ...form.scores,
      has_renovation:      form.has_renovation,
      reno_age_years:      form.reno_age_years ? Number(form.reno_age_years) : null,
      deal_breakers:       form.deal_breakers,
      notes_general:       form.notes_general  || null,
      notes_unit:          form.notes_unit     || null,
      notes_building:      form.notes_building || null,
      notes_area:          form.notes_area     || null,
    }, { onConflict: 'listing_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => router.push(`/listings/${id}`), 1200)
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Viewing Notes</h1>
          {projectName && <p className="text-sm text-gray-500">{projectName}</p>}
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Visit Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date viewed</label>
            <input
              type="date"
              value={form.viewed_at}
              onChange={e => setForm(f => ({ ...f, viewed_at: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Agent asking (S$)</label>
            <input
              type="number"
              placeholder="e.g. 1850000"
              value={form.agent_asking}
              onChange={e => setForm(f => ({ ...f, agent_asking: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* Condition scores */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Condition Scores <span className="text-gray-400 font-normal">(1 = poor, 5 = excellent)</span></h2>
        {SCORE_FIELDS.map(({ key, label }) => (
          <StarRating
            key={key}
            label={label}
            value={form.scores[key]}
            onChange={v => setForm(f => ({ ...f, scores: { ...f.scores, [key]: v } }))}
          />
        ))}
      </div>

      {/* Renovation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Renovation</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.has_renovation}
            onChange={e => setForm(f => ({ ...f, has_renovation: e.target.checked }))}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-gray-700">Has existing renovation</span>
        </label>
        {form.has_renovation && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Renovation age (years ago)</label>
            <input
              type="number"
              min="0"
              value={form.reno_age_years}
              onChange={e => setForm(f => ({ ...f, reno_age_years: e.target.value }))}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}
      </div>

      {/* Deal breakers */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Deal Breakers Observed</h2>
        <div className="flex flex-wrap gap-2">
          {DEAL_BREAKERS.map(d => (
            <button
              key={d.value}
              onClick={() => toggleDealBreaker(d.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                form.deal_breakers.includes(d.value)
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-gray-200 text-gray-600 hover:border-red-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
        {([
          ['notes_general',  'General impression'],
          ['notes_unit',     'Unit specific (layout, views, smells…)'],
          ['notes_building', 'Building & facilities'],
          ['notes_area',     'Surrounding area (noise, amenities, access…)'],
        ] as const).map(([field, placeholder]) => (
          <div key={field}>
            <label className="text-xs text-gray-500 block mb-1">{placeholder}</label>
            <textarea
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={placeholder + '…'}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        ))}
      </div>

      {/* Save button — fixed on mobile */}
      <div className="fixed bottom-16 sm:bottom-6 inset-x-0 px-4 sm:relative sm:inset-auto sm:px-0">
        <button
          onClick={save}
          disabled={saving || saved}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg sm:shadow-none"
        >
          {saved ? (
            <><CheckCircle2 size={18} /> Saved! Redirecting…</>
          ) : saving ? 'Saving…' : 'Save Viewing Notes'}
        </button>
      </div>
    </div>
  )
}
