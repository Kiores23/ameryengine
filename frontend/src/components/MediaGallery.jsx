import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resolvePublicPath } from "../utils/publicPath";

const MOBILE_BREAKPOINT = 1024;

function getInitialMobileLayout() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function normalizeValue(v) {
  return String(v ?? "").trim().toLowerCase();
}

function resolveQuotedTag(value, nodes) {
  if (!value || !nodes?.length) return null;

  const trimmed = String(value).trim();
  const normalized = normalizeValue(trimmed);

  for (const node of nodes || []) {
    if (!node) continue;
    if (node.id === trimmed) return node;
    if (normalizeValue(node.label) === normalized) return node;
  }

  return null;
}

function renderDescriptionWithTags(text, nodes, onSelect) {
  if (!text) return null;

  const parts = String(text).split(/"([^"]+)"/g);

  return parts.map((part, index) => {
    const isQuoted = index % 2 === 1;

    if (!isQuoted) {
      return <span key={index}>{part}</span>;
    }

    const resolvedNode = resolveQuotedTag(part, nodes);
    const clickable = !!resolvedNode?.id;

    return (
      <button
        key={index}
        type="button"
        className={"mediaInlineTag" + (clickable ? "" : " mediaInlineTag--disabled")}
        onClick={() => clickable && onSelect?.(resolvedNode.id)}
        disabled={!clickable}
        title={
          clickable
            ? `Open ${part}`
            : `${part} n'est pas encore relié à un élément`
        }
      >
        {part}
      </button>
    );
  });
}

function getYoutubeVideoId(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    return null;
  } catch {
    return null;
  }
}

function toYoutubeEmbed(url) {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : url;
}

function toYoutubeThumbnail(url) {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export default function MediaGallery({ node, nodes = [], onSelect }) {
  const [index, setIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(getInitialMobileLayout);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const wrapRef = useRef(null);
  const thumbsRef = useRef(null);

  const mediaItems = useMemo(() => {
    if (!node) return [];

    const videos = (node.videoUrls || []).map((url, i) => ({
      type: "video",
      src: toYoutubeEmbed(url),
      thumb: toYoutubeThumbnail(url),
      original: url,
      description: node.videoDescriptions?.[i] || "",
    }));

    const images = (node.imageNames || []).map((name, i) => ({
      type: "image",
      src: resolvePublicPath(`images/${name}`),
      thumb: resolvePublicPath(`images/${name}`),
      original: name,
      description: node.imageDescriptions?.[i] || "",
    }));

    return [...videos, ...images];
  }, [node]);

  const hasMedia = mediaItems.length > 0;
  const current = hasMedia ? mediaItems[Math.min(index, mediaItems.length - 1)] : null;

  const goPrev = () => {
    if (!hasMedia) return;
    setIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const goNext = () => {
    if (!hasMedia) return;
    setIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const openExpanded = useCallback(async () => {
    if (!hasMedia) return;

    setIsExpanded(true);
    if (!isMobileLayout) return;

    const target = wrapRef.current;
    if (!target) return;

    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn("[MediaGallery] Failed to enter fullscreen:", err);
    }
  }, [hasMedia, isMobileLayout]);

  const closeExpanded = useCallback(async () => {
    if (
      typeof document !== "undefined" &&
      isMobileLayout &&
      (document.fullscreenElement || document.webkitFullscreenElement)
    ) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } catch (err) {
        console.warn("[MediaGallery] Failed to exit fullscreen:", err);
      }
    }

    setIsExpanded(false);
  }, [isMobileLayout]);

  useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mediaItems.length, isExpanded]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleChange = (event) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setIndex(0);
    void closeExpanded();
  }, [closeExpanded, node?.id]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!hasMedia) return;

      if (e.key === "Escape") {
        void closeExpanded();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeExpanded, hasMedia, mediaItems.length]);

  useEffect(() => {
    if (isExpanded && !isMobileLayout) {
      document.body.classList.add("mediaFullscreenOpen");
    } else {
      document.body.classList.remove("mediaFullscreenOpen");
    }

    return () => {
      document.body.classList.remove("mediaFullscreenOpen");
    };
  }, [isExpanded, isMobileLayout]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const updateFullscreenState = () => {
      const fullscreenElement =
        document.fullscreenElement || document.webkitFullscreenElement || null;
      const isCurrentGallery = fullscreenElement === wrapRef.current;
      setFullscreenActive(isCurrentGallery);

      if (!isCurrentGallery && isMobileLayout) {
        setIsExpanded(false);
      }
    };

    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
      document.removeEventListener("webkitfullscreenchange", updateFullscreenState);
    };
  }, [isMobileLayout]);

  useEffect(() => {
    if (!mediaItems.length) {
      setIndex(0);
      return;
    }

    if (index >= mediaItems.length) {
      setIndex(mediaItems.length - 1);
    }
  }, [index, mediaItems.length]);

  if (!node) {
    return (
      <div className="mediaWrap mediaWrap--empty">
        <div className="mediaEmpty">Aucun node sélectionné.</div>
      </div>
    );
  }

  if (!hasMedia) {
    return (
      <div className="mediaWrap mediaWrap--empty">
        <div className="mediaEmpty">
          Aucun média disponible pour <strong>{node.label}</strong>.
        </div>
      </div>
    );
  }

  const gallery = (
    <div
      ref={wrapRef}
      className={
        "mediaWrap" +
        (isExpanded ? " mediaWrap--expanded" : "") +
        (fullscreenActive ? " mediaWrap--fullscreen" : "")
      }
    >
      <div className="mediaHeader">
        <div>
          <div className="mediaTitle">{node.label}</div>
          <div className="mediaMeta">
            {index + 1} / {mediaItems.length} — {current.type === "video" ? "Vidéo" : "Image"}
          </div>
        </div>

        <button
          type="button"
          className="mediaExpandButton"
          onClick={isExpanded ? closeExpanded : openExpanded}
          aria-label={isExpanded ? "Close the expanded mode" : "Open the media in full size"}
        >
          {isExpanded ? "✕ Close" : "⛶ Extend"}
        </button>
      </div>

      <div className={"mediaViewer" + (isExpanded ? " mediaViewer--expanded" : "")}>
        <button
          className="mediaNav mediaNav--left"
          onClick={goPrev}
          aria-label="Média précédent"
        >
          ‹
        </button>

        <div className={"mediaStageWrap" + (isExpanded ? " mediaStageWrap--expanded" : "")}>
          <div className={"mediaStage" + (isExpanded ? " mediaStage--expanded" : "")}>
            {current.type === "video" ? (
              <iframe
                className="mediaFrame"
                src={current.src}
                title={`media-video-${index}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="mediaImageButton"
                onClick={openExpanded}
                aria-label="Open the image in full size"
              >
                <img
                  className="mediaImage"
                  src={current.src}
                  alt={current.original || node.label}
                  decoding="async"
                  loading="lazy"
                />
              </button>
            )}
          </div>

          {current.description && (
            <div className={"mediaDescription" + (isExpanded ? " mediaDescription--expanded" : "")}>
              {renderDescriptionWithTags(current.description, nodes, onSelect)}
            </div>
          )}
        </div>

        <button
          className="mediaNav mediaNav--right"
          onClick={goNext}
          aria-label="Média suivant"
        >
          ›
        </button>
      </div>

      {!isExpanded && (
        <div className="mediaThumbs" ref={thumbsRef}>
          {mediaItems.map((item, i) => (
            <button
              key={`${item.type}-${item.original}-${i}`}
              className={"mediaThumb" + (i === index ? " active" : "")}
              onClick={() => setIndex(i)}
              title={item.type === "video" ? "Vidéo" : item.original}
            >
              {item.thumb ? (
                <div className="mediaThumb__inner">
                  <img
                    className="mediaThumb__image"
                    src={item.thumb}
                    alt={item.original || `media-${i}`}
                    decoding="async"
                    loading="lazy"
                  />
                  {item.type === "video" && <div className="mediaThumb__play">▶</div>}
                </div>
              ) : (
                <div className="mediaThumb__fallback">
                  {item.type === "video" ? "▶ Vidéo" : "Image"}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isExpanded && !isMobileLayout && typeof document !== "undefined") {
    return createPortal(
      <>
        <button
          type="button"
          className="mediaOverlay"
          onClick={closeExpanded}
          aria-label="Close the viewer"
        />
        {gallery}
      </>,
      document.body
    );
  }

  return (
    <>
      {isExpanded && !isMobileLayout && (
        <button
          type="button"
          className="mediaOverlay"
          onClick={closeExpanded}
          aria-label="Close the viewer"
        />
      )}

      {gallery}
    </>
  );
}
