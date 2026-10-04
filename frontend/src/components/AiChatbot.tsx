import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import type { Student } from '../types';
import '../styles/AiChatbot.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
  providerUsed?: string;
  timestamp: string;
}

interface AiChatbotProps {
  student: Student | null;
  onNavigateTab?: (tab: string) => void;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({ student, onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // API Key & Model Configuration
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'gemini'>(() => {
    return (localStorage.getItem('exambuddy_ai_provider') as any) || 'gemini';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('exambuddy_ai_key') || '';
  });
  const [model, setModel] = useState<string>(() => {
    return localStorage.getItem('exambuddy_ai_model') || '';
  });
  const [keySavedToast, setKeySavedToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize greeting and instructions
  useEffect(() => {
    const studentName = student?.name || 'Scholar';
    const semester = student?.semester || 2;
    const branch = student?.branch || 'CSE';
    const course = student?.course || 'B.Tech';

    const welcomeMsg: Message = {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello **${studentName}**! 👋 I am your **ExamBuddy AI Problem Solver**.\n\nI am equipped to **directly solve any academic questions, homework problems, math derivations, and coding tasks** for **${course} ${branch} (Semester ${semester})**.\n\n💡 **What would you like me to solve?**\n- 💻 Write & explain code in C, C++, Java, or Python\n- 📐 Solve differential equations, Laplace transforms, or linear algebra numericals\n- ⚡ Solve Booth's multiplication, K-maps, or cache memory problems\n- 📝 Debug your code or explain an exam question step-by-step`,
      actions: [
        '💻 Solve: Dijkstra in C++ with test graph',
        "⚡ Solve: Booth's algorithm (+7 * -3)",
        '📐 Solve: y" + 4y = sin(2x)',
        '🔲 Simplify K-Map: Σm(0,2,5,7,8,10,13,15)',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([welcomeMsg]);
  }, [student?.id, student?.semester]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !showSettings) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, showSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('exambuddy_ai_provider', provider);
    localStorage.setItem('exambuddy_ai_key', apiKey.trim());
    if (model) {
      localStorage.setItem('exambuddy_ai_model', model.trim());
    } else {
      localStorage.removeItem('exambuddy_ai_model');
    }
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setShowSettings(false);
    }, 1200);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const contextPayload = {
        name: student?.name,
        course: student?.course,
        branch: student?.branch,
        semester: student?.semester,
        college_name: student?.college_name,
      };

      const res = await api.sendChatMessage({
        message: query,
        history: historyPayload,
        context: contextPayload,
        api_key: apiKey.trim() || undefined,
        provider: provider,
        model: model.trim() || undefined,
      });

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        actions: res.suggested_actions,
        providerUsed: res.provider_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Could not solve problem**: ${err?.message || 'Connection error'}.\n\nPlease ensure your API key is valid in **Settings (🔑)**, or check your internet connection.`,
        actions: ['🔑 Open API Settings', 'Try again'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.includes('API Settings') || action.includes('Connect API Key') || action.includes('Configure API Key')) {
      setShowSettings(true);
      return;
    }
    if (action.includes('Suggestions') && onNavigateTab) {
      onNavigateTab('suggestions');
      return;
    }
    if (action.includes('Syllabus') && onNavigateTab) {
      onNavigateTab('syllabus');
      return;
    }
    handleSend(action);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleClear = () => {
    const studentName = student?.name || 'Scholar';
    setMessages([
      {
        id: `cleared-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. Send any question or problem you would like me to solve, **${studentName}**!`,
        actions: [
          '💻 Solve Dijkstra in C++',
          "⚡ Solve Booth's Algorithm",
          '📐 Solve Laplace transform problem',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Markdown rendering helper with support for code blocks with copy buttons
  const renderMarkdown = (content: string, msgId: string) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      // Code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        code: match[2],
        id: `${msgId}-code-${match.index}`,
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return (
      <div className="eb-chatbot-rendered-content">
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            const isCopied = copiedCodeId === part.id;
            return (
              <div key={pIdx} className="eb-chatbot-code-container">
                <div className="eb-chatbot-code-header">
                  <span className="eb-chatbot-code-lang">{part.language || 'code'}</span>
                  <button
                    type="button"
                    className="eb-chatbot-copy-btn"
                    onClick={() => handleCopyCode(part.code, part.id)}
                    title="Copy code"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isCopied ? 'check' : 'content_copy'}
                    </span>
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="eb-chatbot-pre">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          // Regular text block
          const lines = part.content.split('\n');
          return (
            <div key={pIdx}>
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return <h3 key={lIdx}>{renderInline(line.replace('### ', ''))}</h3>;
                }
                if (line.startsWith('#### ')) {
                  return <h4 key={lIdx}>{renderInline(line.replace('#### ', ''))}</h4>;
                }
                if (line.startsWith('> ')) {
                  return <blockquote key={lIdx}>{renderInline(line.replace('> ', ''))}</blockquote>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <li key={lIdx} className="eb-chatbot-li">
                      {renderInline(line.substring(2))}
                    </li>
                  );
                }
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <li key={lIdx} className="eb-chatbot-li-ordered">
                      {renderInline(line.replace(/^\d+\.\s/, ''))}
                    </li>
                  );
                }
                if (!line.trim()) {
                  return <div key={lIdx} style={{ height: '4px' }} />;
                }
                return <p key={lIdx} style={{ margin: '3px 0' }}>{renderInline(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="eb-inline-code">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return (
          <span key={i} className="eb-inline-math">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          className="eb-chatbot-launcher"
          onClick={() => setIsOpen(true)}
          title="Open AI Problem Solver"
          aria-label="Open AI Problem Solver"
        >
          <div className="eb-chatbot-icon-wrap">
            <span className="eb-chatbot-pulse" />
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <span className="eb-chatbot-launcher-text">
            Solve with AI
            <span className="eb-chatbot-launcher-badge">Tutor</span>
          </span>
        </button>
      )}

      {/* Floating Chatbot Window */}
      {isOpen && (
        <div className="eb-chatbot-window">
          {/* Header */}
          <div className="eb-chatbot-header">
            <div className="eb-chatbot-header-info">
              <div className="eb-chatbot-avatar">
                <span className="material-symbols-outlined text-[20px]">calculate</span>
              </div>
              <div>
                <h3 className="eb-chatbot-title">
                  AI Problem Solver
                  <span className="eb-chatbot-status-dot" title="Online" />
                </h3>
                <p className="eb-chatbot-subtitle">
                  {apiKey ? (
                    <span className="eb-chatbot-active-model">
                      ⚡ {provider === 'anthropic' ? 'Claude 3.5' : provider === 'openai' ? 'OpenAI GPT' : 'Gemini'}
                    </span>
                  ) : (
                    <span>Offline Engine (Tap 🔑 to connect live AI)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="eb-chatbot-header-actions">
              <button
                className={`eb-chatbot-header-btn ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                title="AI Model & API Key Settings"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
              </button>
              <button
                className="eb-chatbot-header-btn"
                onClick={handleClear}
                title="Clear conversation"
              >
                <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
              </button>
              <button
                className="eb-chatbot-header-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chatbot"
              >
                <span className="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>
          </div>

          {/* Settings Overlay Drawer */}
          {showSettings && (
            <div className="eb-chatbot-settings-panel">
              <div className="eb-chatbot-settings-header">
                <h4>🔑 Connect AI Engine</h4>
                <button
                  type="button"
                  className="eb-chatbot-close-settings"
                  onClick={() => setShowSettings(false)}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="eb-chatbot-settings-form">
                <label className="eb-settings-label">Select AI Provider:</label>
                <div className="eb-provider-selector">
                  <button
                    type="button"
                    className={`eb-provider-btn ${provider === 'anthropic' ? 'active' : ''}`}
                    onClick={() => {
                      setProvider('anthropic');
                      if (!model.includes('claude')) setModel('claude-3-5-sonnet-20241022');
                    }}
                  >
                    Anthropic Claude
                  </button>
                  <button
                    type="button"
                    className={`eb-provider-btn ${provider === 'openai' ? 'active' : ''}`}
                    onClick={() => {
                      setProvider('openai');
                      if (!model.includes('gpt')) setModel('gpt-4o-mini');
                    }}
                  >
                    OpenAI
                  </button>
                  <button
                    type="button"
                    className={`eb-provider-btn ${provider === 'gemini' ? 'active' : ''}`}
                    onClick={() => {
                      setProvider('gemini');
                      setModel('gemini-1.5-flash');
                    }}
                  >
                    Gemini (Free)
                  </button>
                </div>

                <label className="eb-settings-label" htmlFor="api-key-input">
                  {provider === 'anthropic' ? 'Anthropic API Key (sk-ant-...):' : provider === 'openai' ? 'OpenAI API Key (sk-...):' : 'Google Gemini API Key:'}
                </label>
                <input
                  id="api-key-input"
                  type="password"
                  className="eb-settings-input"
                  placeholder={provider === 'anthropic' ? 'sk-ant-api03-...' : provider === 'openai' ? 'sk-proj-...' : 'AIzaSy...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />

                <label className="eb-settings-label" htmlFor="model-select">Model Override (Optional):</label>
                <select
                  id="model-select"
                  className="eb-settings-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {provider === 'anthropic' && (
                    <>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Best for Math & Code)</option>
                      <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fastest)</option>
                    </>
                  )}
                  {provider === 'openai' && (
                    <>
                      <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Effective)</option>
                      <option value="gpt-4o">GPT-4o (Most Intelligent)</option>
                    </>
                  )}
                  {provider === 'gemini' && (
                    <>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast & Accurate)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </>
                  )}
                </select>

                <div className="eb-settings-help">
                  {provider === 'anthropic' ? (
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
                      Get an Anthropic API Key ↗
                    </a>
                  ) : provider === 'openai' ? (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                      Get an OpenAI API Key ↗
                    </a>
                  ) : (
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                      Get a Free Gemini Key (Instant) ↗
                    </a>
                  )}
                </div>

                <div className="eb-settings-actions">
                  <button type="submit" className="eb-settings-save-btn">
                    {keySavedToast ? '✅ Saved Successfully!' : 'Save & Activate'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* API Key status banner */}
          {!apiKey && !showSettings && (
            <div className="eb-chatbot-key-banner">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
              <span className="eb-key-banner-text">
                Live Google Gemini problem solver active.{' '}
                <button type="button" onClick={() => setShowSettings(true)} className="eb-key-banner-link">
                  Settings / Custom Key
                </button>
              </span>
            </div>
          )}

          {/* Messages Body */}
          <div className="eb-chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`eb-chatbot-msg-row ${m.role}`}>
                <div className={`eb-chatbot-bubble ${m.role}`}>
                  {renderMarkdown(m.content, m.id)}

                  {m.providerUsed && (
                    <div className="eb-chatbot-provider-tag">
                      ⚡ Solved via {m.providerUsed}
                    </div>
                  )}

                  {/* Suggestion & Action Chips */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="eb-chatbot-chips">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          className="eb-chatbot-chip"
                          onClick={() => handleActionClick(act)}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing / Solving Indicator */}
            {loading && (
              <div className="eb-chatbot-msg-row assistant">
                <div className="eb-chatbot-typing-container">
                  <div className="eb-chatbot-typing">
                    <span className="eb-chatbot-typing-dot" />
                    <span className="eb-chatbot-typing-dot" />
                    <span className="eb-chatbot-typing-dot" />
                  </div>
                  <span className="eb-chatbot-solving-text">Solving problem step-by-step...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            className="eb-chatbot-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="eb-chatbot-input-wrap">
              <textarea
                ref={inputRef}
                className="eb-chatbot-input"
                rows={1}
                placeholder="Paste code, math problem, or exam question to solve..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading}
              />
              <button
                type="submit"
                className="eb-chatbot-send-btn"
                disabled={!input.trim() || loading}
                title="Solve problem"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
            <div className="eb-chatbot-input-hint">
              Press <strong>Enter</strong> to solve • <strong>Shift + Enter</strong> for multi-line
            </div>
          </form>
        </div>
      )}
    </>
  );
};
