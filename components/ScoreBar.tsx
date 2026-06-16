import { scoreLabel } from '@/lib/scoring'

interface Props {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ScoreBar({ score, showLabel = true, size = 'md' }: Props) {
  const { label, color } = scoreLabel(score)

  const barColor =
    score >= 75 ? 'bg-emerald-500' :
    score >= 55 ? 'bg-blue-500' :
    score >= 40 ? 'bg-amber-400' :
                  'bg-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold tabular-nums ${color}`}>
          {score} · {label}
        </span>
      )}
    </div>
  )
}
