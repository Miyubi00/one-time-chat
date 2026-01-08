import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";

export default function ChatList({
  messages,
  userId,
  userColors = {},
  onReply,
  highlightId,
  onJump,
  onReachBottom,
}) {
  const ref = useRef(null);
  const isAtBottomRef = useRef(true);

  /* ======================
     SCROLL DETECTOR
  ====================== */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleScroll() {
      const distance =
        el.scrollHeight - el.scrollTop - el.clientHeight;

      const atBottom = distance < 120;

      isAtBottomRef.current = atBottom;
      onReachBottom?.(atBottom);
    }

    el.addEventListener("scroll", handleScroll);
    handleScroll(); // cek awal

    return () => el.removeEventListener("scroll", handleScroll);
  }, [onReachBottom]);

  /* ======================
     AUTO SCROLL (AMAN)
  ====================== */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!isAtBottomRef.current) return;

    // tunggu DOM (penting untuk image)
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages]);

  return (
    <div
      ref={ref}
      className="
        overflow-y-auto
        h-full
        chat-list
      "
    >
      {messages.map((m) => (
        <ChatBubble
          key={m.id}
          message={m}
          isMe={m.user_id === userId}
          color={userColors[m.user_id]}
          onReply={onReply}
          highlight={m.id === highlightId}
          onJump={onJump}
        />
      ))}
    </div>
  );
}
