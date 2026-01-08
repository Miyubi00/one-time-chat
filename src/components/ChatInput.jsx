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
  const textareaRef = useRef(null);
  const streamRef = useRef(null);

  const hasText = text.trim().length > 0;
  const hasImage = !!imageFile;

  /* ======================
     SEND MESSAGE
  ====================== */
  function handleSend() {
    if (hasImage) {
      onSendImage(imageFile, text);
      clearImage();
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      return;
    }

    if (hasText) {
      onSendText(text);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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

    streamRef.current = stream; // ✅ SIMPAN STREAM

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };


    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      if (blob.size > 0) {
        onSendVoice(blob);
      } else {
        console.warn("🎙 Voice kosong, tidak dikirim");
      }

      chunksRef.current = [];

      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
    return () => {
      clearInterval(timerRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && recording) {
        stopRecording();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [recording]);

  /* ======================
     UI
  ====================== */
  return (
    <div
      className="
        px-4 pb-4
      "
    >
      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div
          className="
            mb-2
          "
        >
          <div
            className="
              overflow-hidden
              w-40
              rounded-xl
              relative group
            "
          >
            <img
              src={imagePreview}
              alt="preview"
              className="
                object-cover
                w-full h-full
              "
            />

            {/* CANCEL IMAGE */}
            <button
              onClick={clearImage}
              className="
                hidden
                w-6 h-6
                text-white
                bg-black/60
                rounded-full
                absolute top-2 right-2 group-hover:flex items-center justify-center
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
          flex
          px-3 py-2
          bg-white
          border-2 border-[#EF9CAE] rounded-xl
          items-end gap-3
        "
      >
        {/* PLUS */}
        {!recording && (
          <>
            <button
              onClick={() => fileInputRef.current.click()}
              className="
                text-[#EF9CAE] mb-2.5 text-lg
              "
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
        <div
          className="
            flex-1
          "
        >
          {recording ? (
            <div
              className="
                flex
                text-sm mb-2.5 text-gray-600 font-mono
                items-center gap-2
              "
            >
              <FaMicrophone
                className="
                  text-[#EF9CAE]
                "
              />
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              rows={1}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Tulis pesan"
              className="
                overflow-y-auto
                w-full max-h-32
                text-sm text-gray-700 placeholder-gray-400 leading-relaxed break-words
                bg-transparent
                resize-none
                outline-none
              "
            />


          )}
        </div>

        {/* RIGHT ACTION */}
        {(hasText || hasImage) && !recording && (
          <button
            onClick={handleSend}
            className="
              flex
              w-9 h-9
              text-white
              bg-[#EF9CAE]
              rounded-lg
              items-center justify-center
            "
          >
            <FaPaperPlane
              className="
                text-sm
              "
            />
          </button>
        )}

        {!hasText && !hasImage && !recording && (
          <button
            onClick={startRecording}
            className="
              flex
              w-9 h-9
              text-white
              bg-[#EF9CAE]
              rounded-lg
              items-center justify-center
            "
          >
            <FaMicrophone />
          </button>
        )}

        {recording && (
          <button
            onClick={stopRecording}
            className="
              flex
              w-10 h-10
              text-white
              bg-red-500
              rounded-full
              items-center justify-center
            "
          >
            <FaStop />
          </button>
        )}
      </div>
    </div>
  );
}
