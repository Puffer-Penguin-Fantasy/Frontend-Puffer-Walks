import { useEffect, useRef } from "react";

interface FlickeringGridProps {
  /** Side length of each square in px */
  squareSize?: number;
  /** Gap between squares in px */
  gridGap?: number;
  /** Per-frame probability a square changes state (0–1) */
  flickerChance?: number;
  /** RGB string e.g. "251, 191, 36" */
  color?: string;
  /** Max opacity any square can reach */
  maxOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FlickeringGrid({
  squareSize = 3,
  gridGap = 5,
  flickerChance = 0.12,
  color = "251, 191, 36",
  maxOpacity = 0.45,
  className = "",
  style,
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef  = useRef<number>(0);
  const gridRef  = useRef<{ opacities: Float32Array; cols: number; rows: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const cols = Math.ceil(rect.width  / (squareSize + gridGap));
      const rows = Math.ceil(rect.height / (squareSize + gridGap));
      const opacities = new Float32Array(cols * rows);

      // Seed with random initial states
      for (let i = 0; i < opacities.length; i++) {
        opacities[i] = Math.random() < 0.4 ? Math.random() * maxOpacity : 0;
      }
      gridRef.current = { opacities, cols, rows };
    };

    setup();

    // Re-setup if the element is resized
    const ro = new ResizeObserver(setup);
    ro.observe(canvas);

    const tick = () => {
      const grid = gridRef.current;
      const canvas = canvasRef.current;
      if (!grid || !canvas) return;

      const { opacities, cols } = grid;
      const rect = canvas.getBoundingClientRect();

      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = 0; i < opacities.length; i++) {
        // Each square independently decides whether to flicker
        if (Math.random() < flickerChance) {
          // Bias toward off so we get sparse sparkling, not a full bright grid
          opacities[i] = Math.random() < 0.45
            ? Math.random() * maxOpacity
            : 0;
        }

        if (opacities[i] <= 0.01) continue; // skip invisible squares

        const c = i % cols;
        const r = Math.floor(i / cols);
        ctx.fillStyle = `rgba(${color}, ${opacities[i]})`;
        ctx.fillRect(
          c * (squareSize + gridGap),
          r * (squareSize + gridGap),
          squareSize,
          squareSize
        );
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [squareSize, gridGap, flickerChance, color, maxOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}
