import { useEffect, useRef, useState } from "react";

// These are the original assets used by hackclub/pixl's landing Hero.
const VIDEO_URL = "https://pixl.hackclub.com/hero-bg.mp4";
const POSTER_URL = "https://pixl.hackclub.com/hero-bg-poster.webp";

export default function PixlPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let loaded = false;

    const play = () => {
      if (reduceMotion.matches) return;
      if (!loaded) {
        video.src = VIDEO_URL;
        video.load();
        loaded = true;
      }
      void video.play().catch(() => {});
    };

    if (!("IntersectionObserver" in window)) {
      play();
      return () => video.pause();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play();
        else video.pause();
      },
      { threshold: 0.15 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <div className="project-preview">
      {failed ? (
        <a
          className="project-preview-fallback"
          href="https://pixl.hackclub.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview unavailable · open PIXL ↗
        </a>
      ) : (
        <video
          ref={videoRef}
          className="project-preview-media"
          poster={POSTER_URL}
          muted
          loop
          playsInline
          preload="none"
          aria-label="Looping preview of the PIXL game's world"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
