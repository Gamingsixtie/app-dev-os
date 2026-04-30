import AddSchoolButton from './AddSchoolButton';

export default function EmptySchoolState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-20 h-20 rounded-2xl bg-cito-primary/5 flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-cito-primary/40"
          aria-hidden="true"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 12 3 12 0v-5" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-neutral-800">
        Nog geen schoolprofielen
      </h2>
      <p className="mt-2 text-sm text-neutral-500 max-w-[340px] text-center leading-relaxed">
        Maak uw eerste schoolprofiel aan om prijsvergelijkingen op te slaan en uw
        pipeline te beheren.
      </p>
      <div className="mt-6">
        <AddSchoolButton />
      </div>
    </div>
  );
}
