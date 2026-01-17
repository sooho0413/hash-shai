import React from 'react';
import { MessageSquare, Plus, Clock, MoreHorizontal } from 'lucide-react';

const ChatSidebar = ({ onNewChat }) => {
    // Mock Data for Chat History
    const chatHistory = [
        { id: 1, title: '리액트 컴포넌트 구조 잡기', date: '오늘' },
        { id: 2, title: 'CSS Flexbox 완벽 가이드', date: '어제' },
        { id: 3, title: '자바스크립트 비동기 처리', date: '3일 전' },
        { id: 4, title: '점심 메뉴 추천', date: '1주일 전' },
        { id: 5, title: '여행 일정 계획', date: '2주일 전' },
    ];

    return (
        <>
            <div className="chat-sidebar-container">
                {/* Header */}
                <div className="sidebar-header">
                    <button
                        className="new-chat-btn"
                        onClick={onNewChat}
                        title="새 채팅"
                    >
                        <Plus size={20} className="plus-icon" />
                        <span className="btn-text">새 채팅</span>
                    </button>
                    {/* Optional: Add collapse/expand button here if needed */}
                </div>

                {/* History List */}
                <div className="history-list-scroll">
                    <div className="section-label">최근 활동</div>
                    {chatHistory.map(chat => (
                        <div key={chat.id} className="history-item">
                            <MessageSquare size={16} className="history-icon" />
                            <span className="history-title">{chat.title}</span>
                            {/* Hover menu for delete/rename could go here */}
                        </div>
                    ))}
                </div>

                {/* Footer (optional settings or user info if not on right) */}
                {/* Right side has user profile, so maybe just simple footer here or nothing */}
            </div>

            <style>{`
                .chat-sidebar-container {
                    position: fixed;
                    left: 32px;
                    top: 24px;
                    bottom: 24px;
                    width: 260px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .chat-sidebar-container:hover {
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
                }

                .sidebar-header {
                    padding: 12px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .new-chat-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: transparent;
                    color: #333;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    /* No shadow or border in default state */
                }

                .new-chat-btn:hover {
                    background: #f0f0f0;
                    /* Simple gray hover */
                }

                .new-chat-btn:active {
                    background: #e0e0e0;
                    transform: none;
                }

                .section-label {
                    font-size: 0.75rem;
                    color: #888;
                    font-weight: 600;
                    padding: 16px 20px 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .history-list-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 12px;
                }

                .history-list-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .history-list-scroll::-webkit-scrollbar-thumb {
                    background: #ddd;
                    border-radius: 2px;
                }

                .history-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #333;
                    transition: background 0.2s;
                    margin-bottom: 2px;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .history-item:hover {
                    background: #f5f7fa;
                }

                .history-icon {
                    color: #666;
                    flex-shrink: 0;
                }

                .history-title {
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
            `}</style>
        </>
    );
};

export default ChatSidebar;
