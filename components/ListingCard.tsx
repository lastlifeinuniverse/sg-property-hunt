'use client'

import Link from 'next/link'
import { ThumbsUp, ThumbsDown, Minus, Eye, ExternalLink, MapPin, BedDouble, Maximize2, Building2 } from 'lucide-react'
import ScoreBar from './ScoreBar'
import type { Listing } from '@/lib/types'
import { SG_DISTRICTS } from '@/lib/types'

interface Props {
  listing: Listing
}

const decisionIcon = {
  like:    <ThumbsUp    size={14} className="text-emerald-600" />,
  dislike: <ThumbsDown  size={14} className="text-red-500"     />,
  maybe:   <Minus       size={14} className="text-amber-500"   />,
}

const statusColors: Record<string, string> = {
  active:      'bg-gray-100 text-gray-600',
  viewing:     'bg-blue-100 text-blue-700',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  passed:      'bg-red-100 text-red-600',
  transacted:  'bg-purple-100 text-purple-700',
}

export default function ListingCard({ listing }: Props) {
  const score = listing.score ?? null
  const rating = listing.latest_rating
  const hasNotes = !!listing.viewing_note

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2 gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{listing.project_name}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={11} />
            D{listing.district} · {SG_DISTRICTS[listing.district] ?? listing.area ?? '—'}
          </p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[listing.status] ?? statusColors.active}`}>
          {listing.status}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 px-4 py-2 text-sm text-gray-700 border-t border-gray-50">
        {listing.bedrooms != null && (
          <span className="flex items-center gap-1">
            <BedDouble size={13} className="text-gray-400" />
            {listing.bedrooms}BR
          </span>
        )}
        {listing.unit_size_sqft && (
          <span className="flex items-center gap-1">
            <Maximize2 size={13} className="text-gray-400" />
            {listing.unit_size_sqft.toLocaleString()} sqft
          </span>
        )}
        {listing.floor_level && (
          <span className="flex items-center gap-1">
            <Building2 size={13} className="text-gray-400" />
            Fl {listing.floor_level}
          </span>
        )}
        {listing.facing && (
          <span className="text-gray-500">{listing.facing}-facing</span>
        )}
      </div>

      {/* Price row */}
      <div className="flex items-baseline gap-3 px-4 pb-2">
        {listing.asking_price ? (
          <>
            <span className="font-bold text-gray-900">
              S${(listing.asking_price / 1_000_000).toFixed(2)}M
            </span>
            {listing.psf && (
              <span className="text-xs text-gray-400">S${listing.psf.toLocaleString()}/psf</span>
            )}
          </>
        ) : (
          <span className="text-sm text-gray-400">Price TBC</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">{listing.tenure}</span>
      </div>

      {/* Score */}
      {score !== null && (
        <div className="px-4 pb-3">
          <ScoreBar score={score} size="sm" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-t border-gray-100">
        {rating && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            {decisionIcon[rating.decision]}
            {rating.stage === 'post_viewing' ? 'Post-view' : 'Pre-view'}
          </span>
        )}
        {hasNotes && (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <Eye size={12} /> Visited
          </span>
        )}

        <div className="ml-auto flex gap-2">
          {listing.listing_url && (
            <a
              href={listing.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={12} /> Listing
            </a>
          )}
          <Link
            href={`/listings/${listing.id}`}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  )
}
