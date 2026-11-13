import { ExternalLink } from "lucide-react";
import { DATASET } from "../../data/dataset";

interface FooterProps {
  onOpenData: () => void;
}

export function Footer({ onOpenData }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__mark" aria-hidden="true" />
          <span>
            <strong>TRADEOFF</strong>
            <small>Mission Design Lab · v{DATASET.version}</small>
          </span>
        </div>
        <p className="footer__note">
          An independent NASA Space Apps Challenge 2026 prototype. Inspired by the discipline
          reviews of NASA Goddard's Mission Design Lab. NASA marks belong to NASA.
        </p>
        <div className="footer__links">
          <button type="button" onClick={onOpenData}>
            Dataset status
          </button>
          <a
            href="https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/"
            target="_blank"
            rel="noreferrer"
          >
            MDL reference <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </footer>
  );
}
