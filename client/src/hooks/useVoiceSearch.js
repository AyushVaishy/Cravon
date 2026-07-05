import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const getSpeechRecognition = () =>
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function useVoiceSearch({ onResult, lang = "en-IN" } = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!getSpeechRecognition());
  const recognitionRef = useRef(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser");
      return;
    }

    try {
      stop();
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        toast.error("Could not hear you. Try again.");
      };
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) onResult?.(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
      toast("Listening…", { icon: "🎤" });
    } catch {
      setListening(false);
      toast.error("Voice search failed to start");
    }
  }, [lang, onResult, stop]);

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, start, stop };
}
