import useGlobalOps from "../../hooks/useGlobalOps";
import useGlobalOpsController from "../../hooks/useGlobalOpsController";
import LiveNewsPanel from "./LiveNewsPanel";
import LiveWebcamsPanel from "./LiveWebcamsPanel";
import AIInsightsRail from "./AIInsightsRail";
import GlobalOpsGlobe from "./GlobalOpsGlobe";
import EventDrawer from "./EventDrawer";
import GlobalTickerBar from "./GlobalTickerBar";
import "./globalops.css";

export default function GlobalOpsHUD() {
  const { news, webcams, summary } = useGlobalOps();
  const controller = useGlobalOpsController();

  return (
    <div className="global-ops-page">
      <div className="global-ops-top">
        <GlobalOpsGlobe
          externallySelectedEntity={controller.selectedEntity}
          forcedRegionKey={controller.focusedRegionKey}
          onSelectEntity={controller.selectEntity}
        />
        <AIInsightsRail
          summary={summary}
          onFocusRegion={controller.focusRegionFromName}
          onSelectInsight={controller.selectEntity}
        />
      </div>

      <div className="global-ops-bottom">
        <LiveNewsPanel
          news={news}
          onSelectEntity={controller.selectEntity}
          onFocusRegion={controller.focusRegionFromName}
          onTickerChange={controller.pushTickerItems}
        />
        <LiveWebcamsPanel
          webcams={webcams}
          onSelectEntity={controller.selectEntity}
          onFocusRegion={controller.focusRegionFromName}
        />
      </div>

      <GlobalTickerBar items={controller.tickerItems} />
      <EventDrawer
        entity={controller.selectedEntity}
        onClose={() => controller.setSelectedEntity(null)}
      />
    </div>
  );
}