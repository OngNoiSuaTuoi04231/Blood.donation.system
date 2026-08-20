import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-slate-300 mb-4">{icon || <Inbox className="w-16 h-16" />}</div>
      <h3 className="text-lg font-semibold text-slate-600 mb-1">{title}</h3>
      {description && <p className="text-slate-400 text-sm mb-4 text-center max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
