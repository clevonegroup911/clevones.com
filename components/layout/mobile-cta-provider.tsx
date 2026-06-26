"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  MOBILE_CTA_BAR_HEIGHT_REM,
  MOBILE_CTA_SCROLL_FALLBACK,
  PAGE_HERO_ID,
  buildMobileCtaRootMarginBottom,
} from "@/lib/constants/mobile-cta";

const MOBILE_BREAKPOINT = "(max-width: 1023px)";

type MobileCtaContextValue = {
  enabled: boolean;
  isVisible: boolean;
};

const MobileCtaContext = createContext<MobileCtaContextValue>({
  enabled: false,
  isVisible: false,
});

export function useMobileCta() {
  return useContext(MobileCtaContext);
}

function readSafeAreaInsetBottom(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;bottom:0;left:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;";
  document.documentElement.appendChild(probe);
  const inset = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return inset;
}

function readMobileCtaBarOffsetPx(): number {
  const rootFontSize =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return MOBILE_CTA_BAR_HEIGHT_REM * rootFontSize + readSafeAreaInsetBottom();
}

function isHeroPastViewport(hero: HTMLElement, barOffsetPx: number): boolean {
  const viewportBottom = window.innerHeight;
  return hero.getBoundingClientRect().bottom <= viewportBottom - barOffsetPx;
}

type MobileCtaProviderProps = {
  enabled: boolean;
  children: ReactNode;
};

export function MobileCtaProvider({ enabled, children }: MobileCtaProviderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);

    function syncMobile() {
      setIsMobile(mediaQuery.matches);
    }

    syncMobile();
    mediaQuery.addEventListener("change", syncMobile);

    return () => mediaQuery.removeEventListener("change", syncMobile);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isMobile || typeof window === "undefined") {
      return;
    }

    const hero = document.getElementById(PAGE_HERO_ID);
    const barOffsetPx = readMobileCtaBarOffsetPx();

    function attachScrollFallback(targetHero?: HTMLElement | null) {
      function handleScroll() {
        if (targetHero) {
          setIsPastHero(isHeroPastViewport(targetHero, barOffsetPx));
          return;
        }

        setIsPastHero(window.scrollY > MOBILE_CTA_SCROLL_FALLBACK);
      }

      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => window.removeEventListener("scroll", handleScroll);
    }

    if (!hero) {
      return attachScrollFallback();
    }

    if (typeof IntersectionObserver === "undefined") {
      return attachScrollFallback(hero);
    }

    let observer: IntersectionObserver | null = null;

    try {
      observer = new IntersectionObserver(
        ([entry]) => {
          setIsPastHero(!entry.isIntersecting);
        },
        {
          root: null,
          rootMargin: buildMobileCtaRootMarginBottom(barOffsetPx),
          threshold: 0,
        },
      );

      observer.observe(hero);
    } catch {
      return attachScrollFallback(hero);
    }

    return () => observer?.disconnect();
  }, [enabled, isMobile]);

  const value = useMemo(
    () => ({
      enabled,
      isVisible: enabled && isMobile && isPastHero,
    }),
    [enabled, isMobile, isPastHero],
  );

  return (
    <MobileCtaContext.Provider value={value}>{children}</MobileCtaContext.Provider>
  );
}
