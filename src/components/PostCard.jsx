import { Link } from 'react-router-dom';

/**
 * 게시글 목록 카드
 */
function PostCard({ post }) {
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
    ? post.content.substring(0, 150) + '...'
    : post.content;

  const authorName = post.author?.name || post.userName || '이름없음';
  const authorImage = post.author?.profileImage || post.userProfileImage || null;
  const likeCount = post.likeCount ?? post.likes ?? post.like_count ?? 0;
  const commentCount = post.commentCount ?? post.comments ?? post.comment_count ?? 0;
  const viewCount =
    post.viewCount ??
    post.views ??
    post.viewCnt ??
    post.hitCount ??
    post.readCount ??
    post.view_count ??
    0;

  return (
    <Link to={`/posts/${post.id}`} className="post-card">
      <div className="post-card-header">
        <div className="post-card-author">
          {authorImage ? (
            <img src={authorImage} alt={authorName} className="post-card-avatar" />
          ) : (
            <div className="post-card-avatar-placeholder">
              {authorName.charAt(0)}
            </div>
          )}
          <span className="post-card-author-name">{authorName}</span>
        </div>
        <span className="post-card-time">{formatTime(post.createdAt)}</span>
      </div>

      <div className="post-card-content">
        <p>{previewContent}</p>
      </div>

      {(post.thumbnailUrl || (post.images && post.images.length > 0)) && (
        <div className="post-card-thumbnail">
          <img
            src={post.thumbnailUrl || post.images[0]?.imageUrl || post.images[0]?.thumbnailUrl}
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
        <span className="post-card-stat">♥ {likeCount}</span>
        <span className="post-card-stat">💬 {commentCount}</span>
        <span className="post-card-stat">👁 {viewCount}</span>
      </div>
    </Link>
  );
}

export default PostCard;
