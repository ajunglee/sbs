import axios from 'axios';
import { API_CONFIG } from '../config';

const buildAuthConfig = (accessToken) => ({
  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  withCredentials: true,
});

const getData = (response) => response?.data?.data;

const dmRoomsUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.dmRooms}`;

export const dmService = {
  async createOrGetRoom(accessToken, targetUserId) {
    const response = await axios.post(
      dmRoomsUrl,
      { targetUserId },
      buildAuthConfig(accessToken)
    );
    return getData(response);
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

  async markRead(accessToken, roomId, lastReadMessageId) {
    await axios.post(
      `${dmRoomsUrl}/${roomId}/read`,
      { lastReadMessageId },
      buildAuthConfig(accessToken)
    );
  },
};

export default dmService;
