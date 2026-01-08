import { FaUser } from "react-icons/fa";
import { IoExitOutline } from "react-icons/io5";
import { formatMs } from "../utils/formatTime";

export default function ChatHeader({
  userCount = 1,
  maxUser = 5,
  remaining,
  roomCode,
  onExit
}) {
  return (
    <div className="px-4 pt-4 select-none">
      <div
        className="
          bg-[#A7C97A]
          rounded-xl
          px-4 py-3
          flex items-center justify-between
          text-[#3F5D2A]
          font-medium
          shadow-md
        "
      >
        {/* LEFT — USER COUNT */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
            <FaUser className="text-lg" />
          </div>
          <span className="font-semibold">
            {userCount}/{maxUser}
          </span>
        </div>

        {/* CENTER — ROOM CODE */}
        <div className="text-sm font-bold tracking-widest uppercase">
          {roomCode}
        </div>

        {/* RIGHT — TIMER + EXIT */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold tabular-nums">
            {formatMs(remaining)}
          </div>

          <button
            onClick={onExit}
            title="Exit room"
            className="
              p-2 rounded-full
              hover:bg-black/10
              active:scale-95
              transition
            "
          >
            {/* EXIT ICON */}
            <IoExitOutline className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
