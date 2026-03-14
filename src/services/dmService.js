import axios from 'axios';
import { API_CONFIG } from '../config';

const buildAuthConfig = (accessToken) => ({
  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  withCredentials: true,
});

const getData = (response) => response?.data?.data;
const getPayload = (response) => response?.data?.data ?? response?.data;

const dmRoomsUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.dmRooms}`;

export const dmService = {
  async findUserByEmail(accessToken, email) {
    const normalizedEmail = String(email || '').trim();
    if (!normalizedEmail) return null;

    const candidates = [
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/search`, params: { email: normalizedEmail } },
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/search-by-email`, params: { email: normalizedEmail } },
      { method: 'get', url: `${API_CONFIG.baseUrl}/users/search`, params: { email: normalizedEmail } },
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/email/${encodeURIComponent(normalizedEmail)}` },
      { method: 'get', url: `${API_CONFIG.baseUrl}/users/email/${encodeURIComponent(normalizedEmail)}` },
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/profile`, params: { email: normalizedEmail } },
    ];

    for (const candidate of candidates) {
      try {
        const response = await axios.request({
          method: candidate.method,
          url: candidate.url,
          params: candidate.params,
          ...buildAuthConfig(accessToken),
        });
        const payload = getPayload(response);
        const user = Array.isArray(payload) ? payload[0] : payload;

        if (!user) continue;
        const userId = user.id ?? user.userId;
        if (!userId) continue;

        return {
          id: userId,
          email: user.email ?? normalizedEmail,
          name: user.name ?? user.username ?? `User #${userId}`,
          profileImage: user.profileImage ?? null,
        };
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404 || status === 405 || status === 400) {
          continue;
        }
        throw error;
      }
    }

    return null;
  },

  async createOrGetRoom(accessToken, targetUserId) {
    const response = await axios.post(
      dmRoomsUrl,
      { targetUserId },
      buildAuthConfig(accessToken)
    );
    return getData(response);
  },

  async findUserById(accessToken, userId) {
    const normalizedId = Number(userId);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) return null;

    const candidates = [
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/${normalizedId}` },
      { method: 'get', url: `${API_CONFIG.baseUrl}/users/${normalizedId}` },
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/profile`, params: { userId: normalizedId } },
      { method: 'get', url: `${API_CONFIG.baseUrl}/user/me`, params: { userId: normalizedId } },
    ];

    for (const candidate of candidates) {
      try {
        const response = await axios.request({
          method: candidate.method,
          url: candidate.url,
          params: candidate.params,
          ...buildAuthConfig(accessToken),
        });
        const payload = getPayload(response);
        const user = Array.isArray(payload) ? payload[0] : payload;

        if (!user) continue;
        const foundId = user.id ?? user.userId;
        if (!foundId) continue;

        return {
          id: foundId,
          email: user.email ?? '',
          name: user.name ?? user.username ?? `User #${foundId}`,
          profileImage: user.profileImage ?? null,
        };
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404 || status === 405 || status === 400) {
          continue;
        }
        throw error;
      }
    }

    return null;
  },

  async getMyRooms(accessToken, { page = 0, size = 20 } = {}) {
    const response = await axios.get(dmRoomsUrl, {
      ...buildAuthConfig(accessToken),
      params: { page, size },
    });
    return getData(response) || [];
  },

  async getMessages(accessToken, roomId, { beforeId, size = 30 } = {}) {
    const response = await axios.get(`${dmRoomsUrl}/${roomId}/messages`, {
      ...buildAuthConfig(accessToken),
      params: { beforeId, size },
    });
    return getData(response) || [];
  },

  async sendMessage(accessToken, roomId, content) {
    const response = await axios.post(
      `${dmRoomsUrl}/${roomId}/messages`,
      { content },
      buildAuthConfig(accessToken)
    );
    return getData(response);
  },

  async leaveRoom(accessToken, roomId) {
    const candidates = [
      { method: 'delete', url: `${dmRoomsUrl}/${roomId}` },
      { method: 'post', url: `${dmRoomsUrl}/${roomId}/leave` },
      { method: 'delete', url: `${dmRoomsUrl}/${roomId}/leave` },
      { method: 'post', url: `${dmRoomsUrl}/${roomId}/exit` },
    ];

    for (const candidate of candidates) {
      try {
        await axios.request({
          method: candidate.method,
          url: candidate.url,
          ...buildAuthConfig(accessToken),
        });
        return true;
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404 || status === 405 || status === 400) {
          continue;
        }
        throw error;
      }
    }

    return false;
  },

  async markRead(accessToken, roomId, lastReadMessageId) {
    await axios.post(
      `${dmRoomsUrl}/${roomId}/read`,
      { lastReadMessageId },
      buildAuthConfig(accessToken)
    );
  },
};

export default dmService;
