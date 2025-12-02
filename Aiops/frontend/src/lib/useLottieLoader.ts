import { useEffect, useState } from "react";

const DEFAULT_SRC = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";

export function useLottieLoader(src: string = DEFAULT_SRC) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as any) : undefined;
    if (!win) return;
    if (win.lottie) {
      setReady(true);
      return;
    }

    const existing = document.querySelector(`script[data-lottie-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => setReady(true);
      existing.addEventListener("load", onLoad);
      return () => existing.removeEventListener("load", onLoad);
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-lottie-src", src);
    script.onload = () => setReady(true);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [src]);

  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as any) : undefined;
    if (win?.lottie) {
      setReady(true);
    }
  }, []);

  return ready;
}
