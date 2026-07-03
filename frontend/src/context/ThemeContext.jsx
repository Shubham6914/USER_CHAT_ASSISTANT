import {
  createContext,
  useEffect,
  useState,
} from "react";

import {
  saveTheme,
  getTheme,
} from "../utils/storage";

/**
 * Global Theme Context
 */
export const ThemeContext =
  createContext();

function ThemeProvider({ children }) {
  /**
   * Current Theme
   * light | dark
   */
//   const [theme, setTheme] =
//     useState("light");

    const [theme, setTheme] =
    useState(() => getTheme());

  /**
   * Load saved theme
   * when app starts
   */
//   useEffect(() => {
//     const storedTheme = getTheme();

//     setTheme(storedTheme);
//   }, []);

  /**
   * Apply theme class
   * to HTML document
   */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    saveTheme(theme);
  }, [theme]);
  /**
   * Toggle Theme
   */
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === "light"
        ? "dark"
        : "light"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;