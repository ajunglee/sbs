import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import GNB from '../components/Gnb';
import { useAuth } from '../hooks/useAuth';
import { useDm } from '../hooks/useDm';
import dmService from '../services/dmService';
import './DmPage.css';

const ROOM_LEFT_NOTICE_SUFFIX = '\uB2D8\uC774 \uB098\uAC14\uC2B5\uB2C8\uB2E4.';
const FALLBACK_ROOM_NAME = '\uC774\uB984 \uC5C6\uC74C';


function DmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const {
    rooms,
    messagesByRoom,
    isLoading,
    error,
    fetchRooms,
    createOrGetRoom,
    findUserByEmail,
    fetchMessages,
    sendMessage,
    markRead,
    leaveRoom,
  } = useDm(accessToken);

  const [targetUserQuery, setTargetUserQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [roomNameMap, setRoomNameMap] = useState({});
  const [hiddenRoomIds, setHiddenRoomIds] = useState({});
  const handledLocationKeyRef = useRef('');
  const hydratedRoomIdsRef = useRef({});
  const userNameByIdCacheRef = useRef({});
  const roomNameStorageKey = `dm_room_names_${user?.id ?? 'anonymous'}`;
  const hiddenRoomsStorageKey = `dm_hidden_rooms_${user?.id ?? 'anonymous'}`;

  const normalizeName = (value) => String(value || '').trim().toLowerCase();

  const isCurrentUserName = (value) => {
    const candidate = normalizeName(value);
    const currentUserName = normalizeName(user?.name);
    return Boolean(candidate && currentUserName && candidate === currentUserName);
  };

  const getRoomNameCandidates = (room) => [
    { name: room?.otherUserName, id: room?.otherUserId ?? room?.otherUser?.id },
    { name: room?.targetUserName, id: room?.targetUserId ?? room?.targetUser?.id },
    { name: room?.otherUser?.name, id: room?.otherUser?.id },
    { name: room?.targetUser?.name, id: room?.targetUser?.id },
    { name: room?.senderName, id: room?.senderId ?? room?.sender?.id },
    { name: room?.receiverName, id: room?.receiverId ?? room?.receiver?.id },
    { name: room?.sender?.name, id: room?.sender?.id },
    { name: room?.receiver?.name, id: room?.receiver?.id },
    { name: room?.name, id: room?.userId ?? room?.memberId ?? null },
  ];

  const inferCounterpartId = (room, messages) => {
    const directCandidates = [
      room?.otherUserId,
      room?.targetUserId,
      room?.otherUser?.id,
      room?.targetUser?.id,
      room?.senderId,
      room?.receiverId,
      room?.sender?.id,
      room?.receiver?.id,
    ];

    for (const candidate of directCandidates) {
      const normalizedId = Number(candidate);
      if (!Number.isFinite(normalizedId)) continue;
      if (user?.id && normalizedId === Number(user.id)) continue;
      return normalizedId;
    }

    if (!Array.isArray(messages)) return null;
    for (const msg of messages) {
      const senderId = msg?.senderId ?? msg?.sender?.id;
      const receiverId = msg?.receiverId ?? msg?.receiver?.id;

      if (senderId && (!user?.id || Number(senderId) !== Number(user.id))) {
        return Number(senderId);
      }
      if (receiverId && (!user?.id || Number(receiverId) !== Number(user.id))) {
        return Number(receiverId);
      }
    }
    return null;
  };

  const extractRoomName = (room, messages = []) => {
    const counterpartId = inferCounterpartId(room, messages);
    const candidates = getRoomNameCandidates(room);

    if (counterpartId) {
      for (const candidate of candidates) {
        const trimmedName = String(candidate?.name || '').trim();
        const candidateId = Number(candidate?.id);
        if (!trimmedName || !Number.isFinite(candidateId)) continue;
        if (candidateId === Number(counterpartId)) {
          return trimmedName;
        }
      }
    }

    for (const candidate of candidates) {
      const trimmedName = String(candidate?.name || '').trim();
      if (!trimmedName) continue;

      const candidateId = Number(candidate?.id);
      if (user?.id && Number.isFinite(candidateId) && candidateId === Number(user.id)) {
        continue;
      }
      if (!isCurrentUserName(trimmedName)) {
        return trimmedName;
      }
    }

    return '';
  };

  const saveRoomName = (roomId, name) => {
    const trimmed = String(name || '').trim();
    if (!roomId || !trimmed) return;
    setRoomNameMap((prev) => {
      if (prev[roomId] === trimmed) return prev;
      return { ...prev, [roomId]: trimmed };
    });
  };

  const inferCounterpartNameFromMessages = (room, messages) => {
    const counterpartId = inferCounterpartId(room, messages);
    if (!counterpartId || !Array.isArray(messages)) return '';

    for (const msg of messages) {
      const senderId = msg?.senderId ?? msg?.sender?.id;
      const receiverId = msg?.receiverId ?? msg?.receiver?.id;

      if (senderId && Number(senderId) === Number(counterpartId)) {
        return (
          msg?.senderName ??
          msg?.senderUserName ??
          msg?.senderProfileName ??
          msg?.sender?.name ??
          ''
        );
      }

      if (receiverId && Number(receiverId) === Number(counterpartId)) {
        return (
          msg?.receiverName ??
          msg?.receiverUserName ??
          msg?.receiverProfileName ??
          msg?.receiver?.name ??
          ''
        );
      }
    }

    return '';
  };

  const getRoomDisplayName = (room) => {
    const roomId = room?.roomId ?? room?.id;
    const roomMessages = messagesByRoom[roomId] || [];
    const inferredFromRoom = extractRoomName(room, roomMessages);
    const inferredFromMessages = inferCounterpartNameFromMessages(room, roomMessages);
    return inferredFromRoom || inferredFromMessages || roomNameMap[roomId] || FALLBACK_ROOM_NAME;
  };

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(roomNameStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      setRoomNameMap(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setRoomNameMap({});
    }
  }, [roomNameStorageKey]);

  useEffect(() => {
    localStorage.setItem(roomNameStorageKey, JSON.stringify(roomNameMap));
  }, [roomNameMap, roomNameStorageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(hiddenRoomsStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      setHiddenRoomIds(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setHiddenRoomIds({});
    }
  }, [hiddenRoomsStorageKey]);

  useEffect(() => {
    localStorage.setItem(hiddenRoomsStorageKey, JSON.stringify(hiddenRoomIds));
  }, [hiddenRoomIds, hiddenRoomsStorageKey]);

  const visibleRooms = useMemo(
    () => rooms.filter((room) => {
      const roomId = room.roomId ?? room.id;
      return !hiddenRoomIds[roomId];
    }),
    [rooms, hiddenRoomIds]
  );

  useEffect(() => {
    visibleRooms.forEach((room) => {
      const roomId = room.roomId ?? room.id;
      const roomName = extractRoomName(room, messagesByRoom[roomId] || []);
      if (roomId && roomName) {
        saveRoomName(roomId, roomName);
      }
    });
  }, [visibleRooms, messagesByRoom]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const roomIdsToValidate = visibleRooms
      .map((room) => room.roomId ?? room.id)
      .filter((roomId) => roomId);

    if (roomIdsToValidate.length === 0) return;
    let isCancelled = false;

    const hydrateRoomNames = async () => {
      for (const roomId of roomIdsToValidate) {
        if (hydratedRoomIdsRef.current[roomId]) continue;
        hydratedRoomIdsRef.current[roomId] = true;

        try {
          const room = visibleRooms.find((r) => (r.roomId ?? r.id) === roomId) || null;
          const messages = await dmService.getMessages(accessToken, roomId, { size: 10 });
          if (isCancelled) return;

          const inferred = inferCounterpartNameFromMessages(room, messages);
          if (inferred && inferred !== roomNameMap[roomId]) {
            saveRoomName(roomId, inferred);
            continue;
          }

          const counterpartId = inferCounterpartId(room, messages);
          if (!counterpartId) continue;

          const cachedName = userNameByIdCacheRef.current[counterpartId];
          if (cachedName && cachedName !== roomNameMap[roomId]) {
            saveRoomName(roomId, cachedName);
            continue;
          }

          const foundUser = await dmService.findUserById(accessToken, counterpartId);
          if (isCancelled) return;
          const foundName = foundUser?.name?.trim();
          if (foundName && foundName !== roomNameMap[roomId]) {
            userNameByIdCacheRef.current[counterpartId] = foundName;
            saveRoomName(roomId, foundName);
          }
        } catch {
          // Keep fallback name when room message hydration fails.
        }
      }
    };

    hydrateRoomNames();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, accessToken, visibleRooms, roomNameMap, user?.id, user?.name]);

  useEffect(() => {
    const target = location.state?.dmTargetUser;
    if (!target?.id || !isAuthenticated || !accessToken) return;

    const locationKey = location.key || `${target.id}`;
    if (handledLocationKeyRef.current === locationKey) return;
    handledLocationKeyRef.current = locationKey;

    const openDmRoom = async () => {
      if (user?.id && Number(user.id) === Number(target.id)) {
        alert('\uBCF8\uC778\uACFC\uC758 \uCC44\uD305\uBC29\uC740 \uB9CC\uB4E4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
        navigate('/dm', { replace: true, state: null });
        return;
      }

      setSearchedUser({
        id: target.id,
        name: target.name || `사용자 #${target.id}`,
        email: target.email || '',
        profileImage: target.profileImage || null,
      });

      const room = await createOrGetRoom(target.id);
      const roomId = room?.roomId ?? room?.id;
      if (roomId) {
        setHiddenRoomIds((prev) => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        });
        saveRoomName(roomId, target.name || '');
        setActiveRoomId(roomId);
        setMessageInput('');
      }

      navigate('/dm', { replace: true, state: null });
    };

    openDmRoom();
  }, [location, isAuthenticated, accessToken, user, createOrGetRoom, navigate]);

  const activeMessages = useMemo(
    () => (activeRoomId ? messagesByRoom[activeRoomId] || [] : []),
    [activeRoomId, messagesByRoom]
  );
  const activeRoom = useMemo(
    () => visibleRooms.find((room) => (room.roomId ?? room.id) === activeRoomId) || null,
    [visibleRooms, activeRoomId]
  );
  const activeRoomName = getRoomDisplayName(activeRoom) || searchedUser?.name || FALLBACK_ROOM_NAME;
  const isChatView = Boolean(activeRoomId);

  useEffect(() => {
    if (!activeRoomId) return;
    const inferredName = inferCounterpartNameFromMessages(activeRoom, activeMessages);

    if (inferredName && inferredName !== roomNameMap[activeRoomId]) {
      saveRoomName(activeRoomId, inferredName);
    }
  }, [activeRoomId, activeMessages, activeRoom, roomNameMap, user]);

  const resolveSenderName = (msg) => {
    if (!msg) return '';

    const named =
      msg.senderName ??
      msg.senderUserName ??
      msg.senderProfileName ??
      msg.sender?.name;
    if (named) return named;

    if (user?.id && Number(msg.senderId) === Number(user.id)) {
      return user.name || '\uB098';
    }
    return activeRoomName || FALLBACK_ROOM_NAME;
  };

  const isMyMessage = (msg) => {
    if (!msg) return false;
    const senderId = msg.senderId ?? msg.sender?.id;
    if (user?.id && senderId) {
      return Number(senderId) === Number(user.id);
    }
    return false;
  };

  const formatMessageTime = (msg) => {
    const raw =
      msg?.createdAt ??
      msg?.sentAt ??
      msg?.timestamp ??
      msg?.createdDate ??
      null;
    if (!raw) return '';

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const isLeaveNoticeMessage = (msg) => {
    const content = String(msg?.content || '').trim();
    if (!content) return false;

    return (
      content.endsWith(ROOM_LEFT_NOTICE_SUFFIX) ||
      /님이\s*나갔습니다\.?$/.test(content) ||
      /님이\s*퇴장했습니다\.?$/.test(content) ||
      /채팅방을\s*나갔습니다\.?$/.test(content) ||
      /방을\s*나갔습니다\.?$/.test(content)
    );
  };

  const isSystemMessage = (msg) => {
    const content = String(msg?.content || '').trim();
    if (!content) return false;

    if (msg?.messageType === 'SYSTEM' || msg?.type === 'SYSTEM') return true;
    return isLeaveNoticeMessage(msg);
  };

  const isEmailFormat = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

  const handleSearchOrOpenRoom = async (e) => {
    e.preventDefault();
    const query = String(targetUserQuery || '').trim();
    if (!query) return;

    if (isEmailFormat(query)) {
      const found = await findUserByEmail(query);
      if (!found) {
        setSearchedUser(null);
        alert('\uD574\uB2F9 \uC774\uBA54\uC77C\uC758 \uACC4\uC815\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
        return;
      }
      setSearchedUser(found);

      const room = await createOrGetRoom(found.id);
      const roomId = room?.roomId ?? room?.id;
      if (roomId) {
        setHiddenRoomIds((prev) => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        });
        saveRoomName(roomId, found.name || '');
        setActiveRoomId(roomId);
        setTargetUserQuery('');
      }
      return;
    }

    const parsed = Number(query);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert('\uC720\uD6A8\uD55C \uC0AC\uC6A9\uC790 ID \uB610\uB294 \uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.');
      return;
    }

    const room = await createOrGetRoom(parsed);
    const roomId = room?.roomId ?? room?.id;
    if (roomId) {
      setHiddenRoomIds((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      setActiveRoomId(roomId);
      setSearchedUser(null);
      setTargetUserQuery('');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageInput.trim();

    if (!activeRoomId) {
      alert('\uBA3C\uC800 \uCC44\uD305\uBC29\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.');
      return;
    }
    if (!content) return;

    const message = await sendMessage(activeRoomId, content);
    setMessageInput('');
    if (message?.id) {
      await markRead(activeRoomId, message.id);
    }
  };

  const handleBackToRooms = () => {
    setActiveRoomId(null);
  };

  const handleLeaveRoom = async () => {
    if (!activeRoomId) return;
    if (!window.confirm('\uC774 \uCC44\uD305\uBC29\uC5D0\uC11C \uB098\uAC00\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) return;

    try {
      await leaveRoom(activeRoomId);
    } catch (errorObj) {
      console.error('\uCC44\uD305\uBC29 \uB098\uAC00\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4:', errorObj);
      alert('\uCC44\uD305\uBC29 \uB098\uAC00\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
      return;
    }

    setRoomNameMap((prev) => {
      const next = { ...prev };
      delete next[activeRoomId];
      return next;
    });
    setHiddenRoomIds((prev) => ({ ...prev, [activeRoomId]: true }));
    setActiveRoomId(null);
    setMessageInput('');
  };

  return (
    <>
      <GNB />
      <main className="dm-container">
        <section className="dm-card">
          <header className="dm-header">
            <h1>다이렉트 메시지</h1>
            <p>채팅방을 열고 메시지를 확인하거나 보낼 수 있습니다.</p>
          </header>

          {!isChatView && (
            <form className="dm-create-form" onSubmit={handleSearchOrOpenRoom}>
              <input
                type="text"
                placeholder="이메일 또는 사용자 ID 입력"
                value={targetUserQuery}
                onChange={(e) => setTargetUserQuery(e.target.value)}
              />
              <button type="submit" disabled={isLoading}>
                검색 / 열기
              </button>
            </form>
          )}

          {error && <p className="dm-error">채팅 요청을 처리하지 못했습니다.</p>}

          <div className="dm-body">
            {!isChatView ? (
              <aside className="dm-room-list dm-room-list-only">
                <h2>내 채팅방</h2>
                {visibleRooms.length === 0 ? (
                  <p className="dm-empty">아직 채팅방이 없습니다.</p>
                ) : (
                  visibleRooms.map((room) => {
                    const roomId = room.roomId ?? room.id;
                    const roomName = getRoomDisplayName(room);

                    return (
                      <button
                        key={roomId}
                        type="button"
                        className="dm-room-item"
                        onClick={() => setActiveRoomId(roomId)}
                      >
                        <strong>{roomName}</strong>
                        {room.lastMessage && <span>{room.lastMessage}</span>}
                      </button>
                    );
                  })
                )}
              </aside>
            ) : (
              <section className="dm-chat dm-chat-only">
                <div className="dm-chat-top">
                  <button type="button" className="dm-back-button" onClick={handleBackToRooms}>
                    뒤로가기
                  </button>
                  <h2>{activeRoomName}</h2>
                  <button
                    type="button"
                    className="dm-leave-button"
                    onClick={handleLeaveRoom}
                    disabled={isLoading}
                  >
                    나가기
                  </button>
                </div>

                <div className="dm-messages">
                  {activeMessages.length === 0 && (
                    <p className="dm-empty">이 채팅방에 메시지가 없습니다.</p>
                  )}
                  {activeMessages.map((msg) => (
                    isSystemMessage(msg) ? (
                      <div className={`dm-system-message ${isLeaveNoticeMessage(msg) ? 'is-leave-notice' : ''}`.trim()} key={msg.id}>
                        <span>{msg.content}</span>
                        <small className="dm-system-time">{formatMessageTime(msg)}</small>
                      </div>
                    ) : (
                      <article
                        className={`dm-message ${isMyMessage(msg) ? 'is-mine' : 'is-other'}`}
                        key={msg.id}
                      >
                        <header>
                          <strong>{resolveSenderName(msg)}</strong>
                        </header>
                        <p>{msg.content}</p>
                        <small className="dm-message-time">{formatMessageTime(msg)}</small>
                      </article>
                    )
                  ))}
                </div>

                <form className="dm-send-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="메시지를 입력하세요"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <button type="submit" disabled={isLoading}>
                    보내기
                  </button>
                </form>
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default DmPage;

