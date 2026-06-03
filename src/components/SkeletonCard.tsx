export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line skeleton-line-sm" />
      <div className="skeleton-line skeleton-line-md" />
      <div className="skeleton-actions">
        <div className="skeleton-btn" />
        <div className="skeleton-btn" />
        <div className="skeleton-btn" />
      </div>
    </div>
  );
}
