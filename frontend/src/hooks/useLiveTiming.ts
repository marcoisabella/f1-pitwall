import { useCallback, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import type { CarPosition, ConnectionStatus, Driver, RaceControl, SectorBests, Session, Weather, WebSocketMessage } from '../types/f1';

interface UseLiveTimingReturn {
  drivers: Driver[];
  weather: Weather | null;
  raceControl: RaceControl[];
  sessionInfo: Session | null;
  carPositions: CarPosition[];
  sectorBests: SectorBests;
  connectionStatus: ConnectionStatus;
  sessionStatus: 'live' | 'ended' | 'upcoming' | null;
}

export function useLiveTiming(): UseLiveTimingReturn {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [raceControl, setRaceControl] = useState<RaceControl[]>([]);
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);
  const [carPositions, setCarPositions] = useState<CarPosition[]>([]);
  const [sectorBests, setSectorBests] = useState<SectorBests>({ s1: null, s2: null, s3: null });
  const [sessionStatus, setSessionStatus] = useState<'live' | 'ended' | 'upcoming' | null>(null);

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/timing`;

  const onMessage = useCallback((raw: unknown) => {
    const message = raw as WebSocketMessage;
    if (!message?.data) return;

    const { data } = message;

    if (message.type === 'full_state' || message.type === 'update') {
      if (data.drivers) {
        setDrivers(data.drivers);
      }
      if (data.weather) {
        setWeather(data.weather);
      }
      if (data.race_control) {
        setRaceControl(data.race_control);
      }
      if (data.session) {
        setSessionInfo(data.session);
      }
      if (data.car_positions) {
        setCarPositions(data.car_positions);
      }
      if (data.sector_bests) {
        setSectorBests(data.sector_bests);
      }
      if (data.session_status) {
        setSessionStatus(data.session_status);
      }
    }
  }, []);

  const { status: connectionStatus } = useWebSocket({
    url: wsUrl,
    onMessage,
  });

  return {
    drivers,
    weather,
    raceControl,
    sessionInfo,
    carPositions,
    sectorBests,
    connectionStatus,
    sessionStatus,
  };
}
