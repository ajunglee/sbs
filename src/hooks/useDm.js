import { useCallback, useState } from 'react';
import dmService from '../services/dmService';

export function useDm(accessToken) {
  const [rooms, setRooms] = useState([]);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const withState = useCallback(async (action) => {
    setIsLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      console.error('DM 요청 실패:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRooms = useCallback(async (options) => {
    return withState(async () => {
      const data = await dmService.getMyRooms(accessToken, options);
      setRooms(data);
      return data;
    });
  }, [accessToken, withState]);

  const createOrGetRoom = useCallback(async (targetUserId) => {
    return withState(async () => {
      const room = await dmService.createOrGetRoom(accessToken, targetUserId);
      if (room) {
        setRooms((prev) => {
          const nextRoomId = room.roomId ?? room.id;
          const exists = prev.some((item) => (item.roomId ?? item.id) === nextRoomId);
          return exists ? prev : [room, ...prev];
        });
      }
      return room;
    });
  }, [accessToken, withState]);

  const findUserByEmail = useCallback(async (email) => {
    return withState(async () => {
      return dmService.findUserByEmail(accessToken, email);
    });
  }, [accessToken, withState]);

  const fetchMessages = useCallback(async (roomId, options) => {
    return withState(async () => {
      const data = await dmService.getMessages(accessToken, roomId, options);
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: data }));
      return data;
    });
  }, [accessToken, withState]);

  const sendMessage = useCallback(async (roomId, content) => {
    return withState(async () => {
      const message = await dmService.sendMessage(accessToken, roomId, content);
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message],
      }));
      return message;
    });
  }, [accessToken, withState]);

  const markRead = useCallback(async (roomId, lastReadMessageId) => {
    return withState(async () => {
      await dmService.markRead(accessToken, roomId, lastReadMessageId);
    });
  }, [accessToken, withState]);

  const leaveRoom = useCallback(async (roomId) => {
    return withState(async () => {
      const result = await dmService.leaveRoom(accessToken, roomId);
      setRooms((prev) => prev.filter((room) => (room.roomId ?? room.id) !== roomId));
      setMessagesByRoom((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      return result;
    });
  }, [accessToken, withState]);

  return {
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
  };
}

export default useDm;
