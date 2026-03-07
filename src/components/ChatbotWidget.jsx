// Chatbot Widget - Gemini-powered conversation
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Mic, MicOff, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ChatbotWidget({ onNavigateToCanteen }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am SouEats assistant. How can I help you today?' }
    ]);
    const { cart, addToCart: contextAddToCart } = useCart();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const presetQuestions = [
        'What are the best-rated stalls right now?',
        'Suggest popular items under INR 120.',
        'Which stall has the best feedback today?',
        'Recommend a quick pickup meal.'
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open) {
            scrollToBottom();
        }
    }, [messages, loading, open]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0])
                        .map(result => result.transcript)
                        .join('');
                    setInput(transcript);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) {
            alert("Your browser does not support voice input.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInput(''); // Clear input before listening
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    }, [isListening]);

    const handleClearChat = () => {
        setMessages([
            { role: 'assistant', content: 'Chat history cleared. How can I help you?' }
        ]);
        setHasStartedChat(false);
    };

    const sendMessage = async (overrideText = '') => {
        const text = (overrideText || input).trim();
        if (!text) return;

        setHasStartedChat(true);
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
            const intent = data?.orderIntent || data?.data?.orderIntent || null;

            setMessages(prev => [...prev, { role: 'assistant', content: reply, orderIntent: intent }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, something went wrong while connecting to the AI.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = (orderIntent) => {
        if (!orderIntent || !orderIntent.items || orderIntent.items.length === 0) return;

        // Check single stall constraint against existing cart
        if (cart.length > 0 && cart[0].stallId !== orderIntent.stallId) {
            alert("Your cart already has items from a different stall. Please clear your cart first.");
            return;
        }

        // Add each item in the intent to the global cart constraint
        orderIntent.items.forEach(item => {
            contextAddToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                stallId: orderIntent.stallId,
                stallName: orderIntent.stallName || null
            }, item.quantity);
        });

        // Add a confirmation message
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Great! 🛒 I've added those items to your cart. I'm taking you to the Canteen view to proceed with payment!`
        }]);

        // Navigate the user slightly later to give them a second to read
        setTimeout(() => {
            setOpen(false); // Optionally close chat
            if (onNavigateToCanteen) onNavigateToCanteen();
        }, 1200);
    };

    return (
        <>
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
                >
                    <MessageCircle className="h-6 w-6" />
                </button>
            )}

            {open && (
                <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between p-4 text-white">
                        <div>
                            <h4 className="font-bold flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                SouEats Assistant
                            </h4>
                            <p className="text-xs text-indigo-100 mt-0.5">Powered by AI</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 1 && (
                                <button
                                    onClick={handleClearChat}
                                    title="Clear Chat"
                                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                title="Close"
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="p-4 space-y-4 flex-1 bg-gray-50 flex flex-col h-[400px]">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                                        }`}
                                >
                                    <div
                                        className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-sm shadow-md'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                                            }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-sm prose-indigo max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        a: ({ node, ...props }) => {
                                                            return (
                                                                <a {...props} className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2">
                                                                    {props.children}
                                                                </a>
                                                            )
                                                        },
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>

                                                {/* Render Cart Intent if exists */}
                                                {msg.orderIntent && msg.orderIntent.intent === 'order' && (
                                                    <div className="mt-3 bg-white rounded-lg border border-indigo-100 overflow-hidden shadow-sm">
                                                        <div className="bg-indigo-50 px-3 py-2 flex items-center justify-between border-b border-indigo-100">
                                                            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
                                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                                Order Draft
                                                            </div>
                                                            <div className="text-[10px] text-indigo-500 font-medium bg-indigo-100/50 px-1.5 py-0.5 rounded">
                                                                Single Stall Only
                                                            </div>
                                                        </div>
                                                        <div className="p-2 space-y-1">
                                                            {msg.orderIntent.items.map((item, i) => (
                                                                <div key={i} className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-700 truncate">{item.quantity}x {item.name}</span>
                                                                    <span className="text-gray-900 font-medium ml-2 font-mono">₹{item.price * item.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
                                                            <button
                                                                onClick={() => handleConfirmOrder(msg.orderIntent)}
                                                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition"
                                                            >
                                                                Confirm Order
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        {msg.role === 'user' ? 'You' : 'SouEats AI'}
                                    </span>
                                </div>
                            ))}

                            {!hasStartedChat && (
                                <div className="mt-4 pt-2">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">Try asking:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {presetQuestions.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => sendMessage(q)}
                                                disabled={loading}
                                                className="text-left rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm disabled:opacity-50"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="flex items-start">
                                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t bg-white">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 p-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') sendMessage();
                                }}
                                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder-gray-400"
                                placeholder="Type a message..."
                                disabled={loading || isListening}
                            />

                            <button
                                onClick={toggleListening}
                                disabled={loading}
                                className={`p-2 rounded-lg transition ${isListening
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title={isListening ? "Stop listening" : "Speak to write"}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </button>

                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
