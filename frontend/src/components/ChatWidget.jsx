import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: 'Hi, I can help you understand how T7 MediScan AI uses retinal & nail images and how we anchor screening results on Cardano for integrity.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const isOffTopic = (text) => {
        const lowerText = text.toLowerCase();

        // Off-topic keywords
        const offTopicKeywords = [
            'romantic', 'romance', 'love', 'dating',
            'song', 'music', 'lyrics', 'album',
            'game', 'gaming', 'video game', 'play',
            'recipe', 'cooking', 'food', 'restaurant',
            'movie', 'film', 'tv show', 'series',
            'sports', 'football', 'basketball', 'soccer',
            'weather', 'climate',
            'politics', 'election', 'government',
            'celebrity', 'actor', 'actress',
            'travel', 'vacation', 'holiday', 'tourism',
            'shopping', 'buy', 'purchase', 'store',
            'joke', 'funny', 'humor', 'meme'
        ];

        // Relevant keywords (if present, likely on-topic)
        const relevantKeywords = [
            'screening', 'diabetes', 'medical', 'health', 'patient',
            'ai', 'artificial intelligence', 'model', 'analysis',
            'cardano', 'blockchain', 'did', 'verification', 'transaction',
            'risk', 'assessment', 'biomarker', 'retinal', 'nail',
            'report', 'pdf', 'result', 'confidence',
            't7', 'mediscan', 'app', 'system', 'tool'
        ];

        // Check if message contains relevant keywords
        const hasRelevantKeyword = relevantKeywords.some(keyword =>
            lowerText.includes(keyword)
        );

        // If it has relevant keywords, it's on-topic
        if (hasRelevantKeyword) {
            return false;
        }

        // Check if message contains off-topic keywords
        const hasOffTopicKeyword = offTopicKeywords.some(keyword =>
            lowerText.includes(keyword)
        );

        return hasOffTopicKeyword;
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, userMessage]);
        const userInput = inputValue;
        setInputValue('');

        // Pre-filter: Check if message is off-topic
        if (isOffTopic(userInput)) {
            const rejectionMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'I\'m only allowed to discuss the T7 MediScan AI screening system and Cardano verification. Please ask something related to that.'
            };
            setMessages(prev => [...prev, rejectionMessage]);
            return;
        }

        setIsTyping(true);

        try {
            // Prepare messages array with system message first
            const systemMessage = {
                role: 'system',
                content: 'You are T7 MediScan Assistant. Only answer questions related to this diabetes screening app, its AI model, Cardano integration, and report interpretation. If off-topic, say you are limited to this domain.'
            };

            // Build full conversation history
            const conversationMessages = [
                systemMessage,
                ...messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: userInput
                }
            ];

            // Call API via service (handles auth headers)
            const data = await api.chat(conversationMessages);

            const botMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.reply || 'I received your message but couldn\'t generate a response.'
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat API error:', error);

            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'The assistant is currently unavailable. Please try again.'
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-slate-800 hover:bg-slate-900 text-white rounded-full p-3 shadow-sm z-50 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open chat"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </motion.button>

            {/* Slide-over Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black bg-opacity-30 z-40"
                        />

                        {/* Chat Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full sm:w-80 bg-white dark:bg-slate-800/30 border-l border-slate-200 dark:border-slate-700/40 shadow-sm z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700/40">
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">T7 Assistant</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Ask about screening workflow, AI model, or Cardano verification.</div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-2 overflow-auto space-y-2 bg-slate-50 dark:bg-slate-900">
                                {messages.map((m, i) => (
                                    <div key={i} className={`max-w-full ${m.role === 'assistant' ? 'self-start' : 'self-end'}`}>
                                        <div className={`px-3 py-2 text-sm rounded-md ${m.role === 'assistant' ? 'bg-white dark:bg-slate-900/25 text-slate-800' : 'bg-slate-800 text-white'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-slate-900/25 border border-slate-100 dark:border-slate-700 rounded-md p-2">
                                            <div className="flex space-x-2">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="px-2 py-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center gap-2 bg-white dark:bg-slate-800/30">
                                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700/40 bg-transparent text-sm text-slate-800 dark:text-slate-100" placeholder="Ask about workflow or results..." />
                                <button onClick={handleSend} className="px-3 py-2 rounded-md bg-slate-800 text-white text-sm">Send</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;
