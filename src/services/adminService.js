import axios from 'axios';
import { API_CONFIG } from '../config';

const ADMIN_BASE_URL = `${API_CONFIG.baseUrl}/admin`;

const buildConfig = (accessToken, options = {}) => ({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  },
  params: options.params,
  data: options.data,
});

const unwrap = (response) => response?.data?.data;

export const adminService = {
  getDashboardSummary(accessToken) {
    return axios.get(`${ADMIN_BASE_URL}/dashboard/summary`, buildConfig(accessToken)).then(unwrap);
  },

  getUsers(accessToken, params) {
    return axios.get(`${ADMIN_BASE_URL}/users`, buildConfig(accessToken, { params })).then(unwrap);
  },

  getUserDetail(accessToken, userId) {
    return axios.get(`${ADMIN_BASE_URL}/users/${userId}`, buildConfig(accessToken)).then(unwrap);
  },

  updateUserStatus(accessToken, userId, payload) {
    return axios
      .patch(`${ADMIN_BASE_URL}/users/${userId}/status`, payload, buildConfig(accessToken))
      .then(unwrap);
  },

  updateUserRole(accessToken, userId, payload) {
    return axios
      .patch(`${ADMIN_BASE_URL}/users/${userId}/role`, payload, buildConfig(accessToken))
      .then(unwrap);
  },

  getPosts(accessToken, params) {
    return axios.get(`${ADMIN_BASE_URL}/posts`, buildConfig(accessToken, { params })).then(unwrap);
  },

  getPostDetail(accessToken, postId) {
    return axios.get(`${ADMIN_BASE_URL}/posts/${postId}`, buildConfig(accessToken)).then(unwrap);
  },

  deletePost(accessToken, postId, reason) {
    return axios.delete(
      `${ADMIN_BASE_URL}/posts/${postId}`,
      buildConfig(accessToken, { data: reason ? { reason } : undefined })
    );
  },

  getComments(accessToken, params) {
    return axios
      .get(`${ADMIN_BASE_URL}/comments`, buildConfig(accessToken, { params }))
      .then(unwrap);
  },

  getCommentDetail(accessToken, commentId) {
    return axios
      .get(`${ADMIN_BASE_URL}/comments/${commentId}`, buildConfig(accessToken))
      .then(unwrap);
  },

  deleteComment(accessToken, commentId, reason) {
    return axios.delete(
      `${ADMIN_BASE_URL}/comments/${commentId}`,
      buildConfig(accessToken, { data: reason ? { reason } : undefined })
    );
  },
};

export default adminService;
