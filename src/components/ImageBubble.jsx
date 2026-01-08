import { useEffect, useRef, useState } from "react";

export default function ImageBubble({ path, preview }) {
  const [open, setOpen] = useState(false);
  const imgRef = useRef(null);

  const url = preview
    ? preview
    : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-images/${path}`;

  /* ======================
     AUTO SCROLL SETELAH IMAGE LOAD
     (INI KUNCI BUG SETENGAH SCROLL)
  ====================== */
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    function handleLoad() {
      // kasih delay dikit biar layout settle
      requestAnimationFrame(() => {
        const chat = document.querySelector(".chat-list");
        chat?.scrollTo({
          top: chat.scrollHeight,
          behavior: "smooth",
        });
      });
    }

    img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [url]);

  return (
    <>
      {/* IMAGE BUBBLE */}
      <img
        ref={imgRef}
        src={url}
        alt="chat-img"
        loading="lazy"
        className="
    w-full
    max-w-[200px]
    md:max-w-[280px]
    rounded-2xl
    cursor-zoom-in
    object-cover
  "
        onClick={() => setOpen(true)}
      />

      {/* FULLSCREEN PREVIEW */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="
            fixed inset-0 z-50
            bg-black/90
            flex items-center justify-center
            cursor-zoom-out
          "
        >
          <img
            src={url}
            alt="full"
            className="
              max-w-[95%]
              max-h-[95%]
              rounded-lg
            "
          />
        </div>
      )}
    </>
  );
}
