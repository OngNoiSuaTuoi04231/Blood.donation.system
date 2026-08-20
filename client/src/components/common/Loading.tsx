import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ fullScreen = false, text = 'Đang tải...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
};

export default Loading;
