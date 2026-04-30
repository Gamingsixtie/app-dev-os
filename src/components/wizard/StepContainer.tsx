import type { ReactNode } from 'react';

interface StepContainerProps {
  title: string;
  children: ReactNode;
}

export default function StepContainer({ title, children }: StepContainerProps) {
  return (
    <div className="mt-6">
      <h2 className="text-[20px] font-semibold leading-[1.3] text-cito-primary mb-6">
        {title}
      </h2>
      {children}
    </div>
  );
}
