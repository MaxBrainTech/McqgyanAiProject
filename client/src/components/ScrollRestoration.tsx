import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // restore scroll AFTER route render
    requestAnimationFrame(() => {
      const saved = sessionStorage.getItem(
        "scroll:" + location.pathname
      );

      if (saved) {
        window.scrollTo(0, Number(saved));
      }
    });

    return () => {
      sessionStorage.setItem(
        "scroll:" + location.pathname,
        String(window.scrollY)
      );
    };
  }, [location.pathname]);

  return null;
}
