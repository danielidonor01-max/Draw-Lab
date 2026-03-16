import React from 'react';

interface IndicatorPanelProps {
  indicators: string[];
}

export const IndicatorPanel: React.FC<IndicatorPanelProps> = ({ indicators }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Key Draw Indicators
      </h3>
      <ul className="space-y-3">
        {indicators.length === 0 ? (
          <li className="text-sm text-gray-500 italic">No specific indicators found.</li>
        ) : (
          indicators.map((indicator, index) => (
            <li key={index} className="flex items-start text-sm">
              <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-gray-700 dark:text-gray-300">{indicator}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
