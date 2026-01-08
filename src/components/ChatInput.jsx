import { useEffect, useRef, useState } from "react";
import {
  FaPlus,
  FaPaperPlane,
  FaMicrophone,
  FaStop,
  FaTimes,
} from "react-icons/fa";

export default function ChatInput({
  onSendText,
  onSendVoice,
  onSendImage, // ⬅️ DARI Room.jsx
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // IMAGE PREVIEW STATE
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasText = text.trim().length > 0;
  const hasImage = !!imageFile;

  /* ======================
     SEND MESSAGE
  ====================== */
  function handleSend() {
    if (hasImage) {
      onSendImage(imageFile, text); // image + optional text
      clearImage();
      setText("");
      return;
    }

    if (hasText) {
      onSendText(text);
      setText("");
    }
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (!file) continue;

        const preview = URL.createObjectURL(file);

        setImageFile(file);
        setImagePreview(preview);

        e.preventDefault(); // ❗ cegah paste text random
        break;
      }
    }
  }


  /* ======================
     IMAGE PICK
  ====================== */
  function pickImage(file) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }

  /* ======================
     VOICE RECORD
  ====================== */
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });
      onSendVoice(blob);
      chunksRef.current = [];
    };

    mediaRecorder.start();
    setRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  }

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  /* ======================
     UI
  ====================== */
  return (
    <div className="px-4 pb-4">
      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="mb-2">
          <div className="relative w-40 rounded-xl overflow-hidden group">
            <img
              src={imagePreview}
              alt="preview"
              className="w-full h-full object-cover"
            />

            {/* CANCEL IMAGE */}
            <button
              onClick={clearImage}
              className="
                absolute top-2 right-2
                w-6 h-6
                bg-black/60 text-white
                rounded-full
                hidden group-hover:flex
                items-center justify-center
              "
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <div
        className="
          flex items-center gap-3
          bg-white
          border-2 border-[#A7C97A]
          rounded-xl
          px-3 py-2
        "
      >
        {/* PLUS */}
        {!recording && (
          <>
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-[#A7C97A] text-lg"
            >
              <FaPlus />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pickImage(e.target.files[0])}
            />
          </>
        )}

        {/* INPUT / TIMER */}
        <div className="flex-1">
          {recording ? (
            <div className="text-sm text-gray-600 font-mono">
              🎙 {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>
          ) : (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tulis pesan"
              className="
                w-full
                bg-transparent
                outline-none
                text-sm
                text-gray-700
                placeholder-gray-400
              "
            />
          )}
        </div>

        {/* RIGHT ACTION */}
        {(hasText || hasImage) && !recording && (
          <button
            onClick={handleSend}
            className="
              w-9 h-9
              bg-[#A7C97A]
              rounded-lg
              flex items-center justify-center
              text-white
            "
          >
            <FaPaperPlane className="text-sm" />
          </button>
        )}

        {!hasText && !hasImage && !recording && (
          <button
            onClick={startRecording}
            className="
              w-9 h-9
              bg-[#A7C97A]
              rounded-lg
              flex items-center justify-center
              text-white
            "
          >
            <FaMicrophone />
          </button>
        )}

        {recording && (
          <button
            onClick={stopRecording}
            className="
              w-10 h-10
              bg-red-500
              rounded-full
              flex items-center justify-center
              text-white
            "
          >
            <FaStop />
          </button>
        )}
      </div>
    </div>
  );
}
