import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useRoomPresence(roomId, sessionId) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!roomId || !sessionId) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: sessionId
        }
      }
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setCount(Object.keys(state).length);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          joined_at: new Date().toISOString()
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, sessionId]);

  return count;
}
