import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    const role = localStorage.getItem('userRole');
    const roleLabel = role === 'admin' ? 'Admin Help' : role === 'staff' ? 'Staff Help' : 'QuickShip Help Center';

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            sendMessage('', true);
        }
    }, [isOpen]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (text, isGreeting = false) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!isGreeting) {
            setMessages(prev => [...prev, { from: 'user', text }]);
        }
        setLoading(true);

        try {
            const res = await axios.post(
                'http://localhost:5000/api/chatbot/message',
                { message: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { reply, items, suggestions } = res.data;
            setMessages(prev => [...prev, { from: 'bot', text: reply, items, suggestions }]);
        } catch (err) {
            setMessages(prev => [...prev, { from: 'bot', text: "Unable to reach support right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;
        setInput('');
        sendMessage(text);
    };

    const handleSuggestionClick = (text) => {
        if (loading) return;
        sendMessage(text);
    };

    if (!role) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(o => !o)}
                className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
                aria-label="Open QuickShip Help Center"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[9998] w-[360px] max-w-[90vw] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                        <span className="font-semibold">{roleLabel}</span>
                        <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.from === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                                    {m.text}

                                    {Array.isArray(m.items) && m.items.length > 0 && (
                                        <div className="mt-2 space-y-1.5">
                                            {m.items.map((it, idx) => (
                                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                                                    <div className="flex justify-between font-semibold text-slate-700">
                                                        <span>{it.title}</span>
                                                        {it.status && <span className="text-blue-600">{it.status}</span>}
                                                    </div>
                                                    {it.subtitle && <div className="text-slate-500">{it.subtitle}</div>}
                                                    {it.extra && <div className="text-slate-500">{it.extra}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {m.suggestions.map((s, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSuggestionClick(s)}
                                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2">
                                    <Loader2 size={16} className="animate-spin text-blue-600" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white flex items-center justify-center transition"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatbotWidget;
