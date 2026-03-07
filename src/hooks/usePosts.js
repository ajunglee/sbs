import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

const normalizePost = (post) => ({
  ...post,
  likeCount: post?.likeCount ?? post?.likes ?? post?.like_count ?? 0,
  commentCount: post?.commentCount ?? post?.comments ?? post?.comment_count ?? 0,
  viewCount:
    post?.viewCount ??
    post?.views ??
    post?.viewCnt ??
    post?.hitCount ??
    post?.readCount ??
    post?.view_count ??
    0,
});

/**
 * 게시글 목록 조회/삭제를 담당하는 훅
 */
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

      if (response.data?.data) {
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
          });
        });

        const normalizedPosts = postData.map(normalizePost);
        console.log('[PostList Debug] normalized posts:', normalizedPosts);
        normalizedPosts.forEach((post, index) => {
          console.log(`[PostList Debug] normalized post[${index}] id=${post?.id} viewCount=${post?.viewCount}`);
        });
        setPosts(normalizedPosts);
      } else {
        console.log('[PostList Debug] response.data.data is empty:', response.data);
        setPosts([]);
      }
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
