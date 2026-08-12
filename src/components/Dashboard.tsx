import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Send, FileText, LogOut, MessageSquare, Plus, Hammer, CloudUpload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';

interface Document {
  id: number;
  filename: string;
  upload_date: string;
}

interface Message {
  text: string;
  isUser: boolean;
  sources?: string[];
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({});
  
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents/');
      setDocuments(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const loadSessionHistory = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    try {
      const res = await api.get(`/sessions/${sessionId}/history`);
      const loadedMessages: Message[] = [];
      res.data.forEach((item: any) => {
        loadedMessages.push({ text: item.user_message, isUser: true });
        loadedMessages.push({ text: item.ai_response, isUser: false });
      });
      setMessages(loadedMessages);
    } catch (err) {
      console.error("Failed to load session history:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    try {
      await api.post('/documents/', formData);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (id: number) => {
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = inputMessage;
    setMessages(prev => [...prev, { text: newMsg, isUser: true }]);
    setInputMessage('');
    setIsChatting(true);

    try {
      const payload: any = { message: newMsg };
      if (activeSessionId) {
        payload.session_id = activeSessionId;
      }
      
      const res = await api.post('/chat', payload);
      
      setMessages(prev => [...prev, { 
        text: res.data.response, 
        isUser: false,
        sources: res.data.sources 
      }]);

      if (res.data.session_id && res.data.session_id !== activeSessionId) {
        setActiveSessionId(res.data.session_id);
        fetchSessions();
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { text: 'Error communicating with AI.', isUser: false }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setExpandedSources({});
  };

  const toggleSource = (msgIdx: number, srcId: string | number) => {
    const key = `${msgIdx}-${srcId}`;
    setExpandedSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-gray-900 overflow-hidden p-3 md:p-5 gap-3 md:gap-5">
      
      {/* Left Panel - Sidebar Card */}
      <div className="w-[280px] bg-slate-50 border-r border-gray-100 flex flex-col z-10 flex-shrink-0 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header & New Chat Button */}
        <div className="p-5 bg-slate-50">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center space-x-2 text-slate-800">
              <Hammer size={20} strokeWidth={2.5} className="text-slate-700" />
              <h2 className="text-[17px] font-bold tracking-tight">BigHammer AI</h2>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-cyan-700 hover:bg-cyan-800 text-white py-2.5 px-4 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Knowledge Base Section */}
          <div className="px-5 pb-5 border-b border-gray-200/60">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Knowledge Base</h3>
            
            <label className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-cyan-600 hover:bg-cyan-50 rounded-lg cursor-pointer transition-colors bg-white mb-4 group shadow-sm">
              <CloudUpload size={16} className="text-cyan-600" />
              <span className="text-xs font-semibold text-cyan-700">
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </span>
              <input type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={handleFileUpload} disabled={isUploading} />
            </label>

            <div className="space-y-1.5">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 hover:border-slate-200 rounded-lg group transition-all shadow-sm">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="text-slate-400 flex-shrink-0" size={14} />
                    <span className="text-xs text-slate-600 truncate font-medium">{doc.filename}</span>
                  </div>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center text-slate-400 text-xs mt-3 italic font-medium">No documents uploaded.</p>
              )}
            </div>
          </div>
          
          {/* Chat Sessions Section */}
          <div className="p-5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Chat Sessions</h3>
            <div className="space-y-1.5">
              {sessions.map((session) => (
                <button 
                  key={session.id} 
                  onClick={() => loadSessionHistory(session.id)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all text-left ${
                    activeSessionId === session.id 
                    ? 'bg-slate-200/70 text-slate-800 font-semibold' 
                    : 'bg-transparent hover:bg-slate-100 text-slate-600 font-medium'
                  }`}
                >
                  <MessageSquare size={14} className={activeSessionId === session.id ? 'text-slate-600 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
                  <span className="text-xs truncate">{session.title}</span>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-slate-400 text-xs mt-3 italic font-medium">No past sessions.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Main Chat Card */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-800">
              <MessageSquare size={44} strokeWidth={1.5} className="text-slate-700 mb-6" />
              <h2 className="text-[22px] font-bold mb-3 tracking-tight">Welcome to BigHammer AI</h2>
              <p className="text-slate-500 text-sm font-medium">Upload a document and ask a question to begin a new chat session.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-6`}>
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 shadow-sm ${msg.isUser ? 'bg-cyan-700 text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'}`}>
                    
                    {msg.isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-slate-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-200">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Sources Referenced:</p>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          {(() => {
                            const isExpanded = expandedSources[`${idx}-combined`];
                            const combinedSources = msg.sources.join('\n\n---\n\n');
                            return (
                              <div className="flex flex-col">
                                <button 
                                  onClick={() => toggleSource(idx, 'combined')}
                                  className="text-[12px] font-semibold text-slate-500 hover:text-cyan-700 transition-colors flex items-center w-max"
                                >
                                  {isExpanded ? 'Hide source context' : `View retrieved context (${msg.sources.length} chunks)`}
                                </button>
                                {isExpanded && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 prose prose-xs max-w-none text-slate-500">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {combinedSources}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isChatting && (
                <div className="flex justify-start mb-6">
                  <div className="max-w-[75%] rounded-2xl rounded-tl-sm p-5 bg-slate-50 border border-slate-100 shadow-sm flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Pill Area */}
        <div className="w-full pb-6 pt-2 flex-shrink-0 z-10 px-4">
          <div className="max-w-3xl mx-auto w-full relative flex flex-col items-center">
            
            <form onSubmit={handleSendMessage} className="w-full relative flex items-center bg-slate-100/80 backdrop-blur-md shadow-md rounded-full overflow-hidden border border-slate-200/60 focus-within:bg-white focus-within:shadow-lg focus-within:border-cyan-200 transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent px-6 py-4 outline-none text-slate-800 placeholder-slate-500 text-[15px] font-medium"
                placeholder="Ask BigHammer AI..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isChatting}
              />
              <div className="pr-3 py-2 flex-shrink-0">
                <button
                  type="submit"
                  disabled={isChatting || !inputMessage.trim()}
                  className={`p-2 rounded-full transition-all flex items-center justify-center ${
                    inputMessage.trim() && !isChatting 
                    ? 'text-cyan-700 hover:bg-cyan-50' 
                    : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Send size={22} className="ml-0.5 transform rotate-45" />
                </button>
              </div>
            </form>
            
            <div className="text-center mt-3 text-[11px] font-medium text-slate-400">
              BigHammer AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
