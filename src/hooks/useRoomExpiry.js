import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useRoomExpiry(roomId) {
  const [expiredAt, setExpiredAt] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // Ambil expired_at dari server
    supabase
      .from("rooms")
      .select("expired_at")
      .eq("id", roomId)
      .single()
      .then(({ data }) => {
        if (data?.expired_at) {
          setExpiredAt(new Date(data.expired_at));
        }
      });
  }, [roomId]);

  useEffect(() => {
    if (!expiredAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = expiredAt - now;

      if (diff <= 0) {
        setExpired(true);
        setRemaining(0);
        clearInterval(timer);
      } else {
        setRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiredAt]);

  return { expired, remaining };
}
