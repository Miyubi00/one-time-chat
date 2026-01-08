import { useEffect, useState } from "react";
import { FaMicrophone, FaImage } from "react-icons/fa";
import VoiceBubble from "./VoiceBubble";
import ImageBubble from "./ImageBubble";

/* ======================
   LINKIFY HELPER (AMAN)
====================== */
function renderTextWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

  return text.split(urlRegex).map((part, i) => {
    if (!part) return null;

    const isUrl =
      part.startsWith("http://") ||
      part.startsWith("https://") ||
      part.startsWith("www.");

    if (isUrl) {
      const href = part.startsWith("http")
        ? part
        : `https://${part}`;

      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="
            text-blue-600 break-all
            underline hover:text-blue-800
          "
        >
          {part}
        </a>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

export default function ChatBubble({
  message,
  isMe,
  color,
  onReply,
  highlight,
  onJump
}) {
  const bubbleBg = isMe ? "#EF9CAE" : color || "#A7C97A";
  const textColor = "#374151";

  return (
    <div
      id={`msg-${message.id}`}
      className={`
        flex
        mb-2
        ${isMe ? "justify-end" : "justify-start"}
        ${highlight ? "animate-pulse ring-2 ring-yellow-300 rounded-xl" : ""}
      `}
    >
      <div
        onClick={() => {
          if (message.__optimistic) return;
          onReply?.(message);
        }}
        style={{ backgroundColor: bubbleBg, color: textColor }}
        className={`
          overflow-hidden
          max-w-[75%]
          px-3 py-2
          text-sm break-words whitespace-pre-wrap
          rounded-2xl
          cursor-pointer shadow-sm
          sm:max-w-[65%]
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
              if (message.reply_to) onJump?.(message.reply_to);
            }}
            className="
              overflow-hidden
              mb-1 px-2 py-1
              text-xs
              bg-gray-200/80
              rounded-md border-l-4 border-white
              cursor-pointer
              hover:bg-gray-300/80
            "
          >
            <div
              style={{ color: bubbleBg }}
              className="
                mb-0.5
                font-semibold text-[11px]
              "
            >
              Reply
            </div>

            <div
              className="
                flex
                text-gray-700
                items-center gap-2 truncate
              "
            >
              {message.reply_type === "image" && (
                <>
                  <FaImage
                    className="
                      text-[11px]
                    "
                  />
                  <span>Image</span>
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-images/${message.reply_content}`}
                    className="
                      object-cover
                      w-6 h-6
                      rounded
                    "
                  />
                </>
              )}

              {message.reply_type === "voice" && (
                <VoiceReplyDuration path={message.reply_content} />
              )}

              {message.reply_type === "text" && (
                <span
                  className="
                    truncate
                  "
                >
                  {message.reply_content}
                </span>
              )}

              {!message.reply_type && (
                <span
                  className="
                    truncate
                  "
                >
                  {message.reply_content}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ======================
            MESSAGE CONTENT
        ====================== */}

        {/* IMAGE */}
        {message.type === "image" && (
          <div
            className="
              space-y-1
            "
          >
            <ImageBubble
              path={message.content}
              preview={message.__optimistic ? message.localPreview : null}
            />

            {message.caption && (
              <div
                className="
                  text-sm leading-snug break-words
                "
              >
                {renderTextWithLinks(message.caption)}
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
          <div
            className="
              leading-snug break-words
            "
          >
            {renderTextWithLinks(message.content)}
          </div>
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
    <span
      className="
        flex
        items-center gap-1
      "
    >
      <FaMicrophone
        className="
          text-[11px]
        "
      />
      <span>
        Voice{duration && ` (${duration})`}
      </span>
    </span>
  );
}
