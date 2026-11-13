import { ExternalLink, Info, Terminal } from "lucide-react";
import { DATASET, DATA_STATUS_LABEL } from "../../data/dataset";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface DataStatusModalProps {
  open: boolean;
  onClose: () => void;
}

export function DataStatusModal({ open, onClose }: DataStatusModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Data provenance"
      title="Official resource integration"
      size="lg"
      footer={
        <Button variant="primary" onClick={onClose}>
          Understood
        </Button>
      }
    >
      <div className="data-status">
        <div className="data-status__banner">
          <span className="data-status__icon">
            <Info size={18} />
          </span>
          <div>
            <strong>{DATA_STATUS_LABEL}</strong>
            <p>{DATASET.summary}</p>
          </div>
          <Badge tone="amber" dot>
            NASA pack pending
          </Badge>
        </div>

        <div className="data-status__grid">
          <section>
            <h3>What is provisional</h3>
            <ul className="check-list check-list--plain">
              {DATASET.pendingSources.map((source) => (
                <li key={source}>
                  <span className="check-list__marker" aria-hidden="true" />
                  {source}
                </li>
              ))}
            </ul>
            <p className="data-status__note">
              Component masses, power draws, costs, orbit parameters and launch capacities are
              gameplay-balanced estimates. They are internally consistent but not
              flight-qualified and should not be used for real mission planning.
            </p>
          </section>

          <section>
            <h3>How the drop-in works</h3>
            <ol className="steps-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Drop the official pack</strong>
                  <p>
                    Place NASA resource files in <code>resources/incoming/</code>.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Record the mapping</strong>
                  <p>
                    Update <code>resources/manifest.json</code> with file names, source URLs and
                    the dataset fields they feed.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Validate and rebuild</strong>
                  <p>
                    Run <code>npm run data:check</code>, replace values in{" "}
                    <code>src/data/</code>, then <code>npm run build</code>.
                  </p>
                </div>
              </li>
            </ol>
            <p className="data-status__note data-status__note--mono">
              <Terminal size={13} /> Full field mapping: docs/RESOURCE-INTEGRATION.md
            </p>
          </section>
        </div>

        <div className="data-status__reference">
          <div>
            <span className="eyebrow">Design framework reference</span>
            <p>
              The review and report structure borrows from NASA Goddard's Mission Design Lab
              discipline set: mass equipment lists, power and data budgets, orbit analysis,
              launch accommodations, risk and cost. It is an independent game prototype, not an
              official NASA product.
            </p>
          </div>
          <a
            className="text-link"
            href="https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/"
            target="_blank"
            rel="noreferrer"
          >
            NASA GSFC Mission Design Lab <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </Modal>
  );
}
