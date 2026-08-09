'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function CoffeeButton() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Steam lines
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      // Steam wave 1
      ctx.moveTo(10, 16);
      ctx.bezierCurveTo(
        10 + Math.sin(time) * 2, 10, 
        10 - Math.sin(time) * 2, 6, 
        10 + Math.sin(time * 0.8) * 2, 2
      );
      
      // Steam wave 2
      ctx.moveTo(16, 14);
      ctx.bezierCurveTo(
        16 + Math.sin(time + 2) * 2, 9, 
        16 - Math.sin(time + 2) * 2, 4, 
        16 + Math.sin(time * 0.9 + 2) * 2, 0
      );

      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Link href="/community" className="p-2 text-slate-500 hover:bg-white/5 rounded-full hover:text-white transition-all relative flex items-center justify-center group">
      <canvas ref={canvasRef} width={25} height={18} className="absolute -top-[2px] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />
      <svg width="25" height="25" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 28 16 C 36 16 36 26 28 26" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 8 12 L 32 12 L 28 32 C 28 34 25 36 20 36 C 15 36 12 34 12 32 Z" fill="currentColor" />
        <ellipse cx="20" cy="12" rx="12" ry="4" fill="#3E2723" />
        <ellipse cx="20" cy="12" rx="10" ry="2.5" fill="#4E342E" />
      </svg>
    </Link>
  );
}
