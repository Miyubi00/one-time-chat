import { useEffect } from "react";
import { FaTimesCircle, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

export default function TopAlert({ alert, onClose }) {
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [alert, onClose]);

  if (!alert) return null;

  const config = {
    error: {
      bg: "bg-[#F6A6B2]",
      icon: <FaTimesCircle className="text-white text-xl" />,
    },
    success: {
      bg: "bg-[#9ED39E]",
      icon: <FaCheckCircle className="text-white text-xl" />,
    },
    info: {
      bg: "bg-[#F7D77A]",
      icon: <FaInfoCircle className="text-white text-xl" />,
    },
  };

  const style = config[alert.type || "info"];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`
          flex items-center gap-3
          px-5 py-3
          rounded-full shadow-lg
          text-white font-medium
          animate-slideDown
          ${style.bg}
        `}
      >
        {style.icon}
        <span>{alert.message}</span>
      </div>
    </div>
  );
}
