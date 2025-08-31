import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE || "https://voice-command-shopping-assistant-2.onrender.com";

function App() {
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [micError, setMicError] = useState("");
  const [recStatus, setRecStatus] = useState("idle");
  const [manualText, setManualText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [showVoiceFeedback, setShowVoiceFeedback] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark'); // 'dark' or 'light'

  // Effect to apply theme class to body and save preference
  useEffect(() => {
    document.body.className = theme + '-mode';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const recognitionRef = useRef(null);
  const startingRef = useRef(false);
  const sessionIdRef = useRef(Math.random().toString(36).slice(2));

  const SpeechRecognition = useMemo(() => {
    return (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition ||
      null
    );
  }, []);

  useEffect(() => {
    fetchList();
    // Initialize recognition instance lazily
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(" ")
          .trim();
        if (transcript) {
          setLastHeard(transcript);
          sendToAssistant(transcript);
        }
      };

      rec.onaudiostart = () => setRecStatus("audiostart");
      rec.onsoundstart = () => setRecStatus("soundstart");
      rec.onspeechstart = () => setRecStatus("speechstart");
      rec.onstart = () => {
        setListening(true);
        startingRef.current = false;
        setRecStatus("started");
        setShowVoiceFeedback(true);
      };

      rec.onnomatch = () => {
        setAssistantReply("I didn't catch that. Please try again.");
        setRecStatus("nomatch");
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setMicError(e?.error || "Speech recognition error");
        setListening(false);
        startingRef.current = false;
        setRecStatus("error:" + (e?.error || "unknown"));
      };

      rec.onend = () => {
        setListening(false);
        startingRef.current = false;
        setRecStatus("ended");
        setTimeout(() => setShowVoiceFeedback(false), 2000);
      };

      recognitionRef.current = rec;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SpeechRecognition, language]);

  async function fetchList() {
    setListLoading(true);
    setListError("");
    try {
      console.log("Fetching list from:", `${API_BASE}/api/list`);
      const res = await fetch(`${API_BASE}/api/list`);
      console.log("List response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("List fetch error:", errorText);
        throw new Error(`List fetch failed: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log("List data received:", data);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("List fetch error:", err);
      setListError(err.message || "Failed to load list");
    } finally {
      setListLoading(false);
    }
  }

  function speak(text) {
    if (!text) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // No-op if unsupported
    }
  }

  async function sendToAssistant(text) {
    try {
      setAssistantReply("...");
      console.log("Sending to assistant:", text);
      console.log("API endpoint:", `${API_BASE}/api/dialogflow/query`);
      
      const res = await fetch(`${API_BASE}/api/dialogflow/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionIdRef.current }),
      });
      
      console.log("Assistant response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Assistant error:", errorText);
        throw new Error(`Assistant request failed: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Assistant response:", data);
      
      setAssistantReply(data.responseMessage || "");
      speak(data.responseMessage);
      
      if (data.action === "search") {
        setSearchResults(Array.isArray(data.results) ? data.results : []);
        setSubstitutes(Array.isArray(data.substitutes) ? data.substitutes : []);
        setLastAction("search");
      }
      if (data.action === "suggestions") {
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setLastAction("suggestions");
      }
      if (data.action === "substitutes") {
        setSubstitutes(Array.isArray(data.substitutes) ? data.substitutes : []);
        setLastAction("substitutes");
      }
      if (data.action === "add") {
        setLastAction("add");
      }
      if (data.action === "remove") {
        setLastAction("remove");
      }
      // Refresh list when the action likely modified it
      if (data.action === "add" || data.action === "remove" || data.action === "list") {
        fetchList();
      }
    } catch (e) {
      console.error("Assistant error:", e);
      setAssistantReply("Sorry, something went wrong talking to the assistant.");
    }
  }

  async function startListening() {
    if (!recognitionRef.current || listening || startingRef.current) return;
    try {
      setMicError("");
      startingRef.current = true;
      // Proactively request mic permission; improves reliability on some browsers
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
      setMicError(e?.message || "Microphone permission denied or unavailable.");
      startingRef.current = false;
    }
  }

  function stopListening() {
    try {
      recognitionRef.current && recognitionRef.current.stop();
    } catch (e) {
      // ignore
    }
    setListening(false);
  }

  async function handleDelete(id) {
    try {
      await fetch(`${API_BASE}/api/list/${id}`, { method: "DELETE" });
      fetchList();
    } catch (e) {
      // ignore for now
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Voice Command Shopping Assistant</h1>
        <div className="controls">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="hi-IN">हिन्दी (IN)</option>
          </select>

          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} className="btn small theme-toggle-btn">
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          {!SpeechRecognition && (
            <span className="warning">Your browser doesn't support Speech Recognition.</span>
          )}

          {SpeechRecognition && (
            <button className={listening ? "btn stop" : "btn start"} onClick={listening ? stopListening : startListening}>
              {listening ? "Stop" : "Speak"}
            </button>
          )}
        </div>
      </header>

      <section className="panel">
        <h2>
          <span className={`status-indicator status-${recStatus === "started" ? "listening" : recStatus === "error" ? "error" : "idle"}`}></span>
          Heard
        </h2>
        <div className="bubble">{lastHeard || "–"}</div>
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Status: {recStatus}</div>
      </section>

      <section className="panel">
        <h2>Assistant</h2>
        <div className="bubble reply">{assistantReply || "–"}</div>
        {micError && <div className="error" style={{ marginTop: 8 }}>{micError}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #1f2937", background: "#0a1020", color: "#e5e7eb" }}
            placeholder="Type a command (e.g., Add 2 bottles of milk)"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { sendToAssistant(manualText); setManualText(""); } }}
          />
          <button className="btn" onClick={() => { sendToAssistant(manualText); setManualText(""); }}>Send</button>
        </div>
      </section>

      <section className={`panel ${listLoading ? 'loading' : ''}`}>
        <h2>Shopping List</h2>
        {listLoading && <div className="info">Loading…</div>}
        {listError && <div className="error">{listError}</div>}
        {!listLoading && !listError && (
          <ul className="list">
            {items.map((it) => (
              <li key={it.id} className="list-item">
                <div>
                  <div className="item-name">{it.name}</div>
                  <div className="item-meta">Qty: {it.quantity} · {it.category}</div>
                </div>
                <button className="btn small" onClick={() => handleDelete(it.id)}>Remove</button>
              </li>
            ))}
            {items.length === 0 && <li className="muted">Your list is empty</li>}
          </ul>
        )}
      </section>

      {searchResults.length > 0 && (
        <section className="panel">
          <h2>Search Results</h2>
          <ul className="list">
            {searchResults.map((r) => (
              <li key={r.id} className="list-item">
                <div>
                  <div className="item-name">{r.brand} {r.name}</div>
                  <div className="item-meta">{r.size} · {r.category} · ${'{'}r.price.toFixed(2){'}'}</div>
                </div>
                <button
                  className="btn small"
                  onClick={() => sendToAssistant(`Add ${r.name}`)}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="panel">
          <h2>Smart Suggestions</h2>
          <ul className="list">
            {suggestions.map((s, idx) => (
              <li key={idx} className={`list-item ${s.priority === 'high' ? 'priority-high' : ''}`}>
                <div>
                  <div className="item-name">{s.name}</div>
                  <div className="item-meta">{s.reason}</div>
                </div>
                <button className="btn small" onClick={() => sendToAssistant(`Add ${s.name}`)}>Add</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {substitutes.length > 0 && (
        <section className="panel">
          <h2>Alternatives</h2>
          <ul className="list">
            {substitutes.map((s, idx) => (
              <li key={idx} className="list-item">
                <div>
                  <div className="item-name">{s.name}</div>
                  <div className="item-meta">{s.reason}</div>
                </div>
                <button className="btn small" onClick={() => sendToAssistant(`Add ${s.name}`)}>Add</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Voice feedback overlay */}
      {showVoiceFeedback && (
        <div className="voice-feedback">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-indicator status-listening"></span>
            <span>Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
