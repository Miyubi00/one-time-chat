import { useEffect, useState } from "react";
import { FaMicrophone, FaImage } from "react-icons/fa";
import VoiceBubble from "./VoiceBubble";
import ImageBubble from "./ImageBubble";

export default function ChatBubble({
  message,
  isMe,
  color,
  onReply,
  highlight, // 👈 dari Room.jsx
  onJump
}) {
  const bubbleBg = isMe ? "#EF9CAE" : color || "#A7C97A";
  const textColor = isMe ? "white" : "#374151";

  return (
    <div
      id={`msg-${message.id}`} // 👈 untuk scroll & highlight
      className={`
        flex mb-2
        ${isMe ? "justify-end" : "justify-start"}
        ${highlight ? "animate-pulse ring-2 ring-yellow-300 rounded-xl" : ""}
      `}
    >
      <div
        onClick={() => {
          if (message.__optimistic) return; // ❌ JANGAN BOLEH
          onReply?.(message);
        }}
        style={{ backgroundColor: bubbleBg, color: textColor }}
        className={`
          max-w-[75%]
          px-3 py-2
          rounded-2xl
          text-sm
          cursor-pointer
          shadow-sm
          ${isMe ? "rounded-br-md" : "rounded-bl-md"}
        `}
      >
        {/* ======================
            REPLY PREVIEW
        ====================== */}
        {message.reply_content && (
          <div
            onClick={(e) => {
              e.stopPropagation();

              // 🔥 JUMP KE PESAN ASAL
              if (message.reply_to) {
                onJump?.(message.reply_to);
              }
            }}
            className="
    mb-1
    px-2 py-1
    text-xs
    rounded-md
    border-l-4
    bg-gray-200/80
    overflow-hidden
    cursor-pointer
    hover:bg-gray-300/80
  "
            style={{ borderColor: "#ffffff" }}
          >
            <div
              className="font-semibold text-[11px] mb-0.5"
              style={{ color: bubbleBg }}
            >
              Reply
            </div>

            <div className="flex items-center gap-2 truncate leading-snug text-gray-700">
              {/* REPLY IMAGE */}
              {message.reply_type === "image" && (
                <>
                  <span className="flex items-center gap-1">
                    <FaImage className="text-[11px]" />
                    <span>Image</span>
                  </span>
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-images/${message.reply_content}`}
                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                    alt="reply-img"
                  />
                </>
              )}

              {/* REPLY VOICE */}
              {message.reply_type === "voice" && (
                <VoiceReplyDuration path={message.reply_content} />
              )}

              {/* REPLY TEXT */}
              {message.reply_type === "text" && (
                <span className="truncate">{message.reply_content}</span>
              )}

              {/* FALLBACK (OPTIMISTIC / DATA LAMA) */}
              {!message.reply_type && (
                <span className="truncate">{message.reply_content}</span>
              )}
            </div>
          </div>
        )}

        {/* ======================
            MESSAGE CONTENT
        ====================== */}

        {/* IMAGE */}
        {message.type === "image" && (
          <div className="space-y-1">
            <ImageBubble
              path={message.content}
              preview={message.__optimistic ? message.localPreview : null}
            />

            {/* IMAGE CAPTION (OPTIONAL) */}
            {message.caption && (
              <div className="text-sm leading-snug break-words">
                {message.caption}
              </div>
            )}
          </div>
        )}

        {/* VOICE */}
        {message.type === "voice" && (
          <VoiceBubble
            path={message.content}
            color={bubbleBg}
            textColor={textColor}
          />
        )}

        {/* TEXT */}
        {message.type === "text" && (
          <div className="leading-snug">{message.content}</div>
        )}
      </div>
    </div>
  );
}

/* ======================
   VOICE REPLY DURATION
====================== */
function VoiceReplyDuration({ path }) {
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
