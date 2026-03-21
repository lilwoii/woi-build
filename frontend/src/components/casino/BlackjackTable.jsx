import React from "react";
import Existing from "./BlackjackTable.visual";

export default function BlackjackTable(props){
  // If your base already has the visual table from bundle 16, keep it as BlackjackTable.visual.jsx
  // This wrapper preserves the onLog contract.
  return <Existing {...props} />;
}
