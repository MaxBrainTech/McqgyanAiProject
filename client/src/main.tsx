import { createRoot } from "react-dom/client";
import type { Engine } from "@tsparticles/engine";
import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import App from "./App";
import "./index.css";
import "./i18n/i18n";

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

createRoot(document.getElementById("root")!).render(
  <ParticlesProvider init={particlesInit}>
    <App />
  </ParticlesProvider>
);
