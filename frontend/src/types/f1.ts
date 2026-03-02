export interface Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string;
  position: number | null;
  gap_to_leader: number | string | null;
  interval: number | string | null;
  last_lap_time: number | null;
  sector_1_time: number | null;
  sector_2_time: number | null;
  sector_3_time: number | null;
  compound: string | null;
  tire_age: number | null;
  pit_stops: number;
  grid_position?: number | null;
  has_fastest_lap?: boolean;
  is_dnf?: boolean;
}

export interface FantasyScoreBreakdown {
  driver_number: number;
  racePoints: number;
  qualifyingPoints: number;
  positionsGainedLost: number;
  positionDelta: number;
  fastestLapBonus: number;
  dotdBonus: number;
  overtakePoints: number;
  sprintPoints: number;
  dnfPenalty: number;
  total: number;
}

export interface F1Player {
  driver_number?: number;
  constructor_id?: string;
  name: string;
  tla: string;
  team_name: string;
  team_color: string;
  price: number;
  old_price: number;
  price_change: number;
  selected_pct: number;
  captain_pct: number;
  gameday_points: number;
  overall_points: number;
  projected_points: number;
  type: 'driver' | 'constructor';
  status?: string;
  is_active: boolean;
}

export interface F1RoundStats {
  round: number;
  gp_name: string;
  country: string;
  country_code: string;
  points: Record<string, number>;
}

export interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  year: number;
}

export interface Weather {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: boolean;
  pressure: number;
}

export interface RaceControl {
  category: string;
  flag: string;
  message: string;
  date: string;
  driver_number?: number;
  lap_number?: number;
}

export interface CarPosition {
  driver_number: number;
  x: number;
  y: number;
}

export interface SectorBests {
  s1: number | null;
  s2: number | null;
  s3: number | null;
}

export interface LiveTimingState {
  session: Session | null;
  drivers: Driver[];
  race_control: RaceControl[];
  weather: Weather | null;
  car_positions?: CarPosition[];
  sector_bests?: SectorBests;
}

export interface WebSocketMessage {
  type: 'full_state' | 'update';
  data: LiveTimingState;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface Position {
  driver_number: number;
  position: number;
  date: string;
}

export interface LapData {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
}

export interface Interval {
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

export interface Stint {
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_pit_out: number;
  lap_start: number;
  lap_end: number | null;
}

export interface PitStop {
  driver_number: number;
  lap_number: number;
  pit_duration: number;
}

export interface CarData {
  driver_number: number;
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  drs: number;
}
