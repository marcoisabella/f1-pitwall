import { useState, useEffect } from 'react';
import type { CarPosition } from '../../types/f1';
import { getTeamColorFromHex } from '../../utils/teamColors';

interface TrackMapProps {
  carPositions: CarPosition[];
  circuitKey?: number;
  drivers: { driver_number: number; name_acronym: string; team_colour: string }[];
}

interface CircuitData {
  x: number[];
  y: number[];
}

export function TrackMap({ carPositions, circuitKey, drivers }: TrackMapProps) {
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);

  useEffect(() => {
    if (!circuitKey) return;
    fetch(`/api/track/${circuitKey}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) setCircuit(data.data);
      })
      .catch(() => {});
  }, [circuitKey]);

  if (!circuit && carPositions.length === 0) {
    return (
      <div className="bg-f1-surface rounded-lg border border-f1-border p-4 flex items-center justify-center h-48">
        <span className="text-f1-text-muted text-sm">Track map unavailable</span>
      </div>
    );
  }

  // Calculate bounds from car positions or circuit data
  const allX = circuit ? circuit.x : carPositions.map(p => p.x);
  const allY = circuit ? circuit.y : carPositions.map(p => p.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const padding = 20;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border p-3">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider mb-2 font-[var(--font-display)]">
        Track Map
      </h3>
      <svg
        viewBox={`0 0 ${width || 400} ${height || 300}`}
        className="w-full h-auto"
        style={{ maxHeight: '250px' }}
      >
        {/* Circuit outline */}
        {circuit && circuit.x.length > 1 && (
          <polyline
            points={circuit.x.map((x, i) => `${x - minX + padding},${circuit.y[i] - minY + padding}`).join(' ')}
            fill="none"
            stroke="#333"
            strokeWidth="2"
          />
        )}

        {/* Car dots */}
        {carPositions.map(pos => {
          const d = driverMap.get(pos.driver_number);
          const color = d ? getTeamColorFromHex(d.team_colour) : '#666';
          const isHovered = hoveredDriver === pos.driver_number;
          return (
            <g key={pos.driver_number}>
              <circle
                cx={pos.x - minX + padding}
                cy={pos.y - minY + padding}
                r={isHovered ? 8 : 5}
                fill={color}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={isHovered ? 2 : 0}
                onMouseEnter={() => setHoveredDriver(pos.driver_number)}
                onMouseLeave={() => setHoveredDriver(null)}
                className="cursor-pointer transition-all"
              />
              {isHovered && d && (
                <text
                  x={pos.x - minX + padding}
                  y={pos.y - minY + padding - 12}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontFamily="var(--font-timing)"
                >
                  {d.name_acronym}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
