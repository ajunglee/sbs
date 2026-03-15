import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminRole } from '../utils/auth';
import './Gnb.css';
import defaultUserImage from '../assets/default_user.png';

function GNB() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const canOpenAdmin = isAdminRole(user?.role);

  useEffect(() => {
    console.log('[GNB] isAuthenticated:', isAuthenticated);
    console.log('[GNB] user:', user);
    console.log('[GNB] user.role:', user?.role);
    console.log('[GNB] canOpenAdmin:', canOpenAdmin);
  }, [canOpenAdmin, isAuthenticated, user]);

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) {
      return;
    }

    try {
      await logout();
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      navigate('/');
    }
  };

  return (
    <nav className="gnb">
      <div className="gnb-container">
        <div className="gnb-left">
          <Link to="/" className={`gnb-link ${location.pathname === '/' ? 'active' : ''}`}>
            
            <span className="gnb-text">HOME</span>
          </Link>
          <Link to="/posts" className={`gnb-link ${location.pathname.startsWith('/posts') ? 'active' : ''}`}>
            
            <span className="gnb-text">POSTS</span>
          </Link>
          <Link to="/dm" className={`gnb-link ${location.pathname.startsWith('/dm') ? 'active' : ''}`}>
            
            <span className="gnb-text">DM</span>
          </Link>
          <Link to="/spec" className={`gnb-link ${location.pathname.startsWith('/spec') ? 'active' : ''}`}>
            <span className="gnb-text">소개</span>
          </Link>
          {canOpenAdmin && (
            <Link to="/admin" className={`gnb-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
              <span className="gnb-text">관리자</span>
            </Link>
          )}
        </div>

        <div className="gnb-right">
          {isLoading ? (
            <span className="gnb-loading">
              <span className="gnb-text">Loading...</span>
            </span>
          ) : isAuthenticated ? (
            <>
              <Link to="/profile" className="gnb-user-info">
                <img
                  src={user?.profileImage || defaultUserImage}
                  alt="Profile"
                  className="gnb-user-avatar"
                />
                <span className="gnb-text">{user?.name}</span>
              </Link>
              <button onClick={handleLogout} className="auth-link logout-button" type="button">
                <span className="gnb-text">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-link">
                <span className="gnb-text">Login</span>
              </Link>
              <Link to="/signup" className="auth-link signup">
                <span className="gnb-text">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default GNB;
