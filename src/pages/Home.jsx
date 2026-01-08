import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUserId } from "../hooks/useUserId";

export default function Home() {
  const nav = useNavigate();
  const userId = useUserId();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function newChat() {
    if (loading) return;
    setLoading(true);

    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { error: roomError } = await supabase.from("rooms").insert({
      code,
      expired_at: new Date(Date.now() + 30 * 60 * 1000),
    });

    if (roomError) {
      alert("Gagal membuat room");
      setLoading(false);
      return;
    }

    const { error: joinError } = await supabase.rpc("join_room", {
      p_code: code,
      p_user_id: userId,
    });

    if (joinError) {
      alert("Gagal join room");
      setLoading(false);
      return;
    }

    nav(`/room/${code}`);
  }

  function joinChat(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    nav(`/room/${joinCode.trim().toUpperCase()}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8D8]">
      <div className="text-center space-y-6">

        {/* TITLE */}
        <h1 className="text-4xl font-semibold text-[#EF9CAE]">
          One Time Chat
        </h1>

        {/* JOIN BAR */}
        <div className="flex items-center justify-center gap-2">
          {/* PLUS */}
          <button
            onClick={newChat}
            disabled={loading}
            className="
              w-11 h-11
              flex items-center justify-center
              rounded-lg
              bg-[#EF9CAE]
              text-white
              text-xl
              hover:opacity-90
              disabled:opacity-50
            "
          >
            +
          </button>

          {/* INPUT */}
          <form onSubmit={joinChat} className="flex">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder=""
              className="
                w-40 h-11
                px-4
                rounded-l-lg
                border
                border-[#EF9CAE]
                focus:outline-none
                uppercase
                text-center
              "
            />

            {/* JOIN BUTTON */}
            <button
              type="submit"
              className="
                h-11 px-4
                rounded-r-lg
                bg-[#EF9CAE]
                text-white
                font-medium
                hover:opacity-90
              "
            >
              JOIN
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
