import { useEffect, useRef } from "react";
import { seededRandom } from "../../engine/math";

interface Star {
  x: number;
  y: number;
  z: number;
  radius: number;
  phase: number;
  speed: number;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let raf = 0;
    let lastFrame = 0;

    const generate = () => {
      const random = seededRandom(20261113);
      const count = Math.min(220, Math.floor((width * height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: random() * width,
        y: random() * height,
        z: 0.25 + random() * 0.75,
        radius: 0.35 + random() * 1.15,
        phase: random() * Math.PI * 2,
        speed: 0.15 + random() * 0.5,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      generate();
    };

    const draw = (time: number) => {
      raf = window.requestAnimationFrame(draw);
      if (!reducedMotion && time - lastFrame < 40) return;
      lastFrame = time;
      context.clearRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = reducedMotion
          ? 0.55
          : 0.4 + 0.35 * Math.sin(time * 0.0004 * star.speed + star.phase);
        context.beginPath();
        context.arc(star.x, star.y, star.radius * star.z, 0, Math.PI * 2);
        context.fillStyle = `rgba(190, 225, 255, ${twinkle * star.z})`;
        context.fill();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas className="starfield" ref={canvasRef} aria-hidden="true" />;
}
