import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import AuthorDmPopup from '../components/AuthorDmPopup';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG } from '../config';
import { resolveMediaUrl } from '../utils/media';
import './PostDetail.css';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isAuthorPopupOpen, setIsAuthorPopupOpen] = useState(false);

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

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${id}`;
      const headers = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const response = await axios.get(url, { headers, withCredentials: true });
      const postData = response.data?.data || response.data;
      setPost(postData);

      const likedState = Boolean(
        postData?.liked ??
        postData?.isLiked ??
        postData?.likedByMe ??
        postData?.likedByCurrentUser
      );
      setIsLiked(likedState);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('게시글을 찾을 수 없습니다.');
      } else {
        setError('게시글을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleToggleLike = async () => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${id}/like`;
      const headers = { Authorization: `Bearer ${accessToken}` };

      const response = isLiked
        ? await axios.delete(url, { headers, withCredentials: true })
        : await axios.post(url, {}, { headers, withCredentials: true });

      const data = response.data?.data || {};
      const nextLiked = typeof data.liked === 'boolean' ? data.liked : !isLiked;
      const nextLikeCount = typeof data.likeCount === 'number'
        ? data.likeCount
        : Math.max(
          0,
          pickCount(
            post?.likeCount,
            post?.likes,
            post?.like_count,
            post?.statistics?.likeCount,
            post?.stats?.likeCount,
            post?.postStats?.likeCount
          ) + (nextLiked ? 1 : -1)
        );

      setIsLiked(nextLiked);
      setPost((prev) => (prev ? { ...prev, likeCount: nextLikeCount } : prev));
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      alert('좋아요 처리에 실패했습니다.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${id}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      alert('게시글이 삭제되었습니다.');
      navigate('/posts');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const authorName = post?.author?.name || post?.userName || '알 수 없음';
  const authorImage = resolveMediaUrl(post?.author?.profileImage || post?.userProfileImage || null);
  const authorId = post?.author?.id || post?.userId || post?.authorId || null;
  const authorEmail = post?.author?.email || post?.userEmail || null;

  const detailLikeCount = pickCount(
    post?.likeCount,
    post?.likes,
    post?.like_count,
    post?.statistics?.likeCount,
    post?.statistics?.likes,
    post?.stats?.likeCount,
    post?.postStats?.likeCount
  );
  const detailCommentCount = pickCount(
    post?.commentCount,
    post?.comments,
    post?.comment_count,
    post?.statistics?.commentCount,
    post?.statistics?.comments,
    post?.stats?.commentCount,
    post?.postStats?.commentCount
  );
  const detailViewCount = pickCount(
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

  const isOwner = user && post && (
    user.id === post.userId ||
    user.id === post.author?.id ||
    user.email === post.author?.email
  );

  const handleStartDm = () => {
    if (!authorId) return;
    setIsAuthorPopupOpen(false);
    navigate('/dm', {
      state: {
        dmTargetUser: {
          id: authorId,
          name: authorName,
          email: authorEmail,
          profileImage: authorImage,
        },
      },
    });
  };

  return (
    <>
      <GNB />
      <div className="post-detail-container">
        {isLoading ? (
          <div className="post-detail-loading">
            <p>게시글을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="post-detail-error">
            <p>{error}</p>
            <button onClick={() => navigate('/posts')} className="back-button">
              목록으로 돌아가기
            </button>
          </div>
        ) : post ? (
          <div className="post-detail-card">
            <div className="post-detail-header">
              <button
                type="button"
                className="post-detail-author post-detail-author-trigger"
                onClick={() => authorId && setIsAuthorPopupOpen(true)}
              >
                {authorImage ? (
                  <img src={authorImage} alt={authorName} className="post-detail-avatar" />
                ) : (
                  <div className="post-detail-avatar-placeholder">
                    {authorName.charAt(0)}
                  </div>
                )}
                <div className="post-detail-author-info">
                  <span className="post-detail-author-name">{authorName}</span>
                  <span className="post-detail-date">{formatDate(post.createdAt)}</span>
                </div>
              </button>

              {isOwner && (
                <div className="post-detail-actions">
                  <button onClick={handleDelete} className="delete-button">
                    삭제
                  </button>
                </div>
              )}
            </div>

            <div className="post-detail-content">
              <p>{post.content}</p>
            </div>

            {post.images && post.images.length > 0 && (
              <div className="post-detail-images">
                {post.images.map((image, index) => (
                  <div key={image.id || index} className="post-detail-image-item">
                    <img
                      src={resolveMediaUrl(image.imageUrl || image.thumbnailUrl || image.url)}
                      alt={`게시글 이미지 ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="post-detail-stats">
              <button
                type="button"
                className={`post-detail-like-button ${isLiked ? 'liked' : ''}`}
                onClick={handleToggleLike}
                disabled={isLikeLoading}
              >
                좋아요 {detailLikeCount} {isLiked ? '(취소)' : ''}
              </button>
              <span className="post-detail-stat">댓글 {detailCommentCount}</span>
              <span className="post-detail-stat">조회 {detailViewCount}</span>
            </div>

            {post.visibility && post.visibility !== 'PUBLIC' && (
              <div className="post-detail-visibility">
                {post.visibility === 'PRIVATE' ? '비공개' : '팔로워만'}
              </div>
            )}

            <div className="post-detail-footer">
              <button onClick={() => navigate('/posts')} className="back-button">
                목록으로
              </button>
            </div>

            <AuthorDmPopup
              isOpen={isAuthorPopupOpen}
              onClose={() => setIsAuthorPopupOpen(false)}
              userName={authorName}
              userImage={authorImage}
              userEmail={authorEmail}
              onStartDm={handleStartDm}
            />
          </div>
        ) : null}
      </div>
      <Footer />
    </>
  );
}

export default PostDetail;
