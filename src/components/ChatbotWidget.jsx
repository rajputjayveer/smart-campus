// Chatbot Widget - Gemini-powered conversation
import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../services/api';

export default function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am SouEats assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text) return;

        const nextMessages = [...messages, { role: 'user', content: text }];
        setMessages(nextMessages);
        setInput('');
        setLoading(true);

        try {
            const context = nextMessages
                .slice(-6)
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            const data = await api.chatWithBot(text, context);
            const reply = data?.reply || data?.data?.reply || 'Sorry, I could not respond.';
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700"
                >
                    <MessageCircle className="h-6 w-6" />
                </button>
            )}

            {open && (
                <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div>
                            <h4 className="font-bold text-gray-800">SouEats Chat</h4>
                            <p className="text-xs text-gray-500">Ask anything</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto max-h-80">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`text-sm px-3 py-2 rounded-lg ${
                                    msg.role === 'user'
                                        ? 'bg-indigo-600 text-white ml-auto'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {msg.content}
                            </div>
                        ))}
                        {loading && (
                            <div className="text-xs text-gray-400">Typing...</div>
                        )}
                    </div>

                    <div className="p-3 border-t flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') sendMessage();
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={sendMessage}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
