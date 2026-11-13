import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { BriefingScreen } from "./components/screens/BriefingScreen";
import { BuilderScreen } from "./components/screens/BuilderScreen";
import { FlightScreen } from "./components/screens/FlightScreen";
import { HangarScreen } from "./components/screens/HangarScreen";
import { LaunchScreen } from "./components/screens/LaunchScreen";
import { OrbitScreen } from "./components/screens/OrbitScreen";
import { ReportScreen } from "./components/screens/ReportScreen";
import { ReviewScreen } from "./components/screens/ReviewScreen";
import { DataStatusModal } from "./components/layout/DataStatusModal";
import { Footer } from "./components/layout/Footer";
import { Starfield } from "./components/layout/Starfield";
import { Stepper } from "./components/layout/Stepper";
import { TopBar } from "./components/layout/TopBar";
import type { StepId } from "./data/types";
import { useGame } from "./state/GameContext";

function StepScreen({ step }: { step: StepId }) {
  switch (step) {
    case "briefing":
    default:
      return <BriefingScreen />;
    case "spacecraft":
      return <BuilderScreen />;
    case "orbit":
      return <OrbitScreen />;
    case "launch":
      return <LaunchScreen />;
    case "review":
      return <ReviewScreen />;
    case "flight":
      return <FlightScreen />;
    case "report":
      return <ReportScreen />;
  }
}

export default function App() {
  const { state } = useGame();
  const [dataOpen, setDataOpen] = useState(false);
  const [shareBanner, setShareBanner] = useState(state.loadedFromShare);

  useEffect(() => {
    if (window.location.hash.startsWith("#/design/")) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.step, state.view]);

  return (
    <div className="app-shell">
      <Starfield />
      <div className="app-content">
        <TopBar onOpenData={() => setDataOpen(true)} />
        {shareBanner && state.view === "mission" ? (
          <div className="share-banner">
            <span className="share-banner__icon"><Share2 size={14} /></span>
            <p>
              <strong>Shared design loaded.</strong> This architecture came from a link. You can
              inspect it, change it or fly the mission again.
            </p>
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => setShareBanner(false)} aria-label="Dismiss shared design notice">
              <X size={14} />
            </button>
          </div>
        ) : null}
        {state.view === "mission" ? <Stepper /> : null}
        <main className="app-main">
          <div key={`${state.view}-${state.step}`} className="screen-transition">
            {state.view === "hangar" ? <HangarScreen /> : <StepScreen step={state.step} />}
          </div>
        </main>
        <Footer onOpenData={() => setDataOpen(true)} />
      </div>
      <DataStatusModal open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  );
}
