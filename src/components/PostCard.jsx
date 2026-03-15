import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthorDmPopup from './AuthorDmPopup';
import { resolveMediaUrl } from '../utils/media';

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

function PostCard({ post }) {
  const navigate = useNavigate();
  const [isAuthorPopupOpen, setIsAuthorPopupOpen] = useState(false);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const previewContent = post.content?.length > 150
    ? `${post.content.substring(0, 150)}...`
    : post.content;

  const authorName = post.author?.name || post.userName || '이름없음';
  const authorImage = resolveMediaUrl(post.author?.profileImage || post.userProfileImage || null);
  const authorId = post.author?.id || post.userId || post.authorId || null;
  const authorEmail = post.author?.email || post.userEmail || null;
  const previewImageUrl = resolveMediaUrl(
    post.thumbnailUrl || post.images?.[0]?.imageUrl || post.images?.[0]?.thumbnailUrl
  );

  const likeCount = pickCount(
    post.likeCount,
    post.likes,
    post.like_count,
    post.statistics?.likeCount,
    post.statistics?.likes,
    post.stats?.likeCount,
    post.postStats?.likeCount
  );

  const commentCount = pickCount(
    post.commentCount,
    post.comments,
    post.comment_count,
    post.statistics?.commentCount,
    post.statistics?.comments,
    post.stats?.commentCount,
    post.postStats?.commentCount
  );

  const viewCount = pickCount(
    post.viewCount,
    post.views,
    post.viewCnt,
    post.hitCount,
    post.readCount,
    post.view_count,
    post.statistics?.viewCount,
    post.statistics?.views,
    post.stats?.viewCount,
    post.postStats?.viewCount
  );

  const handleOpenAuthorPopup = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authorId) return;
    setIsAuthorPopupOpen(true);
  };

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
      <Link to={`/posts/${post.id}`} className="post-card">
        <div className="post-card-header">
          <button type="button" className="post-card-author post-card-author-trigger" onClick={handleOpenAuthorPopup}>
            {authorImage ? (
              <img src={authorImage} alt={authorName} className="post-card-avatar" />
            ) : (
              <div className="post-card-avatar-placeholder">
                {authorName.charAt(0)}
              </div>
            )}
            <span className="post-card-author-name">{authorName}</span>
          </button>
          <span className="post-card-time">{formatTime(post.createdAt)}</span>
        </div>

        <div className="post-card-content">
          <p>{previewContent}</p>
        </div>

        {previewImageUrl && (
          <div className="post-card-thumbnail">
            <img
              src={previewImageUrl}
              alt="게시글 이미지"
            />
            {(post.imageCount > 1 || (post.images && post.images.length > 1)) && (
              <span className="post-card-image-count">
                +{(post.imageCount || post.images?.length) - 1}
              </span>
            )}
          </div>
        )}

        <div className="post-card-footer">
          <span className="post-card-stat">좋아요 {likeCount}</span>
          <span className="post-card-stat">댓글 {commentCount}</span>
          <span className="post-card-stat">조회 {viewCount}</span>
        </div>
      </Link>

      <AuthorDmPopup
        isOpen={isAuthorPopupOpen}
        onClose={() => setIsAuthorPopupOpen(false)}
        userName={authorName}
        userImage={authorImage}
        userEmail={authorEmail}
        onStartDm={handleStartDm}
      />
    </>
  );
}

export default PostCard;
