import React, { useState } from 'react';
import { User, Circle, Plus, Settings, X, Check, Search, Users } from 'lucide-react';

const FriendList = ({ onSelectFriend, currentUser, onUpdateProfile }) => {
    // State
    const [friends, setFriends] = useState([
        { id: 1, name: '김철수', status: 'online', avatarColor: '#FFB7B2', statusMessage: '오늘도 화이팅!' },
        { id: 2, name: '이영희', status: 'offline', avatarColor: '#B5EAD7', statusMessage: '' },
        { id: 3, name: '박지수', status: 'online', avatarColor: '#C7CEEA', statusMessage: '여행 가고 싶다' },
        { id: 4, name: '최민호', status: 'online', avatarColor: '#E2F0CB', statusMessage: '업무중...' },
        { id: 5, name: '정수진', status: 'offline', avatarColor: '#FF9AA2', statusMessage: '' },
    ]);

    // Modals
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [showGroupChatModal, setShowGroupChatModal] = useState(false);
    const [showProfileEditModal, setShowProfileEditModal] = useState(false);

    // Inputs
    const [newFriendName, setNewFriendName] = useState('');
    const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState([]);
    const [groupName, setGroupName] = useState('');

    // Profile Edit State
    const [editName, setEditName] = useState('');
    const [editStatusMessage, setEditStatusMessage] = useState('');
    const [editAvatarColor, setEditAvatarColor] = useState('');

    // --- Handlers ---

    const handleAddFriend = () => {
        if (!newFriendName.trim()) return;
        const newFriend = {
            id: Date.now(),
            name: newFriendName,
            status: 'offline', // Default offline
            avatarColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
            statusMessage: ''
        };
        setFriends(prev => [...prev, newFriend]);
        setNewFriendName('');
        setShowAddFriendModal(false);
    };

    const handleCreateGroup = () => {
        if (selectedFriendsForGroup.length === 0) return;

        const selectedFriendObjects = friends.filter(f => selectedFriendsForGroup.includes(f.id));
        const defaultName = selectedFriendObjects.map(f => f.name).join(', ');
        const finalGroupName = groupName.trim() || defaultName;

        const newGroup = {
            id: 'group_' + Date.now(),
            name: finalGroupName,
            isGroup: true,
            members: selectedFriendObjects,
            avatarColor: '#ddd', // Group avatar default
        };

        // For now, add group to friends list for selection (or separate list?)
        // Let's add it to friends list for simplicity in this UI
        setFriends(prev => [newGroup, ...prev]);

        setSelectedFriendsForGroup([]);
        setGroupName('');
        setShowGroupChatModal(false);
    };

    const handleSaveProfile = () => {
        if (onUpdateProfile) {
            onUpdateProfile({
                name: editName,
                statusMessage: editStatusMessage,
                avatarColor: editAvatarColor
            });
        }
        setShowProfileEditModal(false);
    };

    const openProfileEdit = () => {
        if (currentUser) {
            setEditName(currentUser.name);
            setEditStatusMessage(currentUser.statusMessage || '');
            setEditAvatarColor(currentUser.avatarColor);
            setShowProfileEditModal(true);
        }
    };

    const toggleFriendSelection = (id) => {
        setSelectedFriendsForGroup(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    return (
        <>
            <div className="friend-list-container">
                {/* Header */}
                <div className="friend-list-header">
                    <h3>친구 목록 <span className="friend-count">{friends.length}</span></h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => setShowAddFriendModal(true)}
                            className="icon-btn-small"
                            title="친구 추가"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
                        >
                            <Plus size={18} color="#666" />
                        </button>
                        <button
                            onClick={() => setShowGroupChatModal(true)}
                            className="icon-btn-small"
                            title="그룹 채팅 생성"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
                        >
                            <Users size={18} color="#666" />
                        </button>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="friend-list-scroll">
                    {friends.map(friend => (
                        <div key={friend.id} className="friend-item" onClick={() => onSelectFriend && onSelectFriend(friend)} style={{ cursor: 'pointer' }}>
                            <div className="friend-avatar" style={{ backgroundColor: friend.avatarColor }}>
                                {friend.isGroup ? <Users size={16} color="white" /> : <User size={16} color="white" />}
                                {!friend.isGroup && friend.status === 'online' && <div className="status-dot online" />}
                            </div>
                            <div className="friend-info">
                                <span className="friend-name">{friend.name}</span>
                                {friend.isGroup ? (
                                    <span className="friend-status">{friend.members.length}명</span>
                                ) : (
                                    <span className={`friend-status ${friend.status}`}>
                                        {friend.statusMessage || (friend.status === 'online' ? '온라인' : '오프라인')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* User Profile Footer */}
                {currentUser && (
                    <div className="friend-list-footer">
                        <div className="friend-item me-profile" style={{ cursor: 'default' }}> {/* Disable click for self chat here? Or enable? */}
                            <div className="friend-avatar" style={{ backgroundColor: currentUser.avatarColor, cursor: 'pointer' }} onClick={() => onSelectFriend && onSelectFriend(currentUser)}>
                                <User size={16} color="white" />
                            </div>
                            <div className="friend-info" style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelectFriend && onSelectFriend(currentUser)}>
                                <span className="friend-name" style={{ fontWeight: 'bold' }}>{currentUser.name}</span>
                                <span className="friend-status" style={{ fontSize: '0.7rem' }}>{currentUser.statusMessage || '나와의 채팅'}</span>
                            </div>
                            <button
                                onClick={openProfileEdit}
                                className="settings-btn"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.6 }}
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals (Simple inline styles for speed) --- */}

            {/* Add Friend Modal */}
            {showAddFriendModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>친구 추가</h4>
                            <button onClick={() => setShowAddFriendModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <input
                                type="text"
                                placeholder="이름을 입력하세요"
                                value={newFriendName}
                                onChange={(e) => setNewFriendName(e.target.value)}
                                className="modal-input"
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn primary" onClick={handleAddFriend}>추가</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Chat Modal */}
            {showGroupChatModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>대화 상대 선택</h4>
                            <button onClick={() => setShowGroupChatModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <input
                                type="text"
                                placeholder="그룹 채팅방 이름 (선택사항)"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="modal-input"
                                style={{ marginBottom: 12 }}
                            />
                            <div className="select-friend-list">
                                {friends.filter(f => !f.isGroup).map(friend => (
                                    <div
                                        key={friend.id}
                                        className={`select-friend-item ${selectedFriendsForGroup.includes(friend.id) ? 'selected' : ''}`}
                                        onClick={() => toggleFriendSelection(friend.id)}
                                    >
                                        <div className="check-circle">
                                            {selectedFriendsForGroup.includes(friend.id) && <Check size={12} color="white" />}
                                        </div>
                                        <div className="friend-avatar-small" style={{ backgroundColor: friend.avatarColor }}>
                                            <User size={12} color="white" />
                                        </div>
                                        <span>{friend.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn primary" onClick={handleCreateGroup} disabled={selectedFriendsForGroup.length === 0}>
                                확인 ({selectedFriendsForGroup.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Edit Modal */}
            {showProfileEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>프로필 편집</h4>
                            <button onClick={() => setShowProfileEditModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="profile-edit-avatar-section">
                                <div className="edit-avatar-preview" style={{ backgroundColor: editAvatarColor }}>
                                    <User size={32} color="white" />
                                </div>
                                <div className="color-picker">
                                    {['#6c757d', '#FFB7B2', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#FF9AA2', '#FFDAC1'].map(color => (
                                        <div
                                            key={color}
                                            className={`color-dot ${editAvatarColor === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setEditAvatarColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <label>이름</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="modal-input"
                            />
                            <label style={{ marginTop: 12 }}>상태 메시지</label>
                            <input
                                type="text"
                                value={editStatusMessage}
                                onChange={(e) => setEditStatusMessage(e.target.value)}
                                className="modal-input"
                                placeholder="상태 메시지 입력"
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn primary" onClick={handleSaveProfile}>저장</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(2px);
                }
                .modal-content {
                    background: white;
                    width: 320px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                    animation: scaleIn 0.2s ease;
                }
                .modal-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid #eee;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .modal-header h4 { margin: 0; font-size: 1rem; }
                .modal-header button { background: none; border: none; cursor: pointer; color: #999; }
                .modal-body { padding: 20px; }
                .modal-input {
                    width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; outline: none;
                }
                .modal-input:focus { border-color: #333; }
                .modal-footer {
                    padding: 16px 20px; border-top: 1px solid #eee; text-align: right;
                }
                .modal-btn {
                    padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem;
                }
                .modal-btn.primary { background: #333; color: white; }
                .modal-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
                
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .select-friend-list {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid #f0f0f0;
                    border-radius: 8px;
                }
                .select-friend-item {
                    display: flex; align-items: center; gap: 10px;
                    padding: 8px 12px; cursor: pointer;
                    transition: background 0.1s;
                }
                .select-friend-item:hover { background: #f9f9f9; }
                .select-friend-item.selected { background: #eef2ff; }
                .check-circle {
                    width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ddd;
                    display: flex; align-items: center; justify-content: center;
                }
                .select-friend-item.selected .check-circle {
                    background: #4285f4; border-color: #4285f4;
                }
                .friend-avatar-small {
                    width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                }

                .profile-edit-avatar-section {
                    display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 20px;
                }
                .edit-avatar-preview {
                    width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                }
                .color-picker {
                    display: flex; gap: 8px;
                }
                .color-dot {
                    width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 2px solid transparent;
                }
                .color-dot.active { border-color: #333; transform: scale(1.1); }
                
                .friend-list-header .icon-btn-small:hover {
                    background: rgba(0,0,0,0.05) !important;
                    border-radius: 4px;
                }
                .friend-item .settings-btn:hover {
                    color: #333;
                }
            `}</style>
        </>
    );
};

export default FriendList;

