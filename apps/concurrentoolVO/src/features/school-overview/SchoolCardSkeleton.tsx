export default function SchoolCardSkeleton() {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg p-6 min-h-[160px] animate-pulse"
      aria-hidden="true"
    >
      <div className="h-5 bg-neutral-200 rounded w-[60%] mb-4" />
      <div className="h-4 bg-neutral-200 rounded w-[80%] mb-3" />
      <div className="h-4 bg-neutral-200 rounded w-[40%]" />
    </div>
  );
}
