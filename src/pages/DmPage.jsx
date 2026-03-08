import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import GNB from '../components/Gnb';
import { useAuth } from '../hooks/useAuth';
import { useDm } from '../hooks/useDm';
import './DmPage.css';

function DmPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const {
    rooms,
    messagesByRoom,
    isLoading,
    error,
    fetchRooms,
    createOrGetRoom,
    fetchMessages,
    sendMessage,
    markRead,
  } = useDm(accessToken);

  const [targetUserId, setTargetUserId] = useState('');
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated && accessToken) {
      fetchRooms();
    }
  }, [authLoading, isAuthenticated, accessToken, fetchRooms, navigate]);

  useEffect(() => {
    if (!activeRoomId || !accessToken) return;

    const loadMessages = async () => {
      const list = await fetchMessages(activeRoomId, { size: 30 });
      if (list.length > 0) {
        const lastId = list[list.length - 1]?.id;
        if (lastId) {
          await markRead(activeRoomId, lastId);
        }
      }
    };

    loadMessages();
  }, [activeRoomId, accessToken, fetchMessages, markRead]);

  const activeMessages = useMemo(
    () => (activeRoomId ? messagesByRoom[activeRoomId] || [] : []),
    [activeRoomId, messagesByRoom]
  );

  const handleCreateOrGetRoom = async (e) => {
    e.preventDefault();
    const parsed = Number(targetUserId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert('Enter a valid target user id.');
      return;
    }

    const room = await createOrGetRoom(parsed);
    const roomId = room?.roomId ?? room?.id;
    if (roomId) {
      setActiveRoomId(roomId);
      setTargetUserId('');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageInput.trim();

    if (!activeRoomId) {
      alert('Select a DM room first.');
      return;
    }
    if (!content) return;

    const message = await sendMessage(activeRoomId, content);
    setMessageInput('');
    if (message?.id) {
      await markRead(activeRoomId, message.id);
    }
  };

  return (
    <>
      <GNB />
      <main className="dm-container">
        <section className="dm-card">
          <header className="dm-header">
            <h1>Direct Messages</h1>
            <p>Open rooms, load messages, and send new messages.</p>
          </header>

          <form className="dm-create-form" onSubmit={handleCreateOrGetRoom}>
            <input
              type="number"
              min="1"
              placeholder="Target user id"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            />
            <button type="submit" disabled={isLoading}>
              Open room
            </button>
          </form>

          {error && <p className="dm-error">Failed to process DM request.</p>}

          <div className="dm-body">
            <aside className="dm-room-list">
              <h2>My rooms</h2>
              {rooms.length === 0 ? (
                <p className="dm-empty">No DM rooms yet.</p>
              ) : (
                rooms.map((room) => {
                  const roomId = room.roomId ?? room.id;
                  const roomName =
                    room.otherUserName ??
                    room.targetUserName ??
                    room.name ??
                    `Room #${roomId}`;

                  return (
                    <button
                      key={roomId}
                      type="button"
                      className={`dm-room-item ${activeRoomId === roomId ? 'active' : ''}`}
                      onClick={() => setActiveRoomId(roomId)}
                    >
                      <strong>{roomName}</strong>
                      {room.lastMessage && <span>{room.lastMessage}</span>}
                    </button>
                  );
                })
              )}
            </aside>

            <section className="dm-chat">
              <h2>{activeRoomId ? `Room #${activeRoomId}` : 'Select a room'}</h2>

              <div className="dm-messages">
                {activeRoomId && activeMessages.length === 0 && (
                  <p className="dm-empty">No messages in this room.</p>
                )}
                {activeMessages.map((msg) => (
                  <article className="dm-message" key={msg.id}>
                    <header>
                      <strong>{msg.senderName ?? `User #${msg.senderId}`}</strong>
                    </header>
                    <p>{msg.content}</p>
                  </article>
                ))}
              </div>

              <form className="dm-send-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type your message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!activeRoomId || isLoading}
                />
                <button type="submit" disabled={!activeRoomId || isLoading}>
                  Send
                </button>
              </form>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default DmPage;
