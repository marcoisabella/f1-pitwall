import { useCallback, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import type { ConnectionStatus, Driver, RaceControl, Session, Weather, WebSocketMessage } from '../types/f1';

interface UseLiveTimingReturn {
  drivers: Driver[];
  weather: Weather | null;
  raceControl: RaceControl[];
  sessionInfo: Session | null;
  connectionStatus: ConnectionStatus;
}

export function useLiveTiming(): UseLiveTimingReturn {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [raceControl, setRaceControl] = useState<RaceControl[]>([]);
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);

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
    connectionStatus,
  };
}
