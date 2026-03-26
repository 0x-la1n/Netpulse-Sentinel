import React from 'react';

export const Sparkline = ({ data, status }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (((val - min) / range) * (h * 0.8) + (h * 0.1));
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = status === 'UP' ? '#34d399' : '#f43f5e'; // emerald-400 or rose-400

  return (
    <svg viewBox="0 0 100 40" className="w-full h-10 preserve-3d" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
