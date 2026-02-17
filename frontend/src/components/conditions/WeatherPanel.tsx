import type { Weather } from '../../types/f1';

interface WeatherPanelProps {
  weather: Weather | null;
}

export function WeatherPanel({ weather }: WeatherPanelProps) {
  if (!weather) {
    return (
      <div className="bg-f1-surface rounded-lg p-4 border border-f1-border">
        <div className="text-f1-text-muted text-sm">No weather data available</div>
      </div>
    );
  }

  return (
    <div className="bg-f1-surface rounded-lg p-4 border border-f1-border">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider mb-3 font-[var(--font-display)]">
        Weather
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <WeatherItem label="Air Temp" value={`${weather.air_temperature}°C`} />
        <WeatherItem label="Track Temp" value={`${weather.track_temperature}°C`} />
        <WeatherItem label="Humidity" value={`${weather.humidity}%`} />
        <WeatherItem label="Wind" value={`${weather.wind_speed} km/h`} />
        <WeatherItem label="Wind Dir" value={`${weather.wind_direction}°`} />
        <WeatherItem
          label="Rain"
          value={weather.rainfall ? 'YES' : 'NO'}
          highlight={weather.rainfall}
        />
      </div>
    </div>
  );
}

function WeatherItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-f1-text-muted uppercase tracking-wider">{label}</div>
      <div className={`font-timing text-sm ${highlight ? 'text-f1-cyan glow-cyan' : 'text-f1-text'}`}>
        {value}
      </div>
    </div>
  );
}
