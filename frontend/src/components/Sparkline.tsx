'use client';

/**
 * Single-series inline sparkline (SVG, no chart lib). One hue, 2px line,
 * no axes/legend — a stat-tile accent per the dataviz mark specs.
 */
import { useTheme } from '@mui/material/styles';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({ data, width = 96, height = 28, color }: Props) {
  const theme = useTheme();
  const stroke = color ?? theme.palette.primary.main;
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const step = (width - pad * 2) / (data.length - 1);
  const points = data
    .map((v, i) => `${pad + i * step},${pad + (height - pad * 2) * (1 - (v - min) / span)}`)
    .join(' ');
  const last = points.split(' ').at(-1)!.split(',').map(Number);

  return (
    <svg width={width} height={height} aria-hidden="true" focusable="false">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={last[0]} cy={last[1]} r={3} fill={stroke} />
    </svg>
  );
}
