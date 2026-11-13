"use client";

import { useState, type MouseEvent } from "react";

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

const W = 760;
const H = 300;
const PAD = { top: 16, right: 62, bottom: 26, left: 10 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const money = (value: number) => `$${value.toFixed(2)}`;

function timeLabel(t: number, range: string, timeZone: string) {
  const date = new Date(t);
  if (range === "1d") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  });
}

export function CandleChart({
  candles,
  range,
  timeZone = "America/New_York",
  className = "h-auto w-full",
}: {
  candles: Candle[];
  range: string;
  timeZone?: string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const low = Math.min(...candles.map((candle) => candle.l));
  const high = Math.max(...candles.map((candle) => candle.h));
  const padding = (high - low) * 0.08 || 1;
  const min = low - padding;
  const max = high + padding;
  const span = max - min || 1;

  const y = (value: number) => PAD.top + (1 - (value - min) / span) * PLOT_H;
  const step = PLOT_W / Math.max(candles.length, 1);
  const x = (index: number) => PAD.left + step * (index + 0.5);
  const bodyWidth = Math.max(1.4, Math.min(10, step * 0.62));

  const ticks = Array.from({ length: 4 }, (_, index) => min + (span / 3) * index);
  const labelEvery = Math.max(1, Math.ceil(candles.length / 6));

  const last = candles[candles.length - 1];
  const lastUp = last.c >= last.o;
  const active = hover === null ? null : candles[hover];

  const move = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const index = Math.floor((px - PAD.left) / step);
    setHover(Math.min(candles.length - 1, Math.max(0, index)));
  };

  const tooltipX = active
    ? Math.min(
        Math.max(x(hover ?? 0) + 14, PAD.left),
        W - PAD.right - 128,
      )
    : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Candlestick chart, ${candles.length} bars`}
      onMouseMove={move}
      onMouseLeave={() => setHover(null)}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={PAD.left + PLOT_W}
            y1={y(tick)}
            y2={y(tick)}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray="4 6"
          />
          <text
            x={W - PAD.right + 8}
            y={y(tick) + 4}
            fill="var(--muted)"
            fontSize={11}
          >
            {money(tick)}
          </text>
        </g>
      ))}

      {candles.map((candle, index) => {
        const up = candle.c >= candle.o;
        const colour = up ? "var(--up)" : "var(--down)";
        const top = y(Math.max(candle.o, candle.c));
        const bottom = y(Math.min(candle.o, candle.c));
        const bodyHeight = Math.max(1, bottom - top);

        return (
          <g key={candle.t}>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={y(candle.h)}
              y2={y(candle.l)}
              stroke={colour}
              strokeWidth={1}
            />
            <rect
              x={x(index) - bodyWidth / 2}
              y={top}
              width={bodyWidth}
              height={bodyHeight}
              fill={colour}
              rx={0.5}
            />
          </g>
        );
      })}

      {candles.map((candle, index) =>
        index % labelEvery === 0 ? (
          <text
            key={`label-${candle.t}`}
            x={Math.min(Math.max(x(index), PAD.left + 22), PAD.left + PLOT_W - 22)}
            y={H - 6}
            fill="var(--faint)"
            fontSize={11}
            textAnchor="middle"
          >
            {timeLabel(candle.t, range, timeZone)}
          </text>
        ) : null,
      )}

      <line
        x1={PAD.left}
        x2={PAD.left + PLOT_W}
        y1={y(last.c)}
        y2={y(last.c)}
        stroke={lastUp ? "var(--up)" : "var(--down)"}
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.6}
      />
      <rect
        x={W - PAD.right + 2}
        y={y(last.c) - 9}
        width={PAD.right - 6}
        height={18}
        rx={4}
        fill={lastUp ? "var(--up-soft)" : "var(--down-soft)"}
      />
      <text
        x={W - PAD.right + 6}
        y={y(last.c) + 4}
        fill={lastUp ? "var(--up)" : "var(--down)"}
        fontSize={11}
        fontWeight={600}
      >
        {last.c.toFixed(2)}
      </text>

      {active && hover !== null ? (
        <g pointerEvents="none">
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="var(--faint)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          <rect
            x={tooltipX}
            y={PAD.top + 4}
            width={124}
            height={70}
            rx={8}
            fill="var(--ink)"
            opacity={0.94}
          />
          <text x={tooltipX + 10} y={PAD.top + 20} fill="var(--surface)" fontSize={11}>
            {timeLabel(active.t, range, timeZone)}
          </text>
          {(
            [
              ["O", active.o],
              ["H", active.h],
              ["L", active.l],
              ["C", active.c],
            ] as const
          ).map(([label, value], index) => (
            <text
              key={label}
              x={tooltipX + 10}
              y={PAD.top + 36 + index * 11}
              fill="var(--surface)"
              fontSize={10.5}
            >
              {label} {value.toFixed(2)}
            </text>
          ))}
        </g>
      ) : null}
    </svg>
  );
}
