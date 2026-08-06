import Particles from "@tsparticles/react";

export default function AnimatedBackground() {
  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 pointer-events-none"
      options={{
        fullScreen: {
          enable: true
        },

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
              width: 800,
              height: 800,
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
