import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUserId } from "../hooks/useUserId";
import TopAlert from "../components/TopAlert";


export default function Home() {
  const nav = useNavigate();
  const userId = useUserId();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function resumeRoom() {
      const lastCode = localStorage.getItem("last_room_code");
      const lastUser = localStorage.getItem("last_room_user");

      if (!lastCode || !lastUser) return;

      const { data } = await supabase
        .from("rooms")
        .select("expired_at")
        .eq("code", lastCode)
        .single();

      // ❌ ROOM SUDAH TIDAK ADA / EXPIRED
      if (!data || new Date(data.expired_at) < new Date()) {
        localStorage.removeItem("last_room_code");
        localStorage.removeItem("last_room_user");
        return;
      }

      // ✅ ROOM MASIH VALID
      nav(`/room/${lastCode}`);
    }

    resumeRoom();
  }, [nav]);


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
      setAlert({ type: "error", message: "Gagal membuat room" });
      setLoading(false);
      return;
    }


    const { error: joinError } = await supabase.rpc("join_room", {
      p_code: code,
      p_user_id: userId,
    });

    if (joinError) {
      setAlert({ type: "error", message: "Gagal join room" });
      setLoading(false);
      return;
    }

    localStorage.setItem("last_room_code", code);
    localStorage.setItem("last_room_user", userId);

    nav(`/room/${code}`);
  }

  async function joinChat(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const code = joinCode.trim().toUpperCase();

    const { data } = await supabase
      .from("rooms")
      .select("expired_at")
      .eq("code", code)
      .single();

    if (!data) {
      setAlert({ type: "error", message: "Room tidak ditemukan" });
      return;
    }

    if (new Date(data.expired_at) < new Date()) {
      setAlert({ type: "error", message: "Room sudah expired" });
      return;
    }

    localStorage.setItem("last_room_code", code);
    localStorage.setItem("last_room_user", userId);

    nav(`/room/${code}`);
  }


  return (
    <>
      <TopAlert alert={alert} onClose={() => setAlert(null)} />
      <div
        className="
          flex
          min-h-screen
          bg-[#F8F8D8]
          items-center justify-center
        "
      >
        <div
          className="
            space-y-6
            text-center
          "
        >

          {/* TITLE */}
          <h1
            className="
              text-4xl font-semibold text-[#EF9CAE]
            "
          >
            One Time Chat
          </h1>

          {/* JOIN BAR */}
          <div
            className="
              flex
              items-center justify-center gap-2
            "
          >
            {/* PLUS */}
            <button
              onClick={newChat}
              disabled={loading}
              className="
                flex
                w-11 h-11
                text-white text-xl
                bg-[#EF9CAE]
                rounded-lg
                items-center justify-center hover:opacity-90 disabled:opacity-50
              "
            >
              +
            </button>

            {/* INPUT */}
            <form
              onSubmit={joinChat}
              className="
                flex
              "
            >
              <input
                id="joinCode"
                name="join_code"
                value={joinCode}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6);

                  setJoinCode(value);
                }}
                maxLength={6}
                placeholder="CODE"
                autoComplete="off"
                inputMode="text"
                className="
                  w-40 h-11
                  px-4
                  text-sm text-[#374151] text-center
                  rounded-l-lg border border-[#EF9CAE]
                  focus:outline-none uppercase
                "
              />

              {/* JOIN BUTTON */}
              <button
                type="submit"
                className="
                  h-11
                  px-4
                  text-white font-medium
                  bg-[#EF9CAE]
                  rounded-r-lg
                  hover:opacity-90
                "
              >
                JOIN
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
