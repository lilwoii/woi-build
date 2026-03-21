import React, { useEffect, useRef } from "react";

/**
 * Lightweight TradingView embed (no login).
 * Note: This is an embedded widget for user comfort. Our AI-native chart remains separate.
 */
const TradingViewWidget = ({ symbol = "NASDAQ:TSLA", height = "100%" }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(`tv_${Math.random().toString(16).slice(2)}`);

  useEffect(() => {
    // TradingView script loader
    const load = () =>
      new Promise((resolve) => {
        if (window.TradingView) return resolve();
        const s = document.createElement("script");
        s.src = "https://s3.tradingview.com/tv.js";
        s.async = true;
        s.onload = resolve;
        document.body.appendChild(s);
      });

    let cancelled = false;

    const renderWidget = async () => {
      await load();
      if (cancelled) return;
      if (!containerRef.current || !window.TradingView) return;

      containerRef.current.innerHTML = "";
      const el = document.createElement("div");
      el.id = widgetIdRef.current;
      el.style.width = "100%";
      el.style.height = "100%";
      containerRef.current.appendChild(el);

      // TradingView's "autosize" can end up with a tiny iframe in flex layouts.
      // We set an explicit px height based on the actual container height.
      const measured = containerRef.current.getBoundingClientRect?.().height || 0;
      const numericHeight =
        typeof height === "number"
          ? height
          : height && typeof height === "string" && height.endsWith("px")
            ? parseInt(height, 10)
            : Math.max(520, Math.floor(measured || 520));

      // eslint-disable-next-line no-new
      new window.TradingView.widget({
        autosize: false,
        width: "100%",
        height: numericHeight,
        symbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#020617",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        container_id: widgetIdRef.current,
      });
    };

    renderWidget();

    // Re-render if the container size changes (resizes, tab swaps, etc.)
    let ro;
    if (window.ResizeObserver && containerRef.current) {
      ro = new ResizeObserver(() => {
        // Avoid infinite loops: re-render only when visible
        if (!cancelled) renderWidget();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #111827",
        background: "#020617",
      }}
    />
  );
};

export default TradingViewWidget;
