"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import bg from "@/public/bg.png"

type Theme = "light" | "dark";

export type ThemeSettings = {
  defaultTheme?: Theme;
};

type ThemeContextValue = {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  changePage: (url: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  checkIn: Date | null;
  setCheckIn: Dispatch<SetStateAction<Date | null>>;
  checkOut: Date | null;
  setCheckOut: Dispatch<SetStateAction<Date | null>>;
  openForm: boolean;
  setOpenForm: Dispatch<SetStateAction<boolean>>;
  showImage: boolean;
  setShowImage: Dispatch<SetStateAction<boolean>>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings?: ThemeSettings;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasMounted = useRef(false);

  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return settings?.defaultTheme ?? "light";
    }

    const savedTheme = window.localStorage.getItem("theme");

    return savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : settings?.defaultTheme ?? "light";
  });

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem("theme", nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const changePage = useCallback(
    (url: string) => {
      setLoading(true);

      window.setTimeout(() => {
        router.push(url);
        setLoading(false);
      }, 500);
    },
    [router],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (hasMounted.current) {
      return;
    }

    hasMounted.current = true;

    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShowImage((current) => !current);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      setLoading,
      changePage,
      theme,
      setTheme,
      toggleTheme,
      checkIn,
      setCheckIn,
      checkOut,
      setCheckOut,
      openForm,
      setOpenForm,
      showImage,
      setShowImage,
    }),
    [
      changePage,
      checkIn,
      checkOut,
      loading,
      openForm,
      setTheme,
      showImage,
      theme,
      toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="children relative" data-pathname={pathname}>
        {/* <Image src={bg} alt="Background" fill style={{ objectFit: "cover", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1 }} /> */}

        <div className="floating-nav">
          
        </div>
        <div className="min-h-screen flex flex-col relative justify-between main-container">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export function GlobalContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("GlobalContext must be used inside ThemeProvider");
  }

  return context;
}

export const useTheme = GlobalContext;

export default ThemeProvider;
