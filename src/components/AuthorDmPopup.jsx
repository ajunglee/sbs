import defaultUserImage from '../assets/default_user.png';
import './AuthorDmPopup.css';

function AuthorDmPopup({
  isOpen,
  onClose,
  userName,
  userImage,
  userEmail,
  onStartDm,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="author-dm-popup-overlay" onClick={onClose} role="presentation">
      <div
        className="author-dm-popup"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="author-dm-close" onClick={onClose} aria-label="닫기">
          x
        </button>

        <div className="author-dm-user">
          <img
            src={userImage || defaultUserImage}
            alt={userName || '작성자'}
            className="author-dm-avatar"
          />
          <strong>{userName || '알 수 없는 사용자'}</strong>
          {userEmail && <span>{userEmail}</span>}
        </div>

        <button
          type="button"
          className="author-dm-start"
          onClick={onStartDm}
          disabled={isLoading}
        >
          대화하기
        </button>
      </div>
    </div>
  );
}

export default AuthorDmPopup;
