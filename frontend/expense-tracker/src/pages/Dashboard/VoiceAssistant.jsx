import DashboardLayout from "../../components/Layouts/DashboardLayout";
import { useState } from "react";
import { LuMic, LuMicOff, LuPlus, LuBrain } from "react-icons/lu";
import { AiOutlineMessage, AiOutlineQuestionCircle } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import VoiceAgent from "../../components/VoiceAgent";

const robotAvatar = (
  <span className="text-5xl" role="img" aria-label="robot">🤖</span>
);

const suggestedQuestions = [
  "How much did I spend this month?",
  "What's my biggest expense category?",
  "How much did I earn this month?",
  "What's my current balance?",
  "Show me my financial summary",
  "How much did I save this month?",
  "What's my average monthly expense?",
  "Which day do I spend the most?",
  "Show me my spending trends",
  "Where does my money come from?",
  "What are my top spending categories?",
  "Am I spending more on weekends?",
  "How are my expenses changing over time?",
  "What's my spending pattern?",
  "Show me my category breakdown"
];

export default function VoiceAssistant() {
  const [tab, setTab] = useState("add");
  const [showAgent, setShowAgent] = useState(false);

  return (
    <DashboardLayout activeMenu="VoiceAssistant">
      <div className="my-8 mx-auto max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {robotAvatar}
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">TrackO-Bot</h1>
              <p className="text-gray-500 text-lg">Your Intelligent Financial Assistant</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-xl">
            <button
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                tab === "add" 
                  ? "bg-primary text-white shadow-lg scale-105" 
                  : "text-gray-600 hover:text-primary hover:bg-white"
              }`}
              onClick={() => setTab("add")}
            >
              <LuPlus size={20} />
              Add Transactions
            </button>
            <button
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                tab === "ask" 
                  ? "bg-primary text-white shadow-lg scale-105" 
                  : "text-gray-600 hover:text-primary hover:bg-white"
              }`}
              onClick={() => setTab("ask")}
            >
              <LuBrain size={20} />
              Ask Questions
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {tab === "add" && (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                {/* Instructions */}
                <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AiOutlineQuestionCircle className="text-primary" />
                    How to Use Voice Input
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">For Expenses:</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• "I spent ₹50 on groceries"</li>
                        <li>• "Add ₹25 for coffee"</li>
                        <li>• "Paid ₹100 for gas"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">For Income:</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• "Received ₹2000 from salary"</li>
                        <li>• "Got ₹500 from freelance"</li>
                        <li>• "Earned ₹100 from side job"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Voice Agent Component */}
                <VoiceAgent mode="add" />
              </motion.div>
            )}

            {tab === "ask" && (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="max-w-6xl mx-auto"
              >
                {/* Ask Section Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    {robotAvatar}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Ask TrackO-Bot</h2>
                      <p className="text-gray-600">Get insights about your financial data</p>
                    </div>
                  </div>
                </div>

                {/* Side by side layout for questions and voice agent */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Suggested Questions */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <AiOutlineMessage className="text-primary" />
                      Try These Questions
                    </h3>
                    <div className="space-y-3">
                      {suggestedQuestions.map((question, index) => (
                        <motion.button
                          key={index}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-primary/10 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-primary/30"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // This will be handled by the VoiceAgent component
                            const event = new CustomEvent('suggestedQuestion', { detail: question });
                            window.dispatchEvent(event);
                          }}
                        >
                          <span className="text-gray-700 text-sm">{question}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Voice Agent for Questions */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <LuBrain className="text-primary" />
                      Ask Questions
                    </h3>
                    <VoiceAgent mode="ask" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}