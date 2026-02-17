import type { ConnectionStatus as ConnectionStatusType } from '../../types/f1';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

const statusConfig = {
  connected: { label: 'LIVE', color: 'bg-f1-green', textColor: 'text-f1-green', pulse: true },
  connecting: { label: 'CONNECTING', color: 'bg-f1-yellow', textColor: 'text-f1-yellow', pulse: true },
  disconnected: { label: 'OFFLINE', color: 'bg-f1-red', textColor: 'text-f1-red', pulse: false },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'pulse-live' : ''}`} />
      <span className={`text-xs font-timing ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}
