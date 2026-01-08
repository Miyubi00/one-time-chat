import { formatMs } from "../utils/formatTime";

export default function ExpiryBanner({ remaining }) {
  const danger = remaining <= 5 * 60 * 1000;

  return (
    <div
      style={{
        padding: "6px 12px",
        fontSize: 12,
        background: danger ? "#dc2626" : "#1e293b",
        textAlign: "center",
      }}
    >
      ⏳ Room akan terhapus dalam {formatMs(remaining)}
    </div>
  );
}
