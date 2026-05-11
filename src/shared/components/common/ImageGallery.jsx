import React, { useEffect, useRef, useState } from "react";
import "./registerSpinKeyframes.js";
import { createPortal } from "react-dom";
import { S } from "../../styles/primitives.js";
import { CG } from "../../styles/componentStyles.js";
export function ImageGallery({
  images = [],
  videoUrl = null,
  autoPlayVideo = false
}) {
  const validImgs = (images || []).filter(Boolean);
  const items = [...validImgs, ...(videoUrl ? ["**video**"] : [])];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [loadedMap, setLoadedMap] = useState({
    0: true
  });
  const [imgError, setImgError] = useState(false);
  const touchStartX = useRef(null);
  const sx = {
    s1: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      fontSize: 64,
      background: "linear-gradient(135deg,#1A4A2E22,#2D6B4522)"
    },
    s2: {
      width: "100%",
      height: "100%",
      position: "relative",
      background: "#111",
      overflow: "hidden"
    },
    s3: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#E9EFEA",
      zIndex: 1
    },
    s4: {
      width: 28,
      height: 28,
      border: "3px solid #D6E3DA",
      borderTopColor: "#1A4A2E",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite"
    },
    s5: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 18,
      background: "linear-gradient(135deg,#1A4A2E,#244C35)"
    },
    s6: imageLoaded => ({
      width: "100%",
      height: "100%",
      objectFit: "cover",
      userSelect: "none",
      cursor: "zoom-in",
      opacity: imageLoaded ? 1 : 0.01,
      transition: "opacity .18s ease"
    })
  };
  useEffect(() => {
    setActive(0);
    setLightbox(null);
    setLoadedMap({
      0: true
    });
    setImgError(false);
  }, [videoUrl, validImgs.join("|")]);
  useEffect(() => {
    const toWarm = [items[active + 1], items[active - 1]].filter(url => url && url !== "**video**");
    if (!toWarm.length) return;
    const warmUrl = async url => {
      try {
        if (typeof window === "undefined") return;
        if ("caches" in window) {
          const enabled = localStorage.getItem("warm_images_enabled") !== "0";
          if (!enabled) return;
          const cache = await window.caches.open("supabase-images");
          const matched = await cache.match(url);
          if (!matched) {
            const r = await fetch(url, {
              mode: "cors",
              credentials: "omit",
              cache: "force-cache"
            });
            if (r.ok || r.type === "opaque") await cache.put(url, r);
          }
        } else {
          const img = new Image();
          img.src = url;
        }
      } catch {}
    };
    toWarm.forEach(url => void warmUrl(url));
  }, [active, items]);
  if (items.length === 0) {
    return <div style={sx.s1}>
        🏠
      </div>;
  }
  const isVideo = items[active] === "**video**";
  const goTo = idx => {
    setImgError(false);
    const total = items.length;
    setActive((idx % total + total) % total);
  };
  const handleTouchStart = e => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = e => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goTo(active + 1) : goTo(active - 1);
    }
    touchStartX.current = null;
  };
  const currentSrc = items[active];
  const imageLoaded = !!loadedMap[active];
  return <div style={sx.s2} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {isVideo ? <video key={videoUrl} src={videoUrl} style={S.coverImage} controls playsInline preload="metadata" autoPlay={autoPlayVideo} /> : <>
          {!imageLoaded && !imgError && <div style={sx.s3}>
              <div style={sx.s4} />
            </div>}

          {imgError ? <div style={sx.s5}>
              تعذر تحميل الصورة
            </div> : <img key={currentSrc} src={currentSrc} alt="" onClick={() => setLightbox(currentSrc)} onLoad={() => setLoadedMap(prev => ({
        ...prev,
        [active]: true
      }))} onError={() => setImgError(true)} loading={active === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={active === 0 ? "high" : "auto"} draggable={false} style={sx.s6(imageLoaded)} />}
        </>}

      {lightbox && (() => {
      const lbTouch = {
        x: null,
        y: null,
        scale: 1,
        dist: null,
        startScale: 1,
        tx: 0,
        ty: 0,
        startTx: 0,
        startTy: 0
      };
      const getDist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const applyTransform = () => {
        const img = document.getElementById("lb-img");
        if (img) img.style.transform = `scale(${lbTouch.scale}) translate(${lbTouch.tx}px, ${lbTouch.ty}px)`;
      };
      const resetTransform = () => {
        lbTouch.scale = 1;
        lbTouch.tx = 0;
        lbTouch.ty = 0;
        const img = document.getElementById("lb-img");
        if (img) img.style.transform = "scale(1) translate(0,0)";
      };
      const handleLbTouchStart = e => {
        if (e.touches.length === 2) {
          lbTouch.dist = getDist(e.touches);
          lbTouch.startScale = lbTouch.scale;
          lbTouch.startTx = lbTouch.tx;
          lbTouch.startTy = lbTouch.ty;
        } else {
          lbTouch.x = e.touches[0].clientX;
          lbTouch.y = e.touches[0].clientY;
          lbTouch.startTx = lbTouch.tx;
          lbTouch.startTy = lbTouch.ty;
        }
      };
      const handleLbTouchMove = e => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const newDist = getDist(e.touches);
          const ratio = newDist / lbTouch.dist;
          lbTouch.scale = Math.min(Math.max(lbTouch.startScale * ratio, 1), 5);
          applyTransform();
        } else if (e.touches.length === 1 && lbTouch.scale > 1.1) {
          e.preventDefault();
          const dx = (e.touches[0].clientX - lbTouch.x) / lbTouch.scale;
          const dy = (e.touches[0].clientY - lbTouch.y) / lbTouch.scale;
          lbTouch.tx = lbTouch.startTx + dx;
          lbTouch.ty = lbTouch.startTy + dy;
          applyTransform();
        }
      };
      const handleLbTouchEnd = e => {
        if (lbTouch.dist !== null) {
          lbTouch.dist = null;
          if (lbTouch.scale < 1.1) resetTransform();
          return;
        }
        if (lbTouch.x === null) return;
        if (lbTouch.scale > 1.1) {
          lbTouch.x = null;
          return;
        }
        const diff = lbTouch.x - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          const ni = diff > 0 ? active + 1 : active - 1;
          const total = validImgs.length;
          const next = (ni % total + total) % total;
          resetTransform();
          goTo(next);
          setLightbox(validImgs[next]);
        }
        lbTouch.x = null;
      };
      return createPortal(<div onClick={() => {
        if (lbTouch.scale <= 1.1) setLightbox(null);
      }} onTouchStart={handleLbTouchStart} onTouchMove={handleLbTouchMove} onTouchEnd={handleLbTouchEnd} style={CG.lightboxRoot}>
            <div style={CG.lightboxBg}>
              <img src={lightbox} alt="" style={CG.lightboxBgImg} />
              <div style={CG.lightboxBgOverlay} />
            </div>

            <div style={CG.lightboxTop}>
              <button onClick={() => setLightbox(null)} style={CG.lightboxClose}>✕</button>
              {validImgs.length > 1 ? <div style={CG.lightboxCount}>{active + 1} / {validImgs.length}</div> : <div />}
              <div style={CG.square36} />
            </div>

            <div style={CG.lightboxBody} onClick={e => e.stopPropagation()}>
              <img id="lb-img" src={lightbox} alt="" style={CG.lightboxImage} />
            </div>

            {validImgs.length > 1 && <div style={CG.lightboxBottom} onClick={e => e.stopPropagation()}>
                <div style={CG.centerDots6}>
                  {validImgs.map((_, i) => <div key={i} onClick={e => {
              e.stopPropagation();
              goTo(i);
              setLightbox(validImgs[i]);
            }} style={CG.lightboxDot(i === active)} />)}
                </div>

                <div style={CG.navButtons}>
                  <button onClick={e => {
              e.stopPropagation();
              const total = validImgs.length;
              const ni = ((active - 1) % total + total) % total;
              goTo(ni);
              setLightbox(validImgs[ni]);
            }} style={CG.navCircleButton}>‹</button>
                  <button onClick={e => {
              e.stopPropagation();
              const total = validImgs.length;
              const ni = (active + 1) % total;
              goTo(ni);
              setLightbox(validImgs[ni]);
            }} style={CG.navCircleButton}>›</button>
                </div>
              </div>}
          </div>, document.body);
    })()}

      {items.length > 1 && <div style={CG.galleryBottom}>
          <div style={CG.centerDots5}>
            {items.map((item, i) => <div key={i} style={CG.galleryDot(i === active, item === "**video**")} />)}
          </div>
          <div style={CG.galleryCount}>{isVideo ? "▶ فيديو" : `${active + 1} / ${validImgs.length}`}</div>
        </div>}
    </div>;
}