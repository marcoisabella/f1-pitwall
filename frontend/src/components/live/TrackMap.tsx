import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CarPosition, Driver } from '../../types/f1';
import { getTeamColorFromHex } from '../../utils/teamColors';

interface TrackMapProps {
  carPositions: CarPosition[];
  circuitKey?: number;
  drivers: Driver[];
  sessionStatus?: 'live' | 'ended' | 'upcoming' | null;
  fullPage?: boolean;
}

interface CircuitData {
  x: number[];
  y: number[];
}

export function TrackMap({ carPositions, circuitKey, drivers, sessionStatus, fullPage }: TrackMapProps) {
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!circuitKey) return;
    fetch(`/api/track/${circuitKey}`)
      .then(r => r.json())
      .then(data => { if (data.data) setCircuit(data.data); })
      .catch(() => {});
  }, [circuitKey]);

  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExpanded]);

  const driverMap = useMemo(
    () => new Map(drivers.map(d => [d.driver_number, d])),
    [drivers],
  );

  const bounds = useMemo(() => {
    const xs = [...(circuit?.x ?? []), ...carPositions.map(p => p.x)];
    const ys = [...(circuit?.y ?? []), ...carPositions.map(p => p.y)];
    if (xs.length === 0) return null;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY);
    const pad = span * 0.08;
    return {
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
      offX: minX - pad,
      offY: minY - pad,
      scale: span / 400, // 1 unit in "design space" = this many SVG units
    };
  }, [circuit, carPositions]);

  const toSvg = useCallback(
    (x: number, y: number) =>
      bounds ? { x: x - bounds.offX, y: y - bounds.offY } : { x: 0, y: 0 },
    [bounds],
  );

  if (!circuit && carPositions.length === 0) {
    return (
      <div className={fullPage ? 'h-full flex flex-col items-center justify-center gap-2' : 'bg-f1-surface rounded-lg border border-f1-border p-4 flex flex-col items-center justify-center h-52 gap-2'}>
        <div className="w-8 h-8 rounded-full border-2 border-f1-border border-t-f1-cyan animate-spin" />
        <span className="text-f1-text-muted text-xs font-[var(--font-display)]">
          Waiting for track data...
        </span>
      </div>
    );
  }

  if (!bounds) return null;

  // Scale factor: all sizes in "design units" get multiplied by this
  const s = bounds.scale;
  const leaderNum = drivers.find(d => d.position === 1)?.driver_number;

  const statusColor = sessionStatus === 'ended' ? 'bg-gray-500' : 'bg-f1-green';

  const containerClass = fullPage
    ? 'h-full flex flex-col'
    : isExpanded
      ? 'fixed inset-0 z-50 bg-f1-bg/95 backdrop-blur-md flex flex-col p-6'
      : 'bg-f1-surface rounded-lg border border-f1-border relative group';

  const circuitPts = circuit
    ? circuit.x.map((x, i) => {
        const p = toSvg(x, circuit.y[i]);
        return `${p.x},${p.y}`;
      }).join(' ')
    : '';

  const sortedPositions = [...carPositions].sort((a, b) => {
    const aW = a.driver_number === selectedDriver ? 2 : a.driver_number === leaderNum ? 1 : 0;
    const bW = b.driver_number === selectedDriver ? 2 : b.driver_number === leaderNum ? 1 : 0;
    return aW - bW;
  });

  const selectedData = selectedDriver ? driverMap.get(selectedDriver) : null;

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h3 className="text-[10px] font-semibold text-f1-text-muted uppercase tracking-widest font-[var(--font-display)] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {sessionStatus !== 'ended' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-green opacity-60" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`} />
          </span>
          Track Map
        </h3>
        <div className="flex items-center gap-2">
          {carPositions.length > 0 && (
            <span className="text-[9px] text-f1-text-muted font-timing">{carPositions.length} cars</span>
          )}
          {!fullPage && <button
            onClick={() => setIsExpanded(v => !v)}
            className="text-f1-text-muted hover:text-f1-cyan transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
            style={isExpanded ? { opacity: 1 } : undefined}
            title={isExpanded ? 'Minimize (Esc)' : 'Expand'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isExpanded
                ? <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              }
            </svg>
          </button>}
        </div>
      </div>

      {/* SVG + optional driver list */}
      <div className={isExpanded ? 'flex-1 min-h-0 flex flex-row' : 'px-2 pb-2'}>
        <div className={isExpanded ? 'flex-1 min-h-0 flex items-center justify-center' : ''}>
        <svg
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          className="w-full h-auto"
          style={{ maxHeight: fullPage ? 'none' : isExpanded ? 'calc(100vh - 10rem)' : '380px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Circuit outline */}
          {circuit && circuitPts && (
            <>
              <polyline
                points={circuitPts}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={s * 12}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.06"
              />
              <polyline
                points={circuitPts}
                fill="none"
                stroke="#2a2a40"
                strokeWidth={s * 8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={circuitPts}
                fill="none"
                stroke="#4a4a62"
                strokeWidth={s * 1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Start/finish */}
          {circuit && circuit.x.length > 2 && (() => {
            const sf = toSvg(circuit.x[0], circuit.y[0]);
            return (
              <line
                x1={sf.x - s * 6} y1={sf.y}
                x2={sf.x + s * 6} y2={sf.y}
                stroke="#E10600" strokeWidth={s * 2} opacity="0.8"
              />
            );
          })()}

          {/* Car positions */}
          {sortedPositions.map(pos => {
            const d = driverMap.get(pos.driver_number);
            const color = d ? getTeamColorFromHex(d.team_colour) : '#666';
            const svgP = toSvg(pos.x, pos.y);
            const isLeader = pos.driver_number === leaderNum;
            const isSel = pos.driver_number === selectedDriver;

            const dotR = isSel ? s * 5 : isLeader ? s * 4 : s * 3;
            const glowR = dotR * 2.5;

            return (
              <g
                key={pos.driver_number}
                style={{
                  transform: `translate(${svgP.x}px, ${svgP.y}px)`,
                  transition: 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
                opacity={sessionStatus === 'ended' ? 0.3 : (d?.in_pit ? 0.3 : 1)}
                onClick={() => setSelectedDriver(selectedDriver === pos.driver_number ? null : pos.driver_number)}
                className="cursor-pointer"
              >
                {/* Glow */}
                <circle cx={0} cy={0} r={glowR} fill={color} opacity={isSel ? 0.2 : 0.08} />

                {/* Dot */}
                <circle
                  cx={0} cy={0} r={dotR}
                  fill={color}
                  stroke={isSel ? '#fff' : isLeader ? '#fff' : d?.has_fastest_lap ? '#A855F7' : 'none'}
                  strokeWidth={isSel || isLeader || d?.has_fastest_lap ? s * 0.8 : 0}
                />

                {/* Label */}
                <text
                  x={0} y={-dotR - s * 2}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={s * 5}
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                  opacity={0.9}
                  style={{ pointerEvents: 'none' }}
                >
                  {d?.name_acronym ?? ''}
                </text>

                {/* Position number */}
                {d?.position && (
                  <text
                    x={0} y={dotR + s * 4}
                    textAnchor="middle" fill="#fff"
                    fontSize={s * 3.5} fontFamily="var(--font-mono)"
                    fontWeight="600" opacity={0.6}
                    style={{ pointerEvents: 'none' }}
                  >
                    P{d.position}
                  </text>
                )}
              </g>
            );
          })}

          {/* Session ended overlay */}
          {sessionStatus === 'ended' && (
            <g>
              <rect x={0} y={0} width={bounds.width} height={bounds.height} fill="#0F0F13" opacity={0.6} />
              <text
                x={bounds.width / 2} y={bounds.height / 2}
                textAnchor="middle" fill="#6B7280"
                fontSize={s * 12} fontFamily="var(--font-display)" fontWeight="700"
              >
                SESSION ENDED
              </text>
            </g>
          )}
        </svg>
        </div>

        {/* Expanded view driver list */}
        {isExpanded && (
          <div className="w-56 flex-shrink-0 overflow-auto border-l border-f1-border bg-f1-surface/80">
            {[...drivers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map(d => (
              <button
                key={d.driver_number}
                onClick={() => setSelectedDriver(d.driver_number === selectedDriver ? null : d.driver_number)}
                className={`w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-f1-elevated/50 ${
                  d.driver_number === selectedDriver ? 'bg-f1-elevated' : ''
                }`}
              >
                <span className="font-timing w-5">{d.position ?? '\u2014'}</span>
                <span className="w-1.5 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getTeamColorFromHex(d.team_colour) }} />
                <span className="font-bold font-[var(--font-display)] text-[11px]">{d.name_acronym}</span>
                <span className="ml-auto font-timing text-f1-text-muted text-[10px]">
                  {d.gap_to_leader ? `+${typeof d.gap_to_leader === 'number' ? d.gap_to_leader.toFixed(1) : d.gap_to_leader}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected driver card */}
      {selectedData && (
        <div className={`${isExpanded ? 'mx-auto max-w-md w-full' : ''} mx-2 mb-2 bg-f1-elevated/90 backdrop-blur rounded-lg border border-f1-border overflow-hidden`}>
          <div className="h-0.5" style={{ backgroundColor: getTeamColorFromHex(selectedData.team_colour) }} />
          <div className="p-2.5 flex items-center gap-3">
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: getTeamColorFromHex(selectedData.team_colour) }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-f1-text font-[var(--font-display)]">{selectedData.name_acronym}</span>
                <span className="text-[10px] text-f1-text-muted truncate">{selectedData.full_name}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {selectedData.position != null && <span className="font-timing text-xs font-bold text-f1-text">P{selectedData.position}</span>}
                {selectedData.gap_to_leader != null && selectedData.position !== 1 && (
                  <span className="font-timing text-[10px] text-f1-text-muted">
                    {typeof selectedData.gap_to_leader === 'number' ? `+${selectedData.gap_to_leader.toFixed(3)}s` : selectedData.gap_to_leader}
                  </span>
                )}
                {selectedData.compound && (
                  <span className={`text-[10px] font-bold ${
                    selectedData.compound === 'SOFT' ? 'text-tire-soft'
                    : selectedData.compound === 'MEDIUM' ? 'text-tire-medium'
                    : selectedData.compound === 'HARD' ? 'text-tire-hard'
                    : 'text-f1-text-muted'
                  }`}>
                    {selectedData.compound}
                    {selectedData.tire_age != null && <span className="text-f1-text-muted font-normal ml-0.5">L{selectedData.tire_age}</span>}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedDriver(null)} className="text-f1-text-muted hover:text-f1-text transition-colors p-1 flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {circuit && carPositions.length === 0 && (
        <div className="px-3 pb-2">
          <span className="text-[9px] text-f1-text-muted">Circuit loaded — waiting for car positions...</span>
        </div>
      )}
    </div>
  );
}
