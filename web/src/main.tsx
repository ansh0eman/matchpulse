import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ClubsProvider } from "./clubs/Clubs";
import "./styles.css";
import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "./design/broadcast.css";
import "./design/matchday.css";
import "./design/theme.css";
import "./shell/shell.css";
import "./broadcast/timeline.css";
import "./clubs/clubs.css";
import "./views/investigation.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClubsProvider><App /></ClubsProvider>
  </React.StrictMode>,
);
