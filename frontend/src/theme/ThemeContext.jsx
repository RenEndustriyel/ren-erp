import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ren-theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.setAttribute("data-theme", theme);
    body.setAttribute("data-theme", theme);

    body.classList.remove(
      "ren-light-mode",
      "ren-dark-mode"
    );

    body.classList.add(
      theme === "dark"
        ? "ren-dark-mode"
        : "ren-light-mode"
    );

    try {
      localStorage.setItem(
        "ren-theme",
        theme
      );
    } catch {
      // localStorage kullanılamıyorsa uygulama yine çalışır.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark"
        ? "light"
        : "dark"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme ThemeProvider içinde kullanılmalıdır."
    );
  }

  return context;
}