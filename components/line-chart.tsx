type LineChartProps = {
  id: string;
  values: number[];
  labels?: string[];
  labelEvery?: number;
  min?: number;
  max?: number;
  ticks?: number[];
  tickFormat?: (value: number) => string;
  stroke: string;
  fillTop: string;
  marker?: { index: number; label: string };
  className?: string;
};

const W = 760;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 46 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function LineChart({
  id,
  values,
  labels,
  labelEvery = 1,
  min = 0,
  max,
  ticks,
  tickFormat = (value) => String(value),
  stroke,
  fillTop,
  marker,
  className = "h-auto w-full",
}: LineChartProps) {
  const hi = max ?? Math.max(...values) * 1.1;
  const span = hi - min || 1;
  const y = (value: number) => PAD.top + (1 - (value - min) / span) * PLOT_H;
  const x = (index: number) => PAD.left + (index / Math.max(values.length - 1, 1)) * PLOT_W;

  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const linePath = smoothPath(points);
  const baseline = (PAD.top + PLOT_H).toFixed(2);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baseline} L ${points[0].x.toFixed(2)} ${baseline} Z`;

  const gridTicks =
    ticks ??
    Array.from({ length: 4 }, (_, i) => Math.round(min + ((hi - min) / 3) * i));

  const gradientId = `${id}-area-fill`;
  const markerPoint = marker ? points[marker.index] : undefined;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`${id} chart`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} stopOpacity="0.5" />
          <stop offset="65%" stopColor={fillTop} stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="#eef0f3"
            strokeWidth="1"
            strokeDasharray="4 7"
          />
          <text
            x={PAD.left - 12}
            y={y(tick) + 3.5}
            textAnchor="end"
            fontSize="11"
            fill="#98a2b3"
          >
            {tickFormat(tick)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />

      {marker && markerPoint ? (
        <>
          <line
            x1={markerPoint.x}
            x2={markerPoint.x}
            y1={PAD.top}
            y2={markerPoint.y}
            stroke="#c9ccd3"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle
            cx={markerPoint.x}
            cy={markerPoint.y}
            r="3.5"
            fill="#ffffff"
            stroke={stroke}
            strokeWidth="2"
          />
          <rect
            x={markerPoint.x - 25}
            y={markerPoint.y - 36}
            width="50"
            height="22"
            rx="6"
            fill="#101828"
          />
          <text
            x={markerPoint.x}
            y={markerPoint.y - 21}
            textAnchor="middle"
            fontSize="11"
            fill="#ffffff"
          >
            {marker.label}
          </text>
        </>
      ) : null}

      {labels
        ? labels.map((label, i) => (
            <text
              key={`${label}-${i}`}
              x={x(i * labelEvery)}
              y={H - 6}
              textAnchor="middle"
              fontSize="11"
              fill="#98a2b3"
            >
              {label}
            </text>
          ))
        : null}
    </svg>
  );
}
