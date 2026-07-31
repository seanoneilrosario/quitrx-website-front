export default function SuspenseFallback() {
  return (
    <div className="suspense-wrapper">
      <div className="skeleton-header" />

      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-img" />
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line small" />
          </div>
        ))}
      </div>
    </div>
  );
}