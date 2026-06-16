'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LIKE_REASONS, DISLIKE_REASONS, type Decision, type RatingStage } from '@/lib/types'

interface Props {
  listingId: string
  stage: RatingStage
  current?: Decision | null
  onSaved?: () => void
}

export default function RatingButtons({ listingId, stage, current, onSaved }: Props) {
  const [decision, setDecision] = useState<Decision | null>(current ?? null)
  const [reasons, setReasons] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const reasonOptions = decision === 'like' ? LIKE_REASONS : decision === 'dislike' ? DISLIKE_REASONS : []

  function toggleReason(v: string) {
    setReasons(r => r.includes(v) ? r.filter(x => x !== v) : [...r, v])
  }

  async function save() {
    if (!decision) return
    setSaving(true)
    try {
      const { error } = await supabase.from('ratings').upsert({
        listing_id: listingId,
        decision,
        stage,
        reasons,
        notes: notes || null,
      }, { onConflict: 'listing_id,stage' })

      if (error) {
        console.error('Rating save error:', error)
        alert('Error saving rating: ' + error.message)
        setSaving(false)
        return
      }

      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch (e) {
      console.error('Exception saving rating:', e)
      alert('Exception: ' + String(e))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Decision buttons */}
      <div className="flex gap-2">
        {(['like', 'maybe', 'dislike'] as Decision[]).map(d => {
          const Icon = d === 'like' ? ThumbsUp : d === 'dislike' ? ThumbsDown : Minus
          const colors = {
            like:    decision === 'like'    ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-300',
            maybe:   decision === 'maybe'   ? 'bg-amber-400 text-white border-amber-400'    : 'border-gray-200 text-gray-600 hover:border-amber-300',
            dislike: decision === 'dislike' ? 'bg-red-500 text-white border-red-500'        : 'border-gray-200 text-gray-600 hover:border-red-300',
          }
          return (
            <button
              key={d}
              onClick={() => { setDecision(d); setReasons([]) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${colors[d]}`}
            >
              <Icon size={16} />
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          )
        })}
      </div>

      {/* Reason tags */}
      {decision && decision !== 'maybe' && (
        <div className="flex flex-wrap gap-1.5">
          {reasonOptions.map(r => (
            <button
              key={r.value}
              onClick={() => toggleReason(r.value)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                reasons.includes(r.value)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Optional note */}
      {decision && (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Quick note (optional)…"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      )}

      {decision && (
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Rating'}
        </button>
      )}
    </div>
  )
}
