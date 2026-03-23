import React from "react";
import AlertDrawer from "../components/desktop/AlertDrawer";

export default function AlertCenterPage() {
  return (
    <div style={{ padding: 18, color: "#fff" }}>
      <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}>🔔 Alert Center</div>
      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        Discord-first ops, in-app alerts, optional desktop notifications
      </div>
      <AlertDrawer />
    </div>
  );
}