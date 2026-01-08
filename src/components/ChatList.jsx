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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onScroll() {
      const distance =
        el.scrollHeight - el.scrollTop - el.clientHeight;

      const atBottom = distance < 80;
      onReachBottom?.(atBottom);
    }

    el.addEventListener("scroll", onScroll);
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, [onReachBottom]);

  return (
    <div ref={ref} className="chat-list h-full overflow-y-auto">
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
