import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoricalData {
  scores?: { season: number; round: number; driver_number: number; points: number }[];
}

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

const F1_CYAN = '#22D3EE';
const F1_GREEN = '#00FF7F';
const F1_RED = '#E10600';
const F1_PURPLE = '#A855F7';
const F1_YELLOW = '#FDE047';

const TOOLTIP_STYLE = {
  background: '#1A1A23',
  border: '1px solid #2A2A35',
  borderRadius: 8,
  fontSize: 12,
};
const TOOLTIP_LABEL = { color: '#999' };

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function generateRankData() {
  const rounds = 24;
  let globalRank = 145_000;
  let friendsRank = 12;
  return Array.from({ length: rounds }, (_, i) => {
    globalRank += Math.round((Math.random() - 0.52) * 8000);
    globalRank = Math.max(1, globalRank);
    friendsRank += Math.round((Math.random() - 0.48) * 3);
    friendsRank = Math.max(1, Math.min(20, friendsRank));
    return { round: `R${i + 1}`, globalRank, friendsRank };
  });
}

function generateTransferImpactData() {
  return Array.from({ length: 24 }, (_, i) => {
    const impact = Math.round((Math.random() - 0.4) * 30);
    return { round: `R${i + 1}`, impact };
  });
}

function generatePointsByAsset() {
  const drivers = ['VER', 'NOR', 'HAM', 'LEC', 'PIA'];
  return drivers.map(d => ({
    name: d,
    race: Math.round(Math.random() * 120 + 40),
    qualifying: Math.round(Math.random() * 60 + 10),
    bonus: Math.round(Math.random() * 30),
  }));
}

function generatePointsByType() {
  return [
    { name: 'Race', points: 342 },
    { name: 'Qualifying', points: 156 },
    { name: 'Sprint', points: 88 },
    { name: 'Overtake', points: 64 },
    { name: 'Fastest Lap', points: 45 },
    { name: 'Streak', points: 38 },
    { name: 'Position', points: 120 },
  ];
}

function generatePositiveEvents() {
  return Array.from({ length: 24 }, (_, i) => ({
    round: `R${i + 1}`,
    impact: Math.round(Math.random() * 25),
  }));
}

function generateNegativeEvents() {
  return Array.from({ length: 24 }, (_, i) => ({
    round: `R${i + 1}`,
    impact: -Math.round(Math.random() * 15),
  }));
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function SampleDataBanner() {
  return (
    <p className="text-f1-text-muted text-xs italic mt-3">
      Sample Data — Connect your F1 Fantasy account for personalized stats.
    </p>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4 font-[var(--font-display)]">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Rank Progression
// ---------------------------------------------------------------------------

function RankProgression({ data }: { data: ReturnType<typeof generateRankData> }) {
  return (
    <SectionCard title="Rank Progression">
      <div className="flex items-center gap-6 mb-4">
        <span className="flex items-center gap-2 text-xs text-f1-text-muted">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: F1_CYAN }} /> Global Rank
        </span>
        <span className="flex items-center gap-2 text-xs text-f1-text-muted">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: F1_PURPLE }} /> Friends Rank
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" />
          <XAxis dataKey="round" stroke="#6B7280" tick={{ fontSize: 10 }} />
          <YAxis
            yAxisId="global"
            reversed
            stroke="#6B7280"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            label={{ value: 'Global Rank', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }}
          />
          <YAxis
            yAxisId="friends"
            orientation="right"
            reversed
            stroke="#6B7280"
            tick={{ fontSize: 10 }}
            domain={[1, 20]}
            label={{ value: 'Friends Rank', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#6B7280' } }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL}
            formatter={(value: number | undefined, name?: string) => [
              value != null ? (name === 'globalRank' ? value.toLocaleString() : value) : 0,
              name === 'globalRank' ? 'Global Rank' : 'Friends Rank',
            ]}
          />
          <Line yAxisId="global" type="monotone" dataKey="globalRank" stroke={F1_CYAN}
            strokeWidth={2} dot={false} />
          <Line yAxisId="friends" type="monotone" dataKey="friendsRank" stroke={F1_PURPLE}
            strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
      <SampleDataBanner />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Transfer Impact
// ---------------------------------------------------------------------------

function TransferImpact({ data }: { data: ReturnType<typeof generateTransferImpactData> }) {
  const totalPositive = data.reduce((s, d) => s + Math.max(0, d.impact), 0);
  const totalNegative = Math.abs(data.reduce((s, d) => s + Math.min(0, d.impact), 0));
  const netImpact = totalPositive - totalNegative;

  const donutData = [
    { name: 'Positive', value: totalPositive },
    { name: 'Negative', value: totalNegative },
  ];
  const donutColors = [F1_GREEN, F1_RED];

  const transfersUsed = data.filter(d => d.impact !== 0).length;
  const bestRound = data.reduce((best, d) => d.impact > best.impact ? d : best, data[0]);
  const worstRound = data.reduce((worst, d) => d.impact < worst.impact ? d : worst, data[0]);

  return (
    <SectionCard title="Transfer Impact">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="flex flex-col items-center">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                {donutData.map((_, i) => (
                  <Cell key={i} fill={donutColors[i]} />
                ))}
              </Pie>
              <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
                className="fill-white text-xl font-bold">
                {netImpact >= 0 ? '+' : ''}{netImpact}
              </text>
              <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central"
                className="fill-[#6B7280] text-[10px]">
                Transfer Balance
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-f1-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: F1_GREEN }} /> Positive ({totalPositive})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: F1_RED }} /> Negative ({totalNegative})
            </span>
          </div>
        </div>

        {/* Horizontal bar chart */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" horizontal={false} />
              <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="round" stroke="#6B7280" tick={{ fontSize: 9 }} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL}
                formatter={(value: number | undefined) => [value ?? 0, 'Impact']} />
              <Bar dataKey="impact">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.impact >= 0 ? F1_GREEN : F1_RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider mb-3">
          Transfer Impact Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Net Impact', value: `${netImpact >= 0 ? '+' : ''}${netImpact} pts`, color: netImpact >= 0 ? 'text-f1-green' : 'text-f1-red' },
            { label: 'Transfers Used', value: String(transfersUsed), color: 'text-f1-cyan' },
            { label: 'Best Round', value: `${bestRound.round} (+${bestRound.impact})`, color: 'text-f1-green' },
            { label: 'Worst Round', value: `${worstRound.round} (${worstRound.impact})`, color: 'text-f1-red' },
          ].map(stat => (
            <div key={stat.label} className="bg-f1-bg rounded-lg p-3 text-center">
              <p className="text-[10px] text-f1-text-muted uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-bold font-timing ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      <SampleDataBanner />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Point Distributions
// ---------------------------------------------------------------------------

function PointDistributions({
  byAsset,
  byType,
}: {
  byAsset: ReturnType<typeof generatePointsByAsset>;
  byType: ReturnType<typeof generatePointsByType>;
}) {
  const ASSET_COLORS = [F1_CYAN, F1_GREEN, F1_PURPLE];

  return (
    <SectionCard title="Point Distributions">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points by Asset */}
        <div>
          <h3 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider mb-3">
            Points by Asset
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAsset}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" />
              <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL}
                formatter={(value: number | undefined, name?: string) => [value ?? 0, name ?? '']} />
              <Bar dataKey="race" stackId="a" fill={ASSET_COLORS[0]} name="Race" radius={[0, 0, 0, 0]} />
              <Bar dataKey="qualifying" stackId="a" fill={ASSET_COLORS[1]} name="Qualifying" />
              <Bar dataKey="bonus" stackId="a" fill={ASSET_COLORS[2]} name="Bonus" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-f1-text-muted justify-center">
            {(['Race', 'Qualifying', 'Bonus'] as const).map((label, i) => (
              <span key={label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: ASSET_COLORS[i] }} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Points by Type */}
        <div>
          <h3 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider mb-3">
            Points by Season &amp; Type
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byType} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" horizontal={false} />
              <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} width={72} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL}
                formatter={(value: number | undefined) => [value ?? 0, 'Points']} />
              <Bar dataKey="points" fill={F1_CYAN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <SampleDataBanner />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Positive Events
// ---------------------------------------------------------------------------

function PositiveEvents({ data }: { data: ReturnType<typeof generatePositiveEvents> }) {
  const totalFL = Math.round(Math.random() * 8 + 2);
  const totalDOTD = Math.round(Math.random() * 6 + 1);
  const totalFP = Math.round(Math.random() * 10 + 3);
  const totalEvents = totalFL + totalDOTD + totalFP;

  const donutData = [
    { name: 'Fastest Lap', value: totalFL },
    { name: 'DOTD', value: totalDOTD },
    { name: 'Finishing Position', value: totalFP },
  ];
  const donutColors = [F1_CYAN, F1_YELLOW, F1_GREEN];

  return (
    <SectionCard title="Positive Events">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="flex flex-col items-center">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                {donutData.map((_, i) => (
                  <Cell key={i} fill={donutColors[i]} />
                ))}
              </Pie>
              <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
                className="fill-white text-xl font-bold">
                {totalEvents}
              </text>
              <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central"
                className="fill-[#6B7280] text-[10px]">
                Events Hit
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-f1-text-muted">
            {donutData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: donutColors[i] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" horizontal={false} />
              <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="round" stroke="#6B7280" tick={{ fontSize: 9 }} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL}
                formatter={(value: number | undefined) => [value ?? 0, 'Impact']} />
              <Bar dataKey="impact" fill={F1_GREEN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event breakdown */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider mb-3">
          Event Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {donutData.map((d, i) => (
            <div key={d.name} className="bg-f1-bg rounded-lg p-3 text-center">
              <p className="text-[10px] text-f1-text-muted uppercase tracking-wider">{d.name}</p>
              <p className="text-lg font-bold font-timing" style={{ color: donutColors[i] }}>{d.value}</p>
              <p className="text-[10px] text-f1-text-muted">
                +{d.value * (d.name === 'Fastest Lap' ? 10 : d.name === 'DOTD' ? 10 : 5)} pts
              </p>
            </div>
          ))}
        </div>
      </div>
      <SampleDataBanner />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Negative Events
// ---------------------------------------------------------------------------

function NegativeEvents({ data }: { data: ReturnType<typeof generateNegativeEvents> }) {
  const totalDNF = Math.round(Math.random() * 5 + 1);
  const totalDQ = Math.round(Math.random() * 2);
  const totalPenalty = Math.round(Math.random() * 4 + 1);
  const totalNeg = totalDNF + totalDQ + totalPenalty;

  const donutData = [
    { name: 'DNF', value: totalDNF },
    { name: 'DQ', value: totalDQ || 1 },
    { name: 'Penalty', value: totalPenalty },
  ];
  const donutColors = [F1_RED, '#FF6B6B', F1_YELLOW];

  return (
    <SectionCard title="Negative Events">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="flex flex-col items-center">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                {donutData.map((_, i) => (
                  <Cell key={i} fill={donutColors[i]} />
                ))}
              </Pie>
              <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
                className="fill-white text-xl font-bold">
                {totalNeg}
              </text>
              <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central"
                className="fill-[#6B7280] text-[10px]">
                Negative Events
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-f1-text-muted">
            {donutData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: donutColors[i] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" horizontal={false} />
              <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="round" stroke="#6B7280" tick={{ fontSize: 9 }} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL}
                formatter={(value: number | undefined) => [value ?? 0, 'Impact']} />
              <Bar dataKey="impact" fill={F1_RED} radius={[4, 0, 0, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider mb-3">
          Negative Event Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {donutData.map((d, i) => (
            <div key={d.name} className="bg-f1-bg rounded-lg p-3 text-center">
              <p className="text-[10px] text-f1-text-muted uppercase tracking-wider">{d.name}</p>
              <p className="text-lg font-bold font-timing" style={{ color: donutColors[i] }}>{d.value}</p>
              <p className="text-[10px] text-f1-text-muted">
                -{d.value * (d.name === 'DNF' ? 20 : d.name === 'DQ' ? 25 : 10)} pts
              </p>
            </div>
          ))}
        </div>
      </div>
      <SampleDataBanner />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function SeasonSummary() {
  const [_history, setHistory] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [season] = useState(2025);

  useEffect(() => {
    fetch(`/api/fantasy/historical/${season}`)
      .then(r => r.json())
      .then(setHistory)
      .catch(() => setHistory(null))
      .finally(() => setLoading(false));
  }, [season]);

  // Generate mock data once (stable across renders via useState initialiser)
  const [rankData] = useState(generateRankData);
  const [transferData] = useState(generateTransferImpactData);
  const [assetData] = useState(generatePointsByAsset);
  const [typeData] = useState(generatePointsByType);
  const [positiveData] = useState(generatePositiveEvents);
  const [negativeData] = useState(generateNegativeEvents);

  if (loading) return <LoadingTelemetry />;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Season Summary"
        subtitle="Get a personal summary of your F1 Fantasy season. See how your rank evolved, track your transfer impact and point distributions over the season."
      >
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-f1-elevated border border-f1-border text-sm font-bold text-f1-cyan font-timing">
            {season}
          </span>
        </div>
      </PageHeader>

      {/* 1. Rank Progression */}
      <RankProgression data={rankData} />

      {/* 2. Transfer Impact */}
      <TransferImpact data={transferData} />

      {/* 3. Point Distributions */}
      <PointDistributions byAsset={assetData} byType={typeData} />

      {/* 4. Positive Events */}
      <PositiveEvents data={positiveData} />

      {/* 5. Negative Events */}
      <NegativeEvents data={negativeData} />
    </div>
  );
}
