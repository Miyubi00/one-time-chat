import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeMessages(roomId, onInsert) {
  useEffect(() => {
    if (!roomId) return;

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
          onInsert(payload.new); // ⬅️ KIRIM 1 ROW SAJA
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, onInsert]);
}
