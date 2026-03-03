import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CarPosition, Driver } from '../../types/f1';
import { getTeamColorFromHex } from '../../utils/teamColors';

interface TrackMapProps {
  carPositions: CarPosition[];
  circuitKey?: number;
  drivers: Driver[];
}

interface CircuitData {
  x: number[];
  y: number[];
}

export function TrackMap({ carPositions, circuitKey, drivers }: TrackMapProps) {
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch circuit outline
  useEffect(() => {
    if (!circuitKey) return;
    fetch(`/api/track/${circuitKey}`)
      .then(r => r.json())
      .then(data => { if (data.data) setCircuit(data.data); })
      .catch(() => {});
  }, [circuitKey]);

  // Close expanded on Escape
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExpanded]);

  // Driver lookup map
  const driverMap = useMemo(
    () => new Map(drivers.map(d => [d.driver_number, d])),
    [drivers],
  );

  // Calculate SVG viewBox bounds from circuit + car positions
  const bounds = useMemo(() => {
    const xs = [...(circuit?.x ?? []), ...carPositions.map(p => p.x)];
    const ys = [...(circuit?.y ?? []), ...carPositions.map(p => p.y)];
    if (xs.length === 0) return null;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 50;
    return {
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
      offX: minX - pad,
      offY: minY - pad,
    };
  }, [circuit, carPositions]);

  const toSvg = useCallback(
    (x: number, y: number) =>
      bounds ? { x: x - bounds.offX, y: y - bounds.offY } : { x: 0, y: 0 },
    [bounds],
  );

  // Empty state
  if (!circuit && carPositions.length === 0) {
    return (
      <div className="bg-f1-surface rounded-lg border border-f1-border p-4 flex flex-col items-center justify-center h-52 gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-f1-border border-t-f1-cyan animate-spin" />
        <span className="text-f1-text-muted text-xs font-[var(--font-display)]">
          Waiting for track data...
        </span>
      </div>
    );
  }

  if (!bounds) return null;

  const leaderNum = drivers.find(d => d.position === 1)?.driver_number;

  // Circuit polyline string
  const circuitPts = circuit
    ? circuit.x
        .map((x, i) => {
          const p = toSvg(x, circuit.y[i]);
          return `${p.x},${p.y}`;
        })
        .join(' ')
    : '';

  // Sort car positions so selected/leader render on top (last in SVG = foreground)
  const sortedPositions = [...carPositions].sort((a, b) => {
    const aWeight =
      a.driver_number === selectedDriver ? 2 : a.driver_number === leaderNum ? 1 : 0;
    const bWeight =
      b.driver_number === selectedDriver ? 2 : b.driver_number === leaderNum ? 1 : 0;
    return aWeight - bWeight;
  });

  const selectedData = selectedDriver ? driverMap.get(selectedDriver) : null;

  return (
    <div
      className={
        isExpanded
          ? 'fixed inset-0 z-50 bg-f1-bg/95 backdrop-blur-md flex flex-col p-6'
          : 'bg-f1-surface rounded-lg border border-f1-border relative group'
      }
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h3 className="text-[10px] font-semibold text-f1-text-muted uppercase tracking-widest font-[var(--font-display)] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-green opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-f1-green" />
          </span>
          Track Map
        </h3>
        <div className="flex items-center gap-2">
          {carPositions.length > 0 && (
            <span className="text-[9px] text-f1-text-muted font-timing">
              {carPositions.length} cars
            </span>
          )}
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="text-f1-text-muted hover:text-f1-cyan transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
            style={isExpanded ? { opacity: 1 } : undefined}
            title={isExpanded ? 'Minimize (Esc)' : 'Expand'}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isExpanded ? (
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              ) : (
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <div className={isExpanded ? 'flex-1 min-h-0 flex items-center justify-center' : 'px-2 pb-2'}>
        <svg
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          className="w-full h-auto"
          style={{ maxHeight: isExpanded ? 'calc(100vh - 10rem)' : '380px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Track outline glow */}
            <filter id="tm-track-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>

            {/* Car dot glow */}
            <filter id="tm-car-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Intense glow for leader / selected */}
            <filter id="tm-leader-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Start/finish gradient marker */}
            <linearGradient id="tm-sf-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E10600" />
              <stop offset="100%" stopColor="#E10600" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ── Circuit outline layers ── */}
          {circuit && circuitPts && (
            <>
              {/* Outer glow (cyan tint) */}
              <polyline
                points={circuitPts}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.04"
                filter="url(#tm-track-glow)"
              />
              {/* Track surface (wide dark) */}
              <polyline
                points={circuitPts}
                fill="none"
                stroke="#1e1e30"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Track edge (thin bright) */}
              <polyline
                points={circuitPts}
                fill="none"
                stroke="#3a3a52"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* ── Start/Finish indicator ── */}
          {circuit && circuit.x.length > 2 && (() => {
            const sf = toSvg(circuit.x[0], circuit.y[0]);
            return (
              <g>
                <line
                  x1={sf.x - 8}
                  y1={sf.y}
                  x2={sf.x + 8}
                  y2={sf.y}
                  stroke="#E10600"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <rect
                  x={sf.x - 2}
                  y={sf.y - 2}
                  width="4"
                  height="4"
                  fill="#E10600"
                  opacity="0.6"
                />
              </g>
            );
          })()}

          {/* ── Car positions ── */}
          {sortedPositions.map(pos => {
            const d = driverMap.get(pos.driver_number);
            const color = d ? getTeamColorFromHex(d.team_colour) : '#666';
            const svgP = toSvg(pos.x, pos.y);
            const isLeader = pos.driver_number === leaderNum;
            const isSelected = pos.driver_number === selectedDriver;
            const position = d?.position;

            return (
              <g
                key={pos.driver_number}
                style={{
                  transform: `translate(${svgP.x}px, ${svgP.y}px)`,
                  transition: 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
                onClick={() =>
                  setSelectedDriver(
                    selectedDriver === pos.driver_number ? null : pos.driver_number,
                  )
                }
                className="cursor-pointer"
              >
                {/* Outer glow ring */}
                {isLeader && !isSelected && (
                  <circle
                    cx={0}
                    cy={0}
                    r={12}
                    fill={color}
                    opacity={0.2}
                    filter="url(#tm-leader-glow)"
                  >
                    <animate
                      attributeName="r"
                      values="10;15;10"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.25;0.08;0.25"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {isSelected && (
                  <circle
                    cx={0}
                    cy={0}
                    r={16}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity={0.6}
                    filter="url(#tm-leader-glow)"
                  >
                    <animate
                      attributeName="r"
                      values="14;18;14"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0.2;0.6"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Ambient glow */}
                <circle
                  cx={0}
                  cy={0}
                  r={isSelected ? 10 : 7}
                  fill={color}
                  opacity={isSelected ? 0.25 : 0.12}
                  filter="url(#tm-car-glow)"
                />

                {/* Core dot */}
                <circle
                  cx={0}
                  cy={0}
                  r={isSelected ? 5 : isLeader ? 4.5 : 3.5}
                  fill={color}
                  stroke={isSelected ? '#fff' : isLeader ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 1.5 : isLeader ? 0.8 : 0}
                />

                {/* Driver label (always visible) */}
                <text
                  x={0}
                  y={-9}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={isExpanded ? '7' : '6'}
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                  opacity={isSelected ? 1 : 0.85}
                  style={{ pointerEvents: 'none' }}
                >
                  {d?.name_acronym ?? ''}
                </text>

                {/* Position badge */}
                {position != null && (isExpanded || isSelected || isLeader) && (
                  <g>
                    <rect
                      x={-7}
                      y={5}
                      width={14}
                      height={9}
                      rx={2}
                      fill={isLeader ? '#E10600' : '#0F0F13'}
                      stroke={color}
                      strokeWidth={0.5}
                      opacity={0.9}
                    />
                    <text
                      x={0}
                      y={12}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="6"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      P{position}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Selected driver info card ── */}
      {selectedData && (
        <div
          className={`${
            isExpanded ? 'mx-auto max-w-md w-full' : ''
          } mx-2 mb-2 bg-f1-elevated/90 backdrop-blur rounded-lg border border-f1-border overflow-hidden`}
        >
          {/* Color accent bar */}
          <div
            className="h-0.5"
            style={{ backgroundColor: getTeamColorFromHex(selectedData.team_colour) }}
          />
          <div className="p-2.5 flex items-center gap-3">
            {/* Team color stripe */}
            <div
              className="w-1 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: getTeamColorFromHex(selectedData.team_colour) }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-f1-text font-[var(--font-display)]">
                  {selectedData.name_acronym}
                </span>
                <span className="text-[10px] text-f1-text-muted truncate">
                  {selectedData.full_name}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {selectedData.position != null && (
                  <span className="font-timing text-xs font-bold text-f1-text">
                    P{selectedData.position}
                  </span>
                )}
                {selectedData.gap_to_leader != null && selectedData.position !== 1 && (
                  <span className="font-timing text-[10px] text-f1-text-muted">
                    {typeof selectedData.gap_to_leader === 'number'
                      ? `+${selectedData.gap_to_leader.toFixed(3)}s`
                      : selectedData.gap_to_leader}
                  </span>
                )}
                {selectedData.interval != null && selectedData.position !== 1 && (
                  <span className="font-timing text-[10px] text-f1-yellow">
                    INT{' '}
                    {typeof selectedData.interval === 'number'
                      ? `+${selectedData.interval.toFixed(3)}`
                      : selectedData.interval}
                  </span>
                )}
                {selectedData.compound && (
                  <span
                    className={`text-[10px] font-bold ${
                      selectedData.compound === 'SOFT'
                        ? 'text-tire-soft'
                        : selectedData.compound === 'MEDIUM'
                          ? 'text-tire-medium'
                          : selectedData.compound === 'HARD'
                            ? 'text-tire-hard'
                            : selectedData.compound === 'INTERMEDIATE'
                              ? 'text-tire-inter'
                              : selectedData.compound === 'WET'
                                ? 'text-tire-wet'
                                : 'text-f1-text-muted'
                    }`}
                  >
                    {selectedData.compound}
                    {selectedData.tire_age != null && (
                      <span className="text-f1-text-muted font-normal ml-0.5">
                        L{selectedData.tire_age}
                      </span>
                    )}
                  </span>
                )}
                {selectedData.last_lap_time != null && (
                  <span className="font-timing text-[10px] text-f1-text-muted">
                    {selectedData.last_lap_time.toFixed(3)}
                  </span>
                )}
                {selectedData.has_fastest_lap && (
                  <span className="text-[9px] font-bold text-f1-purple">FL</span>
                )}
                {selectedData.is_dnf && (
                  <span className="text-[9px] font-bold text-f1-red bg-f1-red/10 rounded px-1">
                    DNF
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedDriver(null)}
              className="text-f1-text-muted hover:text-f1-text transition-colors p-1 flex-shrink-0"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Circuit-only / no-cars state */}
      {circuit && carPositions.length === 0 && (
        <div className="px-3 pb-2">
          <span className="text-[9px] text-f1-text-muted">
            Circuit loaded — waiting for car positions...
          </span>
        </div>
      )}
    </div>
  );
}
