import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  X,
  RotateCcw,
} from 'lucide-react';
import { aiApi } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { MarkdownContent } from '../../components/ui/MarkdownContent';
import { toast } from 'sonner';

const QUICK_PROMPTS = [
  'Summarize the key trends and takeaways from the responses.',
  'What are the most frequent answers or preferences?',
  'Give me 3 practical, actionable recommendations based on the data.',
  'Are there any notable patterns, correlations, or outliers in the submissions?',
];

export function AiResponseAnalystChatbot({ formId, formTitle, responseCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello! I'm **Formly AI**, your intelligent response assistant.\n\nAsk me anything about the **${responseCount} submissions** recorded for **${formTitle || 'this form'}** to uncover trends, analyze distributions, and generate actionable summaries.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: query.trim() }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await aiApi.chatResponses(formId, newMessages);
      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
          },
        ]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to get analysis. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an error while analyzing the responses. Please ensure the backend is running and try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation reset. Ask **Formly AI** anything about the ${responseCount} responses for **${formTitle}**!`,
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Button Launcher */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full shadow-2xl border border-stone-700/80 hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold tracking-tight">Formly AI</span>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
            Analyst
          </span>
        </button>
      )}

      {/* Floating Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full sm:w-[460px] h-[600px] max-h-[85vh] bg-white border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-3.5 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">Formly AI</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-2xs text-stone-300">
                  Response Analyst & Insights
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
                title="Close chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/50">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={index}
                  className={`flex gap-2.5 text-xs ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-2xs leading-relaxed ${
                      isAssistant
                        ? 'bg-white text-stone-800 border border-stone-200'
                        : 'bg-orange-500 text-white font-medium'
                    }`}
                  >
                    {isAssistant ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 text-xs justify-start items-center">
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl px-3.5 py-2 text-stone-500 flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  <span>Formly AI is analyzing responses...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 pt-2 pb-1.5 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto text-2xs no-scrollbar">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-orange-50 hover:text-orange-700 border border-stone-200 text-stone-600 transition-all shrink-0 max-w-[220px] truncate"
              >
                💡 {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputValue}
              disabled={isLoading}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ask Formly AI anything about the responses..."
              className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              isLoading={isLoading}
              disabled={!inputValue.trim() || isLoading}
              onClick={() => handleSendMessage()}
            >
              Ask
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
