import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUserId } from "../hooks/useUserId";
import { useRealtimeMessages } from "../hooks/useRealtimeMessages";
import { useRoomExpiry } from "../hooks/useRoomExpiry";
import { useRoomPresence } from "../hooks/useRoomPresence";

import ChatList from "../components/ChatList";
import ChatInput from "../components/ChatInput";
import ReplyPreview from "../components/ReplyPreview";
import ChatHeader from "../components/ChatHeader";

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const userId = useUserId();
  const scrollRef = useRef(null);


  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userColors, setUserColors] = useState({});
  const [highlightId, setHighlightId] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);


  /* ======================
     BLOCK REJOIN
  ====================== */
  useEffect(() => {
    if (localStorage.getItem(`room_exit_${code}`)) {
      navigate("/expired", { replace: true });
    }
  }, [code, navigate]);

  /* ======================
     BLOCK BACK / REFRESH
  ====================== */
  useEffect(() => {
    const preventUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", preventUnload);

    return () => {
      window.removeEventListener("beforeunload", preventUnload);
    };
  }, []);

  /* ======================
     JOIN ROOM
  ====================== */
  useEffect(() => {
    if (!userId || !code) return;

    let cancelled = false;

    async function join() {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc("join_room", {
          p_code: code,
          p_user_id: userId,
        });

        if (cancelled) return;

        if (error || !data) {
          setError("Room tidak ditemukan atau sudah expired");
          setLoading(false);
          return;
        }

        setRoomId(data);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error("JOIN ROOM ERROR:", err);
        setError("Room tidak ditemukan atau sudah expired");
        setLoading(false);
      }
    }

    join();

    return () => {
      cancelled = true;
    };
  }, [code, userId]);

  /* ======================
     EXPIRY
  ====================== */
  const { expired, remaining } = useRoomExpiry(roomId);

  useEffect(() => {
    if (expired) {
      localStorage.removeItem("last_room_code");
      localStorage.removeItem("last_room_user");
    }
  }, [expired]);

  /* ======================
     PRESENCE (ACTUAL USER)
  ====================== */
  const userCount = useRoomPresence(roomId, userId);

  /* ======================
     LOAD PARTICIPANT COLORS
  ====================== */
  useEffect(() => {
    if (!roomId) return;

    supabase
      .from("participants")
      .select("user_id, color")
      .eq("room_id", roomId)
      .then(({ data, error }) => {
        if (error) return;

        const map = {};
        data?.forEach((p) => {
          map[p.user_id] = p.color;
        });

        setUserColors(map);
      });
  }, [roomId]);

  /* ======================
     LOAD MESSAGE HISTORY
  ====================== */
  useEffect(() => {
    if (!roomId) return;

    supabase
      .from("messages_with_reply")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at")
      .then(({ data }) => setMessages(data || []));
  }, [roomId]);

  /* ======================
     REALTIME MESSAGE
  ====================== */
  useRealtimeMessages(roomId, async (msg) => {
    const { data } = await supabase
      .from("messages_with_reply")
      .select("*")
      .eq("id", msg.id)
      .single();

    if (!data) return;

    setMessages((prev) => {
      const byId = prev.findIndex((m) => m.id === data.id);
      if (byId !== -1) {
        const copy = [...prev];
        copy[byId] = { ...prev[byId], ...data };
        return copy;
      }

      const optimistic = prev.findIndex(
        (m) => m.__optimistic && m.content === data.content
      );
      if (optimistic !== -1) {
        const copy = [...prev];
        copy[optimistic] = data;
        return copy;
      }

      return [...prev, data];
    });

    // 🔔 HANYA SET INDIKATOR
    if (!isAtBottom) {
      setShowNewMessage(true);
    }
  });

  /* ======================
   REFRESH SAAT TAB AKTIF
====================== */
  useEffect(() => {
    if (!roomId) return;

    async function refetchLatest() {
      const { data } = await supabase
        .from("messages_with_reply")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at");

      if (data) {
        setMessages(data);
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        refetchLatest(); // 🔥 INI KUNCI
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [roomId]);

  /* ======================
     SEND TEXT
  ====================== */
  async function sendText(text) {
    const tempId = crypto.randomUUID();

    // 1️⃣ TAMPILKAN LANGSUNG DI UI
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        room_id: roomId,
        user_id: userId,
        type: "text",
        content: text,
        reply_to: reply?.id || null,
        reply_type: reply?.type || null,
        reply_content: reply?.content || null,
        created_at: new Date().toISOString(),
        __optimistic: true
      }
    ]);

    // 2️⃣ INSERT KE DATABASE
    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: userId,
      type: "text",
      content: text,
      reply_to: reply?.id || null
    });

    if (error) {
      console.error("SEND ERROR:", error);

      // rollback kalau gagal
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId)
      );
      return;
    }

    setReply(null);
  }
  /* ======================
     SEND VOICE
  ====================== */
  async function sendVoice(blob) {
    const messageId = crypto.randomUUID();
    const path = `${roomId}/${messageId}.webm`;

    await supabase.storage
      .from("chat-voices")
      .upload(path, blob, { contentType: "audio/webm" });

    await supabase.from("messages").insert({
      id: messageId,
      room_id: roomId,
      user_id: userId,
      type: "voice",
      content: path
    });
  }
  /* ======================
   SEND IMAGE (FINAL – SAFE)
====================== */
  async function sendImage(file, caption = "") {
    const tempId = crypto.randomUUID();
    const ext = file.name.split(".").pop();
    const path = `${roomId}/${tempId}.${ext}`;

    // 🔥 LOCAL PREVIEW (UNTUK OPTIMISTIC UI)
    const localPreview = URL.createObjectURL(file);

    // 1️⃣ OPTIMISTIC UI
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        room_id: roomId,
        user_id: userId,
        type: "image",
        content: path,
        caption: caption || null, // 👈 AMAN (tidak wajib)
        localPreview,
        reply_to: reply?.id || null,
        reply_type: reply?.type || null,
        created_at: new Date().toISOString(),
        __optimistic: true
      }
    ]);

    // 2️⃣ UPLOAD IMAGE KE STORAGE
    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(path, file, {
        contentType: file.type
      });

    if (uploadError) {
      console.error("UPLOAD IMAGE ERROR:", uploadError);
      URL.revokeObjectURL(localPreview);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    // 3️⃣ INSERT MESSAGE KE DATABASE
    const { error } = await supabase.from("messages").insert({
      id: tempId,
      room_id: roomId,
      user_id: userId,
      type: "image",
      content: path,
      caption: caption || null, // 👈 OPTIONAL
      reply_to: reply?.id || null
    });

    if (error) {
      console.error("SEND IMAGE ERROR:", error);
      URL.revokeObjectURL(localPreview);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    // 4️⃣ CLEANUP
    setReply(null);
  }

  function scrollToMessage(messageId) {
    requestAnimationFrame(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      setHighlightId(messageId);

      setTimeout(() => {
        setHighlightId(null);
      }, 2000);
    });
  }


  /* ======================
     EXIT ROOM (FINAL)
  ====================== */
  async function handleExit() {
    await supabase
      .from("room_sessions")
      .update({ exited_at: new Date().toISOString() })
      .eq("session_id", userId);

    await supabase.removeAllChannels();

    localStorage.setItem(`room_exit_${code}`, "true");
    localStorage.removeItem("last_room_code");
    localStorage.removeItem("last_room_user");

    navigate("/", { replace: true });
  }

  /* ======================
     UI STATES
  ====================== */
  if (loading) {
    return (
      <div
        className="
        flex
        min-h-screen
        bg-[#F8F8D8]
        items-center
        justify-center
      "
      >
        <div className="text-center space-y-3">
          <div
            className="
            w-8 h-8
            border-4
            border-[#EF9CAE]
            border-t-transparent
            rounded-full
            animate-spin
            mx-auto
          "
          />

          <p
            className="
            text-sm
            font-medium
            text-[#374151]
          "
          >
            Joining room...
          </p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div
        className="
        flex
        min-h-screen
        bg-[#F8F8D8]
        items-center
        justify-center
      "
      >
        <div
          className="
          text-center
          space-y-4
        "
        >
          <h2
            className="
            text-4xl
            font-semibold
            text-[#EF9CAE]
          "
          >
            Chat Expired
          </h2>

          <p
            className="
            text-sm
            text-[#374151]
          "
          >
            Room ini sudah dihapus otomatis.
          </p>

          <button
            onClick={() => navigate("/")}
            className="
            mt-2
            px-6
            py-2
            text-sm
            font-medium
            text-white
            bg-[#EF9CAE]
            rounded-lg
            hover:opacity-90
          "
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    );
  }


  /* ======================
     MAIN UI
  ====================== */
  return (
    <div
      className="
    flex
    h-screen
    bg-[#F8F8D8]
    justify-center
  "
    >
      <div
        className="
      flex flex-col
      w-full max-w-2xl h-full rounded-lg
      bg-[#F3F3D0]
      shadow-[0_0_40px_rgba(0,0,0,0.12)]
    "
      >


        {/* HEADER — FIXED DI ATAS */}
        <div
          className="
            flex-shrink-0
          "
        >
          <ChatHeader
            userCount={userCount}
            maxUser={5}
            remaining={remaining}
            roomCode={code}
            onExit={handleExit}
          />
        </div>

        {/* CHAT LIST — SATU-SATUNYA YANG SCROLL */}
        <div
          ref={scrollRef}
          className="
            flex-1 overflow-y-auto
            px-4 py-2
          "
        >
          <ChatList
            messages={messages}
            userId={userId}
            userColors={userColors}
            onReply={setReply}
            highlightId={highlightId}
            onJump={scrollToMessage}
            onReachBottom={(atBottom) => {
              setIsAtBottom(atBottom);

              if (atBottom) {
                setShowNewMessage(false);
              }
            }}

          />
        </div>

        {/* REPLY PREVIEW — NEMPEL DI BAWAH */}
        <div
          className="
            flex-shrink-0
          "
        >
          <ReplyPreview
            reply={reply}
            onCancel={() => setReply(null)}
            onJump={(id) => scrollToMessage(id)}
          />
        </div>

        {/* INPUT — FIXED DI BAWAH */}
        <div
          className="
            flex-shrink-0
          "
        >
          {showNewMessage && (
            <div
              onClick={() => {
                setShowNewMessage(false);
                const el = scrollRef.current;
                el?.scrollTo({
                  top: el.scrollHeight,
                  behavior: "smooth"
                });
              }}
              className="
                mx-4 mb-2 px-4 py-2
                text-[#3F5D2A] text-sm text-center
                bg-[#A7C97A]
                rounded-full
                cursor-pointer animate-bounce
                shadow
              "
            >
              ⬇ New message
            </div>
          )}
          <ChatInput
            onSendText={sendText}
            onSendVoice={sendVoice}
            onSendImage={sendImage}
          />
        </div>
      </div>
    </div>
  );
}
