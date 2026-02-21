'use client';

type Tab = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="border-b border-sand-200">
      <div className="flex w-full">
        {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            'flex flex-1 items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors min-w-0',
            'focus:outline-none',
            activeTab === tab.value
              ? 'border-b-2 border-ocean-500 text-ocean-600 -mb-px'
              : 'text-sand-500 hover:text-sand-700',
          ].join(' ')}
        >
          <span className="truncate">{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={[
                'inline-flex flex-shrink-0 items-center justify-center rounded-full px-1 sm:px-1.5 py-0.5 text-xs',
                activeTab === tab.value
                  ? 'bg-ocean-100 text-ocean-700'
                  : 'bg-sand-100 text-sand-600',
              ].join(' ')}
            >
              {tab.count}
            </span>
          )}
        </button>
        ))}
      </div>
    </div>
  );
}
