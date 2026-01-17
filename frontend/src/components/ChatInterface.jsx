import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Plus, Mic, MessageCircle, Sparkles, Square, CornerUpLeft, X } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import FriendList from './FriendList';

const INITIAL_ME_USER = {
    id: 'me',
    name: '나와의 채팅',
    status: 'online',
    avatarColor: '#6c757d',
    statusMessage: ''
};

const ChatInterface = () => {
    // State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isMessengerMode, setIsMessengerMode] = useState(false);
    const [showEntryAnim, setShowEntryAnim] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentFriend, setCurrentFriend] = useState(null);
    const [meUser, setMeUser] = useState(INITIAL_ME_USER);
    const [replyingTo, setReplyingTo] = useState(null); // New state for reply

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const textareaRef = useRef(null);

    // One-time Entry Animation Effect
    useEffect(() => {
        if (hasStarted && !isMessengerMode) {
            setShowEntryAnim(true);
            const timer = setTimeout(() => setShowEntryAnim(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [hasStarted]);

    // Clear Return Animation State
    useEffect(() => {
        if (isReturning) {
            const timer = setTimeout(() => setIsReturning(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isReturning]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, hasStarted, replyingTo]); // Scroll when reply state changes too

    const handleNewChat = () => {
        setHasStarted(false);
        setMessages([]);
        setInput('');
        setIsMessengerMode(false);
        setCurrentFriend(null);
        setIsReturning(true);
        setReplyingTo(null);
    };

    const handleReply = (msg) => {
        setReplyingTo(msg);
        textareaRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const startChatLogic = async (currentInput) => {
        // Capture reply state before clearing
        const currentReply = replyingTo;

        setInput('');
        setReplyingTo(null); // Clear reply state

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setHasStarted(true); // Switch to Chat Mode
        setIsTransitioning(false);

        const userMessage = {
            role: 'user',
            content: currentInput,
            replyTo: currentReply // Include reply info
        };
        setMessages(prev => [...prev, userMessage]);

        // General Messenger Mode: Just show message, no AI response
        if (isMessengerMode) {
            // If chatting with myself, NO reply
            if (currentFriend?.id === 'me') {
                return;
            }

            setIsLoading(true);
            // Simulate Friend Reply after delay
            setTimeout(() => {
                const replies = [
                    "ㅋㅋㅋ 진짜?",
                    "그래서 어떻게 됐어?",
                    "대박이다",
                    "나중에 밥 먹자!",
                    "오 그건 몰랐네",
                    "ㅇㅇ 알겠어",
                    "지금 뭐해?"
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];
                const friendMessage = {
                    role: 'friend',
                    content: randomReply,
                    avatarColor: currentFriend?.avatarColor,
                    name: currentFriend?.name
                };
                setMessages(prev => [...prev, friendMessage]);
                setIsLoading(false);
            }, 1000 + Math.random() * 1000); // 1-2s delay
            return;
        }

        try {
            setIsLoading(true); // Start AI Loading HERE

            // AbortController setup
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: currentInput, max_tokens: 4096 }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (!response.body) throw new Error('ReadableStream not supported.');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const botMsgId = Date.now().toString();
            let botMessage = { id: botMsgId, role: 'assistant', content: '' };

            // Add initial empty bot message
            setMessages(prev => [...prev, botMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                botMessage.content += chunk;

                // Update messages by ID to prevent index shifting issues
                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId ? { ...botMessage } : msg
                ));
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
                // Optional: You could add a small marker indicating stopped generation
            } else {
                console.error('Error:', error);
                const errorMessage = { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.' };
                setMessages(prev => [...prev, errorMessage]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        // Allow sending if in MessengerMode even if loading (simulated)
        if (!input.trim() || (isLoading && !isMessengerMode)) return;

        const currentInput = input;

        // 1. If on Landing Page, trigger animation first
        if (!hasStarted && !isMessengerMode) {
            setIsTransitioning(true);

            // Calculate dynamic distance to bottom
            const container = document.querySelector('.hero-input-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                // Target: The chat input sits ~40px from the bottom (padding-bottom of fixed container)
                const targetBottom = window.innerHeight - 40;
                const currentBottom = rect.bottom;
                const distance = targetBottom - currentBottom;

                container.style.setProperty('--target-translate-y', `${distance}px`);
            }

            // Wait for animation (500ms) before switching mode
            setTimeout(async () => {
                startChatLogic(currentInput);
            }, 500);
        } else {
            // Already in chat mode or messenger mode, proceed immediately
            startChatLogic(currentInput);
        }
    };

    const handleFriendSelect = (friend) => {
        if (!hasStarted) {
            // 1. Trigger Animation from Landing Page
            setIsTransitioning(true);
            setIsMessengerMode(true); // Enable mode immediately for styling
            setCurrentFriend(friend); // Show header immediately

            const container = document.querySelector('.hero-input-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                const targetBottom = window.innerHeight - 40;
                const currentBottom = rect.bottom;
                const distance = targetBottom - currentBottom;
                container.style.setProperty('--target-translate-y', `${distance}px`);
            }

            setTimeout(() => {
                setMessages([]); // Start fresh
                setHasStarted(true);
                setIsTransitioning(false);
            }, 500);
        } else {
            // Already in chat, switch instantly
            setIsMessengerMode(true);
            setCurrentFriend(friend);
            setMessages([]); // Start fresh
            setHasStarted(true);
            setIsTransitioning(false);
        }
    };

    const handleSuggestionClick = (text) => {
        setInput(text);
    };

    return (
        <>
            {/* Left Sidebar */}
            <ChatSidebar onNewChat={handleNewChat} />

            {/* Show Friend List in Home View */}
            <FriendList
                onSelectFriend={handleFriendSelect}
                currentUser={meUser}
                onUpdateProfile={(updatedProfile) => setMeUser(prev => ({ ...prev, ...updatedProfile }))}
            />

            {/* Main Content Area */}
            {/* EXISTING HOME / DM VIEW */}
            {!hasStarted ? (
                // Hero / Landing Page
                <div className="hero-container">
                    <div className="hero-profile">
                        <User size={24} />
                    </div>

                    <div className={`greeting-area ${isMessengerMode || isTransitioning ? 'fade-out' : ''}`}>
                        <span className="greeting-text greeting-highlight">수호님, 안녕하세요</span>
                        <span className="greeting-text greeting-main">무엇을 도와드릴까요?</span>
                    </div>

                    {/* Chat Header for Landing Page (Messenger Mode) */}
                    {isMessengerMode && currentFriend && (
                        <div className="chat-header-name">
                            <div className="header-avatar" style={{
                                backgroundColor: currentFriend.avatarColor || '#ccc',
                            }}>
                                <User size={20} color="white" />
                            </div>
                            <span>{currentFriend.name}</span>
                        </div>
                    )}

                    <div className={`hero-input-container ${!isMessengerMode ? 'ai-mode-glow' : ''} ${isMessengerMode || isTransitioning ? 'messenger-move-down' : ''} ${isReturning ? 'animate-return' : ''}`}>
                        <form onSubmit={handleSend} style={{ width: '100%' }}>
                            <div className="input-content-area">
                                <textarea
                                    className="hero-input"
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            if (e.nativeEvent.isComposing) return;
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    style={{
                                        resize: 'none',
                                        overflow: 'hidden',
                                        lineHeight: '1.5',
                                        maxHeight: '150px'
                                    }}
                                    placeholder={isMessengerMode ? "메시지 보내기" : "Shai에게 물어보세요"}
                                    rows={1}
                                />
                            </div>
                            <div className="input-actions-row">
                                <div className="action-left">
                                    <button type="button" className="icon-btn round-btn" onClick={() => {
                                        const container = document.querySelector('.hero-input-container');
                                        if (container) {
                                            const rect = container.getBoundingClientRect();
                                            const targetBottom = window.innerHeight - 40;
                                            const currentBottom = rect.bottom;
                                            const distance = targetBottom - currentBottom;
                                            container.style.setProperty('--target-translate-y', `${distance}px`);
                                        }
                                        const newMode = !isMessengerMode;
                                        setIsMessengerMode(newMode);
                                        if (newMode) {
                                            if (!currentFriend) setCurrentFriend(meUser);
                                        } else {
                                            if (currentFriend?.id === 'me') {
                                            } else {
                                                setCurrentFriend(null);
                                            }
                                        }
                                    }}>
                                        {isMessengerMode ? <MessageCircle size={20} /> : <Sparkles size={20} />}
                                    </button>
                                    <button type="button" className="icon-btn round-btn"><Plus size={20} /></button>
                                </div>
                                <div className="action-right">
                                    <button type="button" className="icon-btn round-btn"><Mic size={20} /></button>
                                    {input.trim() && (
                                        <button
                                            type="submit"
                                            className="icon-btn send-btn"
                                        >
                                            <Send size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                // Standard Chat Interface (Chat Mode)
                <div className="chat-mode-container" style={{ animation: showEntryAnim ? 'slideDownEnter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'none' }}>
                    {/* Chat Header: Friend Name */}
                    {currentFriend && (
                        <div className="chat-header-name">
                            <div className="header-avatar" style={{
                                backgroundColor: currentFriend.avatarColor || '#ccc',
                            }}>
                                <User size={20} color="white" />
                            </div>
                            <span>{currentFriend.name}</span>
                        </div>
                    )}

                    <div className="chat-messages-scroll" style={{ overflowX: 'hidden' }}>
                        {messages.map((msg, index) => {
                            if (msg.role === 'assistant' && !msg.content && isLoading) return null;
                            return (
                                <div key={index} className={`message ${msg.role}`}>
                                    {msg.role === 'friend' && (
                                        <div className="message-avatar" style={{
                                            backgroundColor: msg.avatarColor || '#ccc',
                                            width: 32, height: 32, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginRight: 8, flexShrink: 0
                                        }}>
                                            <User size={18} color="white" />
                                        </div>
                                    )}
                                    <div className="message-content-wrapper" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        maxWidth: '100%',
                                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' // Prevent stretching
                                    }}>
                                        {/* Reply Quote Block (Inside Message) */}
                                        {msg.replyTo && (
                                            <div className="reply-context-wrapper" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: 4,
                                                marginLeft: msg.role === 'friend' ? -15 : 0,
                                                marginRight: msg.role === 'user' ? 6 : 0, // Moved slightly left
                                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                            }}>
                                                <div className="reply-connector" style={{
                                                    width: 20,
                                                    height: 12,
                                                    borderLeft: msg.role === 'friend' ? '2px solid #ddd' : 'none',
                                                    borderRight: msg.role === 'user' ? '2px solid #ddd' : 'none',
                                                    borderTop: '2px solid #ddd',
                                                    borderTopLeftRadius: msg.role === 'friend' ? 8 : 0,
                                                    borderTopRightRadius: msg.role === 'user' ? 8 : 0,
                                                    marginRight: msg.role === 'friend' ? 6 : 0,
                                                    marginLeft: msg.role === 'user' ? 6 : 0,
                                                    marginTop: 8,
                                                    flexShrink: 0
                                                }} />

                                                <div className="reply-info" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    opacity: 0.8,
                                                    flexDirection: 'row' // Always Icon-Name-Text order
                                                }}>
                                                    {/* Small Avatar for Replied User - Simplified without extra nesting */}
                                                    <div style={{
                                                        width: 16, height: 16, borderRadius: '50%',
                                                        backgroundColor: msg.replyTo.avatarColor || '#999',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <User size={10} color="white" />
                                                    </div>

                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>
                                                        {msg.replyTo.role === 'user' ? '나' : msg.replyTo.name || '알 수 없음'}
                                                    </span>

                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: '#888',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: 150
                                                    }}>
                                                        {msg.replyTo.content}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="content" style={{ position: 'relative' }}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>

                                            {/* Reply Action Button (Visible on Hover) */}
                                            {isMessengerMode && (
                                                <button
                                                    className="reply-action-btn"
                                                    onClick={() => handleReply(msg)}
                                                    title="답장하기"
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '-12px',
                                                        top: 'auto',
                                                        right: msg.role === 'user' ? 'auto' : '-12px',
                                                        left: msg.role === 'user' ? '-12px' : 'auto',
                                                    }}
                                                >
                                                    <CornerUpLeft size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && (!isMessengerMode || currentFriend?.id === 'me') && (!messages.length || messages[messages.length - 1].role !== 'assistant' || !messages[messages.length - 1].content) && (
                            <div className="message assistant">
                                <div className="content">
                                    <div className="loading-container">
                                        <div className="loading-circle"></div>
                                        <span className="loading-text">Shai가 생각 중입니다...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isLoading && isMessengerMode && currentFriend?.id !== 'me' && (
                            <div className="message friend">
                                <div className="content" style={{ padding: '8px 12px' }}>
                                    <div className="loading-container" style={{ gap: 4 }}>
                                        <div className="loading-circle" style={{ width: 6, height: 6 }}></div>
                                        <div className="loading-circle" style={{ width: 6, height: 6, animationDelay: '0.2s' }}></div>
                                        <div className="loading-circle" style={{ width: 6, height: 6, animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={`chat-input-fixed-bottom ${!isMessengerMode ? 'ai-mode-container' : ''} ${isMessengerMode ? 'no-animation' : ''} ${showEntryAnim ? 'chat-entrance-animation' : ''}`}>
                        <form onSubmit={handleSend} className={`chat-input-wrapper ${!isMessengerMode ? 'ai-mode-glow' : ''}`}>

                            {/* Replying To Banner */}
                            {replyingTo && (
                                <div className="replying-to-banner" style={{
                                    padding: '8px 16px',
                                    background: '#f8f9fa',
                                    borderBottom: '1px solid #eee',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.9rem',
                                    color: '#555',
                                    borderRadius: '24px 24px 0 0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <CornerUpLeft size={16} />
                                        <span style={{ fontWeight: 600 }}>
                                            {replyingTo.role === 'user' ? '나' : replyingTo.name + '에게 답장'}:
                                        </span>
                                        <span style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: 200
                                        }}>
                                            {replyingTo.content}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={cancelReply}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
                                    >
                                        <X size={16} color="#999" />
                                    </button>
                                </div>
                            )}

                            <div className="input-content-area-chat">
                                <textarea
                                    ref={textareaRef}
                                    className="chat-input-field"
                                    value={input}
                                    autoFocus
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            if (e.nativeEvent.isComposing) return;
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder={isMessengerMode ? "메시지 보내기" : "Shai에게 물어보세요"}
                                    // disabled={!isMessengerMode && isLoading} -> Removed to enable input
                                    rows={1}
                                />
                            </div>
                            <div className="input-actions-row">
                                <div className="action-left">
                                    <button type="button" className="icon-btn round-btn" onClick={() => {
                                        if (isMessengerMode) {
                                            if (currentFriend?.id === 'me') {
                                                setIsMessengerMode(false);
                                            } else {
                                                setHasStarted(false);
                                                setMessages([]);
                                                setIsMessengerMode(false);
                                                setCurrentFriend(null);
                                                setIsReturning(true);
                                                setReplyingTo(null);
                                            }
                                        } else {
                                            setIsMessengerMode(true);
                                            if (!currentFriend) setCurrentFriend(meUser);
                                        }
                                    }}>
                                        {isMessengerMode ? <MessageCircle size={20} /> : <Sparkles size={20} />}
                                    </button>
                                    <button type="button" className="icon-btn round-btn"><Plus size={20} /></button>
                                </div>
                                <div className="action-right">
                                    <button type="button" className="icon-btn round-btn"><Mic size={20} /></button>
                                    {(isLoading && !isMessengerMode) ? (
                                        <button
                                            type="button"
                                            className="icon-btn send-btn"
                                            onClick={handleStop}
                                            style={{ backgroundColor: '#f0f0f0', color: '#333' }}
                                        >
                                            <Square size={16} fill="#333" />
                                        </button>
                                    ) : (
                                        input.trim() && (
                                            <button type="submit" className="icon-btn send-btn">
                                                <Send size={18} />
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="chat-disclaimer privacy-disclaimer">
                        Shai는 인물 등에 관한 잘못된 정보를 제공할 수 있으니 다시 한번 확인하세요.
                    </div>

                    {/* Add Styles for Reply Button Hover */}
                    <style>{`
                        .content {
                            position: relative;
                        }
                        .reply-action-btn {
                            position: absolute;
                            top: -10px;
                            right: -10px;
                            background: white;
                            border: 1px solid #ddd;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            opacity: 0;
                            transition: opacity 0.2s, transform 0.1s;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .content:hover .reply-action-btn {
                            opacity: 1;
                        }
                        .reply-action-btn:hover {
                            background: #f0f0f0;
                            transform: scale(1.1);
                        }
                    `}</style>
                </div>
            )}
        </>
    );
};

export default ChatInterface;
