'use client';

/**
 * Single-series inline sparkline with gradient area fill and draw animation.
 * Follows Google Cloud Console stat-tile accents.
 */
import { useId } from 'react';
import { useTheme } from '@mui/material/styles';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({ data, width = 104, height = 32, color }: Props) {
  const theme = useTheme();
  const gradientId = useId();
  const stroke = color ?? theme.palette.primary.main;
  
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (data.length - 1);
  
  const pointCoords = data.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y] as [number, number];
  });

  const polylinePoints = pointCoords.map(([x, y]) => `${x},${y}`).join(' ');
  
  // Create closed polygon for area gradient fill
  const firstX = pointCoords[0][0];
  const lastX = pointCoords[pointCoords.length - 1][0];
  const areaPoints = `${firstX},${height} ${polylinePoints} ${lastX},${height}`;

  const lastPoint = pointCoords[pointCoords.length - 1];

  return (
    <svg width={width} height={height} aria-hidden="true" focusable="false" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Gradient Area Fill */}
      <polygon
        points={areaPoints}
        fill={`url(#${gradientId})`}
        style={{
          transition: 'opacity 300ms ease-in',
        }}
      />

      {/* Stroke Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 300,
          strokeDashoffset: 0,
          animation: 'sparkline-draw 600ms cubic-bezier(0.2, 0, 0, 1)',
        }}
      />

      {/* Terminal Dot */}
      <circle
        cx={lastPoint[0]}
        cy={lastPoint[1]}
        r={3}
        fill={stroke}
        style={{
          boxShadow: `0 0 4px ${stroke}`,
        }}
      />

      <style jsx>{`
        @keyframes sparkline-draw {
          0% { stroke-dashoffset: 300; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          polyline {
            animation: none !important;
          }
        }
      `}</style>
    </svg>
  );
}
