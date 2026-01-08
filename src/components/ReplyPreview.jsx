import { useEffect, useState } from "react";
import { FaMicrophone, FaImage } from "react-icons/fa";

export default function ReplyPreview({ reply, onCancel, onJump }) {
  if (!reply) return null;

  const isImage = reply.type === "image";
  const isVoice = reply.type === "voice";

  const imageUrl =
    isImage &&
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-images/${reply.content}`;

  return (
    <div className="px-4">
      <div
        onClick={() => onJump?.(reply.id)}
        className="
          flex items-center justify-between
          bg-white
          border-l-4 border-[#22c55e]
          rounded-lg
          px-3 py-2
          mb-2
          shadow-sm
          cursor-pointer
          hover:bg-gray-50
        "
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {/* IMAGE THUMBNAIL */}
          {isImage && (
            <img
              src={imageUrl}
              alt="reply-img"
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
          )}

          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-[#22c55e] mb-0.5">
              Replying to
            </div>

            <div className="text-sm text-gray-700 truncate flex items-center gap-1">
              {reply.type === "text" && reply.content}

              {reply.type === "image" && (
                <span className="flex items-center gap-1">
                  <FaImage className="text-[12px]" />
                  <span>Image</span>
                </span>
              )}

              {reply.type === "voice" && (
                <VoicePreviewDuration path={reply.content} />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // ❗ jangan ikut jump
            onCancel();
          }}
          className="ml-3 text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ======================
   VOICE PREVIEW DURATION
====================== */
function VoicePreviewDuration({ path }) {
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    const audio = new Audio(
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-voices/${path}`
    );

    audio.onloadedmetadata = () => {
      const sec = Math.floor(audio.duration || 0);
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, "0");
      setDuration(`${m}:${s}`);
    };
  }, [path]);

  return (
    <span className="flex items-center gap-1">
      <FaMicrophone className="text-[11px]" />
      <span>
        Voice{duration && ` (${duration})`}
      </span>
    </span>
  );
}