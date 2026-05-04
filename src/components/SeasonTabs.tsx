import type { Season } from '../utils/getSeasonFromDate'
import { seasons } from '../utils/getSeasonFromDate'

type SeasonTabsProps = {
  activeSeason: Season
  counts: Record<Season, number>
  onChange: (season: Season) => void
}

function SeasonTabs({ activeSeason, counts, onChange }: SeasonTabsProps) {
  return (
    <div className="season-tabs" role="tablist" aria-label="Photo seasons">
      {seasons.map((season) => (
        <button
          key={season}
          type="button"
          role="tab"
          aria-selected={activeSeason === season}
          aria-pressed={activeSeason === season}
          className={activeSeason === season ? 'is-active' : ''}
          onClick={() => onChange(season)}
        >
          <span>{season}</span>
          <span>{counts[season]}</span>
        </button>
      ))}
    </div>
  )
}

export default SeasonTabs
