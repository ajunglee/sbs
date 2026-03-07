import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const pickCount = (...candidates) => {
  for (const candidate of candidates) {
    const n = toNumberOrNull(candidate);
    if (n !== null) return n;
  }
  return 0;
};

const extractLikeCount = (post) =>
  pickCount(
    post?.likeCount,
    post?.likes,
    post?.like_count,
    post?.statistics?.likeCount,
    post?.statistics?.likes,
    post?.stats?.likeCount,
    post?.postStats?.likeCount
  );

const extractCommentCount = (post) =>
  pickCount(
    post?.commentCount,
    post?.comments,
    post?.comment_count,
    post?.statistics?.commentCount,
    post?.statistics?.comments,
    post?.stats?.commentCount,
    post?.postStats?.commentCount
  );

const extractViewCount = (post) =>
  pickCount(
    post?.viewCount,
    post?.views,
    post?.viewCnt,
    post?.hitCount,
    post?.readCount,
    post?.view_count,
    post?.statistics?.viewCount,
    post?.statistics?.views,
    post?.stats?.viewCount,
    post?.postStats?.viewCount
  );

const normalizePost = (post) => ({
  ...post,
  likeCount: extractLikeCount(post),
  commentCount: extractCommentCount(post),
  viewCount: extractViewCount(post),
});

export function usePosts(accessToken, { myPostsOnly = false } = {}) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = myPostsOnly
        ? API_CONFIG.endpoints.myPosts
        : API_CONFIG.endpoints.posts;

      const url = `${API_CONFIG.baseUrl}${endpoint}`;

      const headers = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get(url, {
        headers,
        withCredentials: true,
      });

      console.log('[PostList Debug] raw response:', response.data);

      if (!response.data?.data) {
        console.log('[PostList Debug] response.data.data is empty:', response.data);
        setPosts([]);
        return;
      }

      const postData = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data.content || [];

      console.log('[PostList Debug] raw posts:', postData);
      postData.forEach((post, index) => {
        console.log(`[PostList Debug] post[${index}] id=${post?.id}`, {
          viewCount: post?.viewCount,
          views: post?.views,
          viewCnt: post?.viewCnt,
          hitCount: post?.hitCount,
          readCount: post?.readCount,
          view_count: post?.view_count,
          statistics: post?.statistics,
          stats: post?.stats,
          postStats: post?.postStats,
        });
      });

      const normalizedPosts = postData.map(normalizePost);
      console.log('[PostList Debug] normalized posts:', normalizedPosts);
      normalizedPosts.forEach((post, index) => {
        console.log(`[PostList Debug] normalized post[${index}] id=${post?.id} viewCount=${post?.viewCount}`);
      });

      const allViewsZero =
        normalizedPosts.length > 0 &&
        normalizedPosts.every((post) => post.viewCount === 0);

      if (!allViewsZero) {
        setPosts(normalizedPosts);
        return;
      }

      console.warn('[PostList Debug] all list viewCount values are 0. Fallback to detail API for view counts.');

      const detailHeaders = {};
      if (accessToken) {
        detailHeaders.Authorization = `Bearer ${accessToken}`;
      }

      const enrichedPosts = await Promise.all(
        normalizedPosts.map(async (post) => {
          try {
            const detailUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${post.id}`;
            const detailResponse = await axios.get(detailUrl, {
              headers: detailHeaders,
              withCredentials: true,
            });

            const detailData = detailResponse.data?.data || detailResponse.data;
            const detailViewCount = extractViewCount(detailData);

            return {
              ...post,
              viewCount: detailViewCount,
            };
          } catch (detailError) {
            console.warn(`[PostList Debug] detail fallback failed for postId=${post.id}`, detailError);
            return post;
          }
        })
      );

      console.log('[PostList Debug] enriched posts with detail viewCount:', enrichedPosts);
      setPosts(enrichedPosts);
    } catch (err) {
      console.error('게시글 목록 조회 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, myPostsOnly]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const deletePost = async (postId) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return false;
    }

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      return true;
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
      return false;
    }
  };

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    deletePost,
  };
}
