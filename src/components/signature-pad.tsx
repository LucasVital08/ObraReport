"use client";

import React from "react";
import { Button } from "@/components/ui";
import { Eraser } from "lucide-react";

export function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const [empty, setEmpty] = React.useState(true);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = "#1c2128";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setEmpty(false);
  }
  function up() {
    drawing.current = false;
    if (!empty) onChange(canvasRef.current!.toDataURL("image/png"));
  }
  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange("");
  }

  return (
    <div>
      <div className="rounded-xl border-2 border-dashed border-border bg-surface relative">
        <canvas ref={canvasRef} className="w-full h-40 touch-none"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        {empty && <span className="absolute inset-0 flex items-center justify-center text-sm text-muted pointer-events-none">Assine aqui com o dedo ou mouse</span>}
      </div>
      <div className="flex justify-end mt-2">
        <Button size="sm" variant="ghost" onClick={clear}><Eraser size={14} /> Limpar</Button>
      </div>
    </div>
  );
}
