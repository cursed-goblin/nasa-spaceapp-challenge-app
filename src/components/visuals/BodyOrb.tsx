import type { CSSProperties } from "react";
import { BODIES } from "../../data/bodies";
import type { CelestialBody } from "../../data/types";

interface BodyOrbProps {
  body: CelestialBody;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

export function BodyOrb({ body, size = "md", ring = false, className = "" }: BodyOrbProps) {
  const info = BODIES[body];
  const style = {
    "--orb-color": info.color,
    "--orb-color-dim": `${info.color}55`,
  } as CSSProperties;

  return (
    <div
      className={`body-orb body-orb--${size} body-orb--${body} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      {ring ? <div className="body-orb__ring" /> : null}
      <div className="body-orb__glow" />
      <div className="body-orb__sphere">
        <div className="body-orb__surface" />
        <div className="body-orb__shade" />
        {body === "moon" ? (
          <div className="body-orb__craters">
            <i />
            <i />
            <i />
            <i />
          </div>
        ) : null}
        {body === "mars" ? <div className="body-orb__cap" /> : null}
        {body === "europa" ? (
          <div className="body-orb__rifts">
            <i />
            <i />
            <i />
          </div>
        ) : null}
        {body === "venus" ? <div className="body-orb__clouds" /> : null}
        {body === "earth" ? <div className="body-orb__continents" /> : null}
      </div>
      {ring ? <div className="body-orb__orbit" /> : null}
    </div>
  );
}
