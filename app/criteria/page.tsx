'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Criteria, Tenure } from '@/lib/types'
import { SG_DISTRICTS } from '@/lib/types'
import { CheckCircle2, Info } from 'lucide-react'

const DEFAULT: Criteria = {
  id: '', name: 'My Criteria',
  w_location: 0.25, w_price: 0.25, w_unit: 0.25, w_condition: 0.25,
  max_budget: 2_000_000, min_size_sqft: 700, min_floor: 3,
  preferred_districts: [10, 11, 15, 19, 20],
  preferred_tenure: ['freehold', '999yr'],
  max_psf: null, mrt_max_walk_min: 10,
  psf_benchmarks: {},
}

const TENURES: Tenure[] = ['freehold', '999yr', '99yr']

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-indigo-600">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="100" step="5"
        value={Math.round(value * 100)}
        onChange={e => onChange(Number(e.target.value) / 100)}
        className="w-full accent-indigo-600"
      />
    </div>
  )
}

export default function CriteriaPage() {
  const [form, setForm] = useState<Criteria>(DEFAULT)
  const [benchmarkInput, setBenchmarkInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('criteria').select('*').limit(1).maybeSingle()
    if (data) setForm(data)
  }, [])

  useEffect(() => { load() }, [load])

  const totalWeight = form.w_location + form.w_price + form.w_unit + form.w_condition
  const weightsOk = Math.abs(totalWeight - 1) < 0.01

  function toggleDistrict(d: number) {
    setForm(f => ({
      ...f,
      preferred_districts: f.preferred_districts.includes(d)
        ? f.preferred_districts.filter(x => x !== d)
        : [...f.preferred_districts, d],
    }))
  }

  function toggleTenure(t: Tenure) {
    setForm(f => ({
      ...f,
      preferred_tenure: f.preferred_tenure.includes(t)
        ? f.preferred_tenure.filter(x => x !== t)
        : [...f.preferred_tenure, t],
    }))
  }

  // Parse "D10:1800, D15:1500" into benchmarks
  function applyBenchmarks() {
    const parsed: Record<string, number> = {}
    benchmarkInput.split(',').forEach(pair => {
      const [district, psf] = pair.trim().split(':')
      const d = district?.replace(/\D/g, '')
      if (d && psf) parsed[d] = Number(psf.trim())
    })
    setForm(f => ({ ...f, psf_benchmarks: { ...f.psf_benchmarks, ...parsed } }))
    setBenchmarkInput('')
  }

  async function save() {
    if (!weightsOk) return
    setSaving(true)
    if (form.id) {
      await supabase.from('criteria').update({ ...form }).eq('id', form.id)
    } else {
      const { data } = await supabase.from('criteria').insert({ ...form }).select('id').single()
      if (data) setForm(f => ({ ...f, id: data.id }))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300'

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Criteria</h1>
        <p className="text-sm text-gray-500 mt-1">Set your preferences — these drive the scoring engine</p>
      </div>

      {/* Weights */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Score Weights</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${weightsOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            Total: {Math.round(totalWeight * 100)}%
          </span>
        </div>
        <WeightSlider label="Location & district" value={form.w_location} onChange={v => setForm(f => ({ ...f, w_location: v }))} />
        <WeightSlider label="Price & value"       value={form.w_price}    onChange={v => setForm(f => ({ ...f, w_price:    v }))} />
        <WeightSlider label="Unit attributes"     value={form.w_unit}     onChange={v => setForm(f => ({ ...f, w_unit:     v }))} />
        <WeightSlider label="Condition (post-viewing)" value={form.w_condition} onChange={v => setForm(f => ({ ...f, w_condition: v }))} />
        {!weightsOk && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <Info size={12} /> Weights must add up to 100%.
          </p>
        )}
      </div>

      {/* Hard filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Hard Filters</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Max budget (S$)</label>
            <input type="number" value={form.max_budget}
              onChange={e => setForm(f => ({ ...f, max_budget: Number(e.target.value) }))}
              className={`w-full ${inputCls}`} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min size (sqft)</label>
            <input type="number" value={form.min_size_sqft}
              onChange={e => setForm(f => ({ ...f, min_size_sqft: Number(e.target.value) }))}
              className={`w-full ${inputCls}`} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min floor</label>
            <input type="number" value={form.min_floor}
              onChange={e => setForm(f => ({ ...f, min_floor: Number(e.target.value) }))}
              className={`w-full ${inputCls}`} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Max PSF (optional)</label>
            <input type="number" value={form.max_psf ?? ''}
              onChange={e => setForm(f => ({ ...f, max_psf: e.target.value ? Number(e.target.value) : null }))}
              className={`w-full ${inputCls}`} />
          </div>
        </div>

        {/* Tenure */}
        <div>
          <label className="text-xs text-gray-500 block mb-2">Preferred tenure</label>
          <div className="flex gap-2">
            {TENURES.map(t => (
              <button key={t} onClick={() => toggleTenure(t)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.preferred_tenure.includes(t)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-600'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preferred districts */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Preferred Districts</h2>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
            <button key={d} onClick={() => toggleDistrict(d)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                form.preferred_districts.includes(d)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-500 hover:border-indigo-300'
              }`}>
              D{d}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          {form.preferred_districts.map(d => `D${d} ${SG_DISTRICTS[d]}`).join(' · ') || 'None selected'}
        </p>
      </div>

      {/* PSF benchmarks */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">PSF Benchmarks <span className="text-xs text-gray-400 font-normal">(for fair-value alerts)</span></h2>
        {Object.keys(form.psf_benchmarks).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(form.psf_benchmarks).map(([d, psf]) => (
              <span key={d} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                D{d}: S${psf}/psf
                <button onClick={() => setForm(f => {
                  const b = { ...f.psf_benchmarks }; delete b[d]; return { ...f, psf_benchmarks: b }
                })} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder='e.g. D10:1800, D15:1500'
            value={benchmarkInput}
            onChange={e => setBenchmarkInput(e.target.value)}
            className={`flex-1 ${inputCls}`}
          />
          <button onClick={applyBenchmarks}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 font-medium">
            Add
          </button>
        </div>
        <p className="text-xs text-gray-400">Format: D10:1800, D15:1500  (district: median PSF from URA REALIS)</p>
      </div>

      <button
        onClick={save}
        disabled={saving || saved || !weightsOk}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {saved ? <><CheckCircle2 size={18} /> Saved!</> : saving ? 'Saving…' : 'Save Criteria'}
      </button>
    </div>
  )
}
