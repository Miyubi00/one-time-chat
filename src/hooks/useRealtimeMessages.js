import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeMessages(roomId, onInsert) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    function subscribe() {
      // 🔥 pastikan tidak dobel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`room-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            onInsert?.(payload.new); // ✅ tetap 1 row
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("🟢 Realtime subscribed:", roomId);
          }
        });

      channelRef.current = channel;
    }

    // 🔗 initial subscribe
    subscribe();

    // 👀 TAB VISIBILITY FIX (INI KUNCI)
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        subscribe(); // 🔥 re-subscribe saat balik tab
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, onInsert]);
}
