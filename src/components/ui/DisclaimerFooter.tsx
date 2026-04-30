interface DataSource {
  provider: string;
  label: string;
}

interface DisclaimerFooterProps {
  showDisclaimer?: boolean;
  dataSources?: DataSource[];
}

export function DisclaimerFooter({ showDisclaimer = true, dataSources }: DisclaimerFooterProps) {
  if (!showDisclaimer && (!dataSources || dataSources.length === 0)) return null;

  return (
    <div className="mt-8 space-y-2">
      {showDisclaimer && (
        <p className="text-sm text-neutral-500 italic">
          Alle getoonde publicatieprijzen zijn bovengrenzen. De werkelijke prijs kan lager zijn.
        </p>
      )}
      {dataSources && dataSources.length > 0 && (
        <div className="text-xs text-neutral-400">
          <p className="font-semibold text-neutral-500 mb-1">Databronnen</p>
          <ul className="space-y-0.5">
            {dataSources.map((ds, i) => (
              <li key={i}>
                <span className="font-medium">{ds.provider}:</span> {ds.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
