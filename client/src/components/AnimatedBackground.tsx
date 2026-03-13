import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function AnimatedBackground() {

  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="absolute inset-0 -z-10"
      options={{
        fullScreen: false,

        background: {
          color: {
            value: "transparent",
          },
        },

        fpsLimit: 60,

        particles: {
          number: {
            value: 60,
            density: {
              enable: true,
              area: 800,
            },
          },

          color: {
            value: ["#60a5fa", "#a78bfa", "#22d3ee"],
          },

          links: {
            enable: true,
            distance: 150,
            color: "#a78bfa",
            opacity: 0.3,
            width: 1,
          },

          move: {
            enable: true,
            speed: 1.2,
            direction: "none",
            outModes: {
              default: "bounce",
            },
          },

          opacity: {
            value: 0.6,
          },

          size: {
            value: { min: 1, max: 4 },
          },
        },

        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },

          modes: {
            grab: {
              distance: 200,
              links: {
                opacity: 0.6,
              },
            },
          },
        },
      }}
    />
  );
}