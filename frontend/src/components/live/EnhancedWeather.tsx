import type { Weather } from '../../types/f1';

interface EnhancedWeatherProps {
  weather: Weather | null;
}

function WindArrow({ direction }: { direction: number }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 inline-block" style={{ transform: `rotate(${direction}deg)` }}>
      <path d="M12 2l4 8H8l4-8z" fill="currentColor" />
      <rect x="11" y="10" width="2" height="12" fill="currentColor" />
    </svg>
  );
}

export function EnhancedWeather({ weather }: EnhancedWeatherProps) {
  if (!weather) {
    return (
      <div className="bg-f1-surface rounded-lg p-3 border border-f1-border">
        <div className="text-f1-text-muted text-sm">No weather data</div>
      </div>
    );
  }

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border p-3">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider mb-2 font-[var(--font-display)]">
        Weather
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <WeatherStat label="Air" value={`${weather.air_temperature}°C`} />
        <WeatherStat label="Track" value={`${weather.track_temperature}°C`} />
        <WeatherStat label="Humidity" value={`${weather.humidity}%`} />
        <div>
          <div className="text-[10px] text-f1-text-muted uppercase">Wind</div>
          <div className="font-timing text-xs text-f1-text flex items-center gap-1">
            {weather.wind_speed} km/h
            <WindArrow direction={weather.wind_direction} />
          </div>
        </div>
        <WeatherStat label="Pressure" value={`${weather.pressure} hPa`} />
        <div>
          <div className="text-[10px] text-f1-text-muted uppercase">Rain</div>
          <div className={`font-timing text-xs ${weather.rainfall ? 'text-f1-cyan' : 'text-f1-text-muted'}`}>
            {weather.rainfall ? (
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M8 1.5l4 7a4 4 0 1 1-8 0l4-7z" />
                </svg>
                YES
              </span>
            ) : 'DRY'}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-f1-text-muted uppercase">{label}</div>
      <div className="font-timing text-xs text-f1-text">{value}</div>
    </div>
  );
}
