import React, { useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // includes Popper.js

export function TooltipProvider({ children, text, placement = "top" }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      const tooltip = new window.bootstrap.Tooltip(ref.current, {
        title: text,
        placement,
      });

      return () => tooltip.dispose();
    }
  }, [text, placement]);

  return (
    <span ref={ref} style={{ cursor: "pointer" }}>
      {children}
    </span>
  );
}
