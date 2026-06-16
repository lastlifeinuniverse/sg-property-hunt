'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SG_DISTRICTS } from '@/lib/types'
import type { Tenure, Facing } from '@/lib/types'
import { CheckCircle2 } from 'lucide-react'

type FormState = {
  project_name: string
  district: string
  area: string
  address: string
  floor_level: string
  unit_size_sqft: string
  bedrooms: string
  bathrooms: string
  facing: Facing | ''
  asking_price: string
  psf: string
  tenure: Tenure
  top_year: string
  listing_url: string
  days_on_market: string
  agent_name: string
  agent_contact: string
}

const INITIAL: FormState = {
  project_name: '', district: '', area: '', address: '',
  floor_level: '', unit_size_sqft: '', bedrooms: '', bathrooms: '',
  facing: '', asking_price: '', psf: '', tenure: 'freehold',
  top_year: '', listing_url: '', days_on_market: '',
  agent_name: '', agent_contact: '',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300'
const selectCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white'

export default function AddListing() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    // Auto-compute PSF when price and size are both present
    if ((field === 'asking_price' || field === 'unit_size_sqft')) {
      const price = field === 'asking_price' ? Number(value) : Number(form.asking_price)
      const size  = field === 'unit_size_sqft' ? Number(value) : Number(form.unit_size_sqft)
      if (price > 0 && size > 0) {
        setForm(f => ({ ...f, [field]: value, psf: (price / size).toFixed(0) }))
      }
    }
  }

  async function save() {
    if (!form.project_name || !form.district) {
      setError('Project name and district are required.')
      return
    }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('listings').insert({
      project_name:    form.project_name,
      district:        Number(form.district),
      area:            form.area || null,
      address:         form.address || null,
      floor_level:     form.floor_level ? Number(form.floor_level) : null,
      unit_size_sqft:  form.unit_size_sqft ? Number(form.unit_size_sqft) : null,
      bedrooms:        form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms:       form.bathrooms ? Number(form.bathrooms) : null,
      facing:          form.facing || null,
      asking_price:    form.asking_price ? Number(form.asking_price) : null,
      psf:             form.psf ? Number(form.psf) : null,
      tenure:          form.tenure,
      top_year:        form.top_year ? Number(form.top_year) : null,
      listing_url:     form.listing_url || null,
      days_on_market:  form.days_on_market ? Number(form.days_on_market) : null,
      agent_name:      form.agent_name || null,
      agent_contact:   form.agent_contact || null,
    }).select('id').single()

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => router.push(`/listings/${data.id}`), 1000)
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Listing</h1>
        <p className="text-sm text-gray-500 mt-1">Paste the details from the listing portal</p>
      </div>

      {/* Core info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Project & Location</h2>
        <Field label="Project name" required>
          <input type="text" placeholder="e.g. The Sail @ Marina Bay" value={form.project_name}
            onChange={e => set('project_name', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="District" required>
            <select value={form.district} onChange={e => set('district', e.target.value)} className={selectCls}>
              <option value="">Select…</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>D{d} · {SG_DISTRICTS[d]}</option>
              ))}
            </select>
          </Field>
          <Field label="Area / neighbourhood">
            <input type="text" placeholder="e.g. Marine Parade" value={form.area}
              onChange={e => set('area', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Address / block">
          <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
        </Field>
      </div>

      {/* Unit details */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Unit Details</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bedrooms">
            <input type="number" min="1" max="10" value={form.bedrooms}
              onChange={e => set('bedrooms', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bathrooms">
            <input type="number" min="1" max="10" value={form.bathrooms}
              onChange={e => set('bathrooms', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Floor level">
            <input type="number" min="1" value={form.floor_level}
              onChange={e => set('floor_level', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Size (sqft)">
            <input type="number" placeholder="e.g. 980" value={form.unit_size_sqft}
              onChange={e => set('unit_size_sqft', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Facing">
            <select value={form.facing} onChange={e => set('facing', e.target.value as Facing)} className={selectCls}>
              <option value="">Unknown</option>
              {['N','NE','E','SE','S','SW','W','NW'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tenure">
            <select value={form.tenure} onChange={e => set('tenure', e.target.value as Tenure)} className={selectCls}>
              <option value="freehold">Freehold</option>
              <option value="999yr">999-year</option>
              <option value="99yr">99-year</option>
            </select>
          </Field>
          <Field label="TOP year">
            <input type="number" placeholder="e.g. 2010" min="1990" max="2030" value={form.top_year}
              onChange={e => set('top_year', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Price */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Price</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Asking price (S$)">
            <input type="number" placeholder="e.g. 1850000" value={form.asking_price}
              onChange={e => set('asking_price', e.target.value)} className={inputCls} />
          </Field>
          <Field label="PSF (auto-computed)">
            <input type="number" placeholder="auto" value={form.psf}
              onChange={e => set('psf', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Days on market">
          <input type="number" min="0" value={form.days_on_market}
            onChange={e => set('days_on_market', e.target.value)} className={inputCls} />
        </Field>
      </div>

      {/* Listing & agent */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Listing & Agent</h2>
        <Field label="Listing URL">
          <input type="url" placeholder="https://www.propertyguru.com.sg/…" value={form.listing_url}
            onChange={e => set('listing_url', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Agent name">
            <input type="text" value={form.agent_name}
              onChange={e => set('agent_name', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Agent contact">
            <input type="text" value={form.agent_contact}
              onChange={e => set('agent_contact', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

      <button
        onClick={save}
        disabled={saving || saved}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {saved ? (
          <><CheckCircle2 size={18} /> Added! Opening listing…</>
        ) : saving ? 'Saving…' : 'Add Listing'}
      </button>
    </div>
  )
}
