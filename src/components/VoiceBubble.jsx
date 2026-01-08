import { useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

export default function VoiceBubble({
  path,
  color = "#A7C97A",
  textColor = "#374151",
}) {
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-voices/${path}`;

  function togglePlay() {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  function format(sec) {
    if (!sec || Number.isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const progress =
    duration > 0 ? Math.min((current / duration) * 100, 100) : 0;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-xl w-64"
      style={{ backgroundColor: color }}
    >
      {/* PLAY / PAUSE */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full"
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          color: color,
        }}
      >
        {playing ? <FaPause /> : <FaPlay />}
      </button>

      {/* PROGRESS BAR */}
      <div className="flex-1">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <div
            className="h-1 transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
          />
        </div>
      </div>

      {/* TIME */}
      <div
        className="text-sm font-mono min-w-[40px] text-right"
        style={{ color: textColor }}
      >
        {format(duration)}
      </div>

      {/* AUDIO */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration(e.currentTarget.duration || 0)
        }
        onTimeUpdate={(e) =>
          setCurrent(e.currentTarget.currentTime)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
    </div>
  );
}
