export function LoadingTelemetry() {
  return (
    <div className="flex items-center justify-center h-32 gap-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="telemetry-bar w-1 bg-f1-red/60 rounded-full"
          style={{
            height: '2rem',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
