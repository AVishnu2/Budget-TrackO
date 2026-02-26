import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { LuMic, LuMicOff, LuSend } from "react-icons/lu";
import { AiOutlineLoading3Quarters, AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineMessage } from "react-icons/ai";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// Helper to convert number words to digits (basic)
const numberWords = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
};
function wordsToNumber(str) {
  // Only supports up to 99 for simplicity
  if (!str) return null;
  str = str.toLowerCase();
  if (numberWords[str] !== undefined) return numberWords[str];
  const parts = str.split(" ");
  if (parts.length === 2 && numberWords[parts[0]] && numberWords[parts[1]]) {
    return numberWords[parts[0]] + numberWords[parts[1]];
  }
  return null;
}

function parseVoiceCommandRegex(text) {
  // Try to match numbers as digits
  let expenseMatch = text.match(/add expense (\d+)(?: dollars)?(?: for| on)? (.+)/i);
  if (expenseMatch) {
    return { type: "expense", amount: expenseMatch[1], description: expenseMatch[2] };
  }
  let incomeMatch = text.match(/add income (\d+)(?: dollars)?(?: from| for)? (.+)/i);
  if (incomeMatch) {
    return { type: "income", amount: incomeMatch[1], description: incomeMatch[2] };
  }
  // Try to match numbers as words
  expenseMatch = text.match(/add expense ([a-z\- ]+)(?: dollars)?(?: for| on)? (.+)/i);
  if (expenseMatch) {
    const num = wordsToNumber(expenseMatch[1]);
    if (num !== null) {
      return { type: "expense", amount: num, description: expenseMatch[2] };
    }
  }
  incomeMatch = text.match(/add income ([a-z\- ]+)(?: dollars)?(?: from| for)? (.+)/i);
  if (incomeMatch) {
    const num = wordsToNumber(incomeMatch[1]);
    if (num !== null) {
      return { type: "income", amount: num, description: incomeMatch[2] };
    }
  }
  return null;
}

export default function VoiceAgent({ mode = "add" }) {
  const [listening, setListening] = useState(false);
  const [recognized, setRecognized] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [chat, setChat] = useState([]); // [{role: 'user'|'bot', text: string, timestamp: Date}]
  const [, setIsRelevant] = useState(true);

  // Listen for suggested questions from the parent component
  useEffect(() => {
    const handleSuggestedQuestion = (event) => {
      setManualText(event.detail);
      setManual(true);
    };

    window.addEventListener('suggestedQuestion', handleSuggestedQuestion);
    return () => window.removeEventListener('suggestedQuestion', handleSuggestedQuestion);
  }, []);

  const startListening = () => {
    setError("");
    setRecognized("");
    setParsed(null);
    setSuccess("");
    setConfirming(false);
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge, or use manual input.");
      return;
    }
    setListening(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setRecognized(transcript);
      await handleParseAI(transcript);
      setListening(false);
    };
    recognition.onerror = (event) => {
      setError("Speech recognition error: " + event.error);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.start();
  };

  const handleParseAI = async (sentence) => {
    setError("");
    setParsed(null);
    setConfirming(false);
    setSuccess("");
    setLoading(true);
    setIsRelevant(true);
    
    // Add user message to chat with timestamp
    setChat((prev) => [...prev, { 
      role: "user", 
      text: sentence, 
      timestamp: new Date() 
    }]);
    
    try {
      const response = await axios.post("/api/v1/ai/parse-ai", { sentence });
      
      // Check if the response indicates the question is not relevant
      if (response.data.isRelevant === false) {
        setIsRelevant(false);
        setChat((prev) => [...prev, { 
          role: "bot", 
          text: "I can only help with financial questions related to your expenses, income, budgets, and financial insights. Please ask me something about your finances!", 
          timestamp: new Date() 
        }]);
        setLoading(false);
        return;
      }
      
      // If it's a query, show the answer directly
      if (response.data.answer) {
        setChat((prev) => [...prev, { 
          role: "bot", 
          text: response.data.answer, 
          timestamp: new Date() 
        }]);
        setLoading(false);
        return;
      }
      
      // If it's an add command, continue as before
      const data = response.data;
      if (!data.type || !data.amount || !data.description) {
        throw new Error("AI could not extract all fields");
      }
      setParsed(data);
      setConfirming(true);
    } catch (error) {
      console.error('Parse AI Error:', error);
      // Fallback to regex parsing for add commands
      const fallback = parseVoiceCommandRegex(sentence);
      if (fallback) {
        setParsed(fallback);
        setConfirming(true);
        setError("AI parsing failed, used fallback parser.");
      } else {
        // Show a specific error message based on the error type
        let botMessage = "I couldn't understand your question. Please try asking about your expenses, income, spending patterns, or financial insights.";
        
        const status = error?.response?.status;
        if (status === 429) {
          botMessage = "⚠️ The AI is currently rate-limited (too many requests). Please wait a moment and try again.";
        } else if (status === 503) {
          botMessage = "⚠️ The AI service is not configured. Please check your Gemini API key.";
        } else if (error?.code === "ERR_NETWORK" || error?.message?.includes("Network Error")) {
          botMessage = "⚠️ Network error. Please check your internet connection and try again.";
        }

        if (mode === "ask") {
          setChat((prev) => [...prev, { 
            role: "bot", 
            text: botMessage, 
            timestamp: new Date() 
          }]);
        } else {
          setError("Could not parse your input. Try: 'Add expense 50 for groceries'.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = parsed.type === "expense" ? API_PATHS.EXPENSE.ADD_EXPENSE : API_PATHS.INCOME.ADD_INCOME;
      const today = new Date().toISOString().split("T")[0];
      const payload = parsed.type === "expense"
        ? { category: parsed.description, amount: parsed.amount, date: today }
        : { source: parsed.description, amount: parsed.amount, date: today };
      await axios.post(endpoint, payload);
      setSuccess(`${parsed.type === "expense" ? "Expense" : "Income"} added: $${parsed.amount} for ${parsed.description}`);
      setChat((prev) => [...prev, { 
        role: "bot", 
        text: `✅ Added ${parsed.type}: $${parsed.amount} for ${parsed.description}`, 
        timestamp: new Date() 
      }]);
      setParsed(null);
      setConfirming(false);
    } catch (err) {
      setError("Error adding entry: " + (err.response?.data?.message || err.message));
      setChat((prev) => [...prev, { 
        role: "bot", 
        text: `❌ Error adding ${parsed.type}: ${err.response?.data?.message || err.message}`, 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    setRecognized(manualText);
    await handleParseAI(manualText);
    setManual(false);
    setManualText("");
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <AiOutlineMessage className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {mode === "add" ? "Add Transactions" : "Ask Questions"}
            </h3>
            <p className="text-sm text-gray-600">
              {mode === "add" ? "Speak or type to add income/expenses" : "Ask about your financial data"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {chat.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AiOutlineMessage size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {mode === "add" 
                ? "Start by speaking or typing to add a transaction" 
                : "Ask me anything about your finances!"
              }
            </p>
          </div>
        ) : (
          chat.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-md' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}>
                <div className="text-sm">{msg.text}</div>
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-xs">
              <div className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" size={16} />
                <span className="text-sm">TrackO-Bot is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AiOutlineCloseCircle className="text-red-500" size={16} />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <AiOutlineCheckCircle className="text-green-500" size={16} />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        {listening && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700 text-sm">Listening... Please speak your command.</span>
          </div>
        )}

        {recognized && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-gray-600 text-sm">Heard: </span>
            <span className="font-mono text-sm bg-white px-2 py-1 rounded border">{recognized}</span>
          </div>
        )}

        {confirming && parsed && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Confirm to add {parsed.type}:</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Amount:</span> <span className="font-mono">${parsed.amount}</span></div>
              <div><span className="font-medium">Description:</span> <span className="font-mono">{parsed.description}</span></div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? <AiOutlineLoading3Quarters className="animate-spin" size={16} /> : <AiOutlineCheckCircle size={16} />}
                Confirm
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                onClick={() => { setParsed(null); setConfirming(false); setRecognized(""); }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!listening && !confirming && (
          <div className="flex gap-2 mb-3">
            <button
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                SpeechRecognition 
                  ? "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={startListening}
              disabled={loading || !SpeechRecognition}
            >
              {SpeechRecognition ? <LuMic size={20} /> : <LuMicOff size={20} />}
              {SpeechRecognition ? "Speak" : "Not Supported"}
            </button>
            <button
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => { setManual(true); setError(""); setSuccess(""); }}
              disabled={loading}
            >
              Type
            </button>
          </div>
        )}

        {manual && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                type="text"
                placeholder={mode === "add" 
                  ? "e.g. Add expense 50 for groceries" 
                  : "e.g. How much did I spend this month?"
                }
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <button
                className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                onClick={handleManualSubmit}
                disabled={loading || !manualText.trim()}
              >
                {loading ? <AiOutlineLoading3Quarters className="animate-spin" size={16} /> : <LuSend size={16} />}
              </button>
            </div>
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => { setManual(false); setManualText(""); }}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-3 text-center">
          {mode === "add" ? (
            <>
              Example: <span className="font-mono">&quot;Add expense 50 for groceries&quot;</span> or <span className="font-mono">&quot;Received 2000 from salary&quot;</span>
            </>
          ) : (
            <>
              Example: <span className="font-mono">&quot;How much did I spend this month?&quot;</span> or <span className="font-mono">&quot;What&apos;s my biggest expense?&quot;</span>
            </>
          )}
          <br />
          Your voice is never recorded or sent to third parties.
        </div>
      </div>
    </div>
  );
}

VoiceAgent.propTypes = {
  mode: PropTypes.oneOf(["add", "ask"]).isRequired
}; 