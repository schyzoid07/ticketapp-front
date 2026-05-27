'use client';

import { useEffect, useRef, useState } from 'react';
import type { DailyTokenUsage } from '@/lib/types';

interface Props {
  data: DailyTokenUsage[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function TokenBarChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-muted text-sm text-gray-400">
        No hay datos de tokens este mes
      </div>
    );
  }

  const CHART_HEIGHT = 200;
  const TOP_MARGIN = 16;
  const BOTTOM_MARGIN = 44;
  const LEFT_MARGIN = 48;
  const RIGHT_MARGIN = 16;
  const BAR_GAP = 3;

  const maxVal = Math.max(...data.map((d) => d.totalTokens), 1);
  const steps = 4;
  const stepVal = Math.ceil(maxVal / steps / 100) * 100 || 100;
  const maxStep = stepVal * steps;

  const barCount = data.length;
  const plotWidth = Math.max(200, containerWidth - LEFT_MARGIN - RIGHT_MARGIN - 16);
  const barWidth = Math.min(24, Math.max(4, (plotWidth - (barCount - 1) * BAR_GAP) / barCount));
  const svgWidth = barCount * (barWidth + BAR_GAP) + LEFT_MARGIN + RIGHT_MARGIN;

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${CHART_HEIGHT + TOP_MARGIN + BOTTOM_MARGIN}`}
        className="w-full min-w-[400px]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Consumo de tokens por día"
      >
        {Array.from({ length: steps + 1 }, (_, i) => {
          const val = stepVal * i;
          const y = TOP_MARGIN + CHART_HEIGHT - (val / maxStep) * CHART_HEIGHT;
          return (
            <g key={`y-${i}`}>
              <line
                x1={LEFT_MARGIN}
                y1={y}
                x2={svgWidth - RIGHT_MARGIN}
                y2={y}
                stroke="currentColor"
                className="text-gray-200"
                strokeWidth="1"
              />
              <text
                x={LEFT_MARGIN - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400 text-[10px]"
              >
                {formatNumber(val)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = maxStep > 0 ? (d.totalTokens / maxStep) * CHART_HEIGHT : 0;
          const x = LEFT_MARGIN + i * (barWidth + BAR_GAP);
          const y = TOP_MARGIN + CHART_HEIGHT - barH;

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 1)}
                rx="3"
                className="fill-amber-500 transition-all duration-300 hover:fill-orange-500"
              >
                <title>{`${d.date}: ${formatNumber(d.totalTokens)} tokens (${d.ticketCount} tickets)`}</title>
              </rect>
              {(i % Math.ceil(barCount / 12) === 0 || i === barCount - 1) && (
                <text
                  x={x + barWidth / 2}
                  y={TOP_MARGIN + CHART_HEIGHT + 14}
                  textAnchor="end"
                  transform={`rotate(-40, ${x + barWidth / 2}, ${TOP_MARGIN + CHART_HEIGHT + 14})`}
                  className="fill-gray-400 text-[9px]"
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}

        <line
          x1={LEFT_MARGIN}
          y1={TOP_MARGIN}
          x2={LEFT_MARGIN}
          y2={TOP_MARGIN + CHART_HEIGHT}
          stroke="currentColor"
          className="text-gray-300"
          strokeWidth="1"
        />
        <line
          x1={LEFT_MARGIN}
          y1={TOP_MARGIN + CHART_HEIGHT}
          x2={svgWidth - RIGHT_MARGIN}
          y2={TOP_MARGIN + CHART_HEIGHT}
          stroke="currentColor"
          className="text-gray-300"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
