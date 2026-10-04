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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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
      content: `Hello **${studentName}**! 👋 I am your **ExamBuddy AI Problem Solver**, powered by **Backboard.io**.\n\nI am equipped to **directly solve any academic questions, homework problems, math derivations, and coding tasks** for **${course} ${branch} (Semester ${semester})**.\n\n💡 **What would you like me to solve?**\n- 💻 Write & explain code in C, C++, Java, or Python\n- 📐 Solve differential equations, Laplace transforms, or linear algebra numericals\n- ⚡ Solve Booth's multiplication, K-maps, or cache memory problems\n- 📝 Debug your code or explain an exam question step-by-step`,
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
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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
        provider: 'backboard',
      });

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        actions: res.suggested_actions,
        providerUsed: res.provider_used || 'Backboard.io',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Could not solve problem**: ${err?.message || 'Connection error'}.\n\nPlease check your internet connection or try again.`,
        actions: ['Try again', 'Show practice problem'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
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
                  <span className="eb-chatbot-active-model" style={{ color: '#86efac', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚡ Powered by Backboard.io
                  </span>
                </p>
              </div>
            </div>

            <div className="eb-chatbot-header-actions">
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
