import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./themeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary me-2"
      onClick={toggleTheme}
      aria-pressed={theme === 'dark'}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? (
        <Moon className="" />
      ) : (
        <Sun className="" />
      )}
    </button>
  );
}
