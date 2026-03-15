import { useCallback, useEffect, useMemo, useState } from 'react';
import Footer from '../components/Footer';
import GNB from '../components/Gnb';
import { useAuth } from '../hooks/useAuth';
import adminService from '../services/adminService';
import './AdminPage.css';

const EMPTY_PAGE = { content: [], number: 0, totalPages: 0, first: true, last: true };
const USER_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'PENDING_VERIFICATION'];
const USER_ROLE_OPTIONS = ['ROLE_USER', 'ROLE_ADMIN'];
const VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE', 'FOLLOWERS'];
const PAGE_SIZE = 20;
const DASHBOARD_DAYS = 14;

const TABS = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'users', label: '사용자 관리' },
  { key: 'posts', label: '게시글 관리' },
  { key: 'comments', label: '댓글 관리' },
];

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
};

const toApiDateTime = (value) => (value ? `${value}:00` : undefined);

const buildParams = (filters, page) => {
  const params = { page, size: PAGE_SIZE };
  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    if (key.startsWith('created')) params[key] = toApiDateTime(value);
    else if (value === 'true') params[key] = true;
    else if (value === 'false') params[key] = false;
    else params[key] = value;
  });
  return params;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const dayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const buildRangeDays = (count) => {
  const result = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    result.push(date);
  }
  return result;
};

const countToday = (items) => {
  const today = dayKey(new Date().toISOString());
  return items.filter((item) => dayKey(item?.createdAt) === today).length;
};

const countLastWeek = (items) => {
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - 6);
  return items.filter((item) => {
    const date = new Date(item?.createdAt);
    return !Number.isNaN(date.getTime()) && date >= threshold;
  }).length;
};

function Pagination({ page, onChange }) {
  if (!page.totalPages || page.totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button type="button" onClick={() => onChange(page.number - 1)} disabled={page.first}>
        이전
      </button>
      <span>
        {page.number + 1} / {page.totalPages}
      </span>
      <button type="button" onClick={() => onChange(page.number + 1)} disabled={page.last}>
        다음
      </button>
    </div>
  );
}

function TrendChart({ series, labels }) {
  const width = 760;
  const height = 250;
  const padding = 28;
  const maxValue = Math.max(1, ...series.flatMap((item) => item.values));
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const toPoints = (values) =>
    values
      .map((value, index) => {
        const x = padding + (innerWidth / Math.max(1, values.length - 1)) * index;
        const y = padding + innerHeight - (value / maxValue) * innerHeight;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="admin-chart">
      <div className="admin-chart-legend">
        {series.map((item) => (
          <span key={item.label} className="admin-chart-pill" style={{ '--pill-color': item.color }}>
            {item.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="admin-chart-svg" role="img" aria-label="운영 트렌드">
        {[0, 1, 2, 3, 4].map((step) => {
          const y = padding + (innerHeight / 4) * step;
          return (
            <line
              key={step}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              className="admin-chart-grid"
            />
          );
        })}

        {labels.map((label, index) => {
          const x = padding + (innerWidth / Math.max(1, labels.length - 1)) * index;
          return (
            <text key={label} x={x} y={height - 8} textAnchor="middle" className="admin-chart-label">
              {label.slice(5)}
            </text>
          );
        })}

        {series.map((item) => (
          <polyline
            key={item.label}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={toPoints(item.values)}
          />
        ))}
      </svg>
    </div>
  );
}

function AdminPage() {
  const { user, accessToken } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState('');
  const [resourceError, setResourceError] = useState('');
  const [loading, setLoading] = useState({
    summary: true,
    users: false,
    posts: false,
    comments: false,
    detail: false,
    action: false,
  });

  const [userFilters, setUserFilters] = useState({
    keyword: '',
    status: '',
    role: '',
    provider: '',
    isActive: '',
    createdFrom: '',
    createdTo: '',
  });
  const [postFilters, setPostFilters] = useState({
    keyword: '',
    authorEmail: '',
    visibility: '',
    isDeleted: '',
    createdFrom: '',
    createdTo: '',
  });
  const [commentFilters, setCommentFilters] = useState({
    keyword: '',
    postId: '',
    authorId: '',
    isDeleted: '',
    createdFrom: '',
    createdTo: '',
  });

  const [usersPage, setUsersPage] = useState(EMPTY_PAGE);
  const [postsPage, setPostsPage] = useState(EMPTY_PAGE);
  const [commentsPage, setCommentsPage] = useState(EMPTY_PAGE);
  const [pageIndex, setPageIndex] = useState({ users: 0, posts: 0, comments: 0 });
  const [selected, setSelected] = useState({ user: null, post: null, comment: null });
  const [statusForm, setStatusForm] = useState({ status: 'ACTIVE', reason: '', lockedUntil: '' });
  const [roleForm, setRoleForm] = useState({ role: 'ROLE_USER', superUser: false, reason: '' });
  const [deleteReason, setDeleteReason] = useState('');

  const isSuperUser = user?.isSuperUser === true;
  const setLoad = (key, value) => setLoading((prev) => ({ ...prev, [key]: value }));

  const fetchSummary = useCallback(async () => {
    setLoad('summary', true);
    setSummaryError('');
    try {
      setSummary(await adminService.getDashboardSummary(accessToken));
    } catch (error) {
      setSummaryError(getErrorMessage(error, '대시보드 요약을 불러오지 못했습니다.'));
    } finally {
      setLoad('summary', false);
    }
  }, [accessToken]);

  const fetchList = useCallback(async (type, page = pageIndex[type]) => {
    const config = {
      users: [adminService.getUsers, userFilters, setUsersPage],
      posts: [adminService.getPosts, postFilters, setPostsPage],
      comments: [adminService.getComments, commentFilters, setCommentsPage],
    }[type];

    setLoad(type, true);
    setResourceError('');
    try {
      const [method, filters, setter] = config;
      setter((await method(accessToken, buildParams(filters, page))) || EMPTY_PAGE);
    } catch (error) {
      setResourceError(getErrorMessage(error, `${type} 목록을 불러오지 못했습니다.`));
    } finally {
      setLoad(type, false);
    }
  }, [accessToken, commentFilters, pageIndex, postFilters, userFilters]);

  const loadDetail = async (type, id) => {
    const config = {
      user: [adminService.getUserDetail, 'user'],
      post: [adminService.getPostDetail, 'post'],
      comment: [adminService.getCommentDetail, 'comment'],
    }[type];

    setLoad('detail', true);
    setResourceError('');
    try {
      const [method, key] = config;
      const data = await method(accessToken, id);
      setSelected((prev) => ({ ...prev, [key]: data }));

      if (key === 'user') {
        setStatusForm({
          status: data?.status || 'ACTIVE',
          reason: '',
          lockedUntil: data?.accountLockedUntil?.slice(0, 16) || '',
        });
        setRoleForm({
          role: data?.role || 'ROLE_USER',
          superUser: data?.isSuperUser === true,
          reason: '',
        });
      }

      if (key === 'post' || key === 'comment') {
        setDeleteReason('');
      }
    } catch (error) {
      setResourceError(getErrorMessage(error, '상세 정보를 불러오지 못했습니다.'));
    } finally {
      setLoad('detail', false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchSummary();
  }, [accessToken, fetchSummary]);

  useEffect(() => {
    if (accessToken) fetchList('users', pageIndex.users);
  }, [accessToken, fetchList, pageIndex.users]);

  useEffect(() => {
    if (accessToken) fetchList('posts', pageIndex.posts);
  }, [accessToken, fetchList, pageIndex.posts]);

  useEffect(() => {
    if (accessToken) fetchList('comments', pageIndex.comments);
  }, [accessToken, fetchList, pageIndex.comments]);

  const submitFilters = async (type) => {
    setPageIndex((prev) => ({ ...prev, [type]: 0 }));
    await fetchList(type, 0);
  };

  const updateUserStatus = async () => {
    if (!selected.user) return;
    setLoad('action', true);
    try {
      const updated = await adminService.updateUserStatus(accessToken, selected.user.id, {
        status: statusForm.status,
        reason: statusForm.reason || undefined,
        lockedUntil: statusForm.status === 'SUSPENDED' ? toApiDateTime(statusForm.lockedUntil) : undefined,
      });
      setSelected((prev) => ({ ...prev, user: updated }));
      await fetchSummary();
      await fetchList('users');
      alert('사용자 상태가 변경되었습니다.');
    } catch (error) {
      setResourceError(getErrorMessage(error, '사용자 상태 변경에 실패했습니다.'));
    } finally {
      setLoad('action', false);
    }
  };

  const updateUserRole = async () => {
    if (!selected.user) return;
    setLoad('action', true);
    try {
      const updated = await adminService.updateUserRole(accessToken, selected.user.id, roleForm);
      setSelected((prev) => ({ ...prev, user: updated }));
      await fetchList('users');
      alert('사용자 권한이 변경되었습니다.');
    } catch (error) {
      setResourceError(getErrorMessage(error, '사용자 권한 변경에 실패했습니다.'));
    } finally {
      setLoad('action', false);
    }
  };

  const deleteItem = async (type) => {
    const current = selected[type];
    if (!current) return;
    if (!window.confirm('운영 삭제를 진행하시겠습니까?')) return;

    setLoad('action', true);
    try {
      if (type === 'post') {
        await adminService.deletePost(accessToken, current.id, deleteReason.trim());
        await fetchSummary();
        await fetchList('posts');
      }
      if (type === 'comment') {
        await adminService.deleteComment(accessToken, current.id, deleteReason.trim());
        await fetchList('comments');
      }
      setSelected((prev) => ({ ...prev, [type]: { ...current, isDeleted: true } }));
      alert('삭제가 완료되었습니다.');
    } catch (error) {
      setResourceError(getErrorMessage(error, '삭제에 실패했습니다.'));
    } finally {
      setLoad('action', false);
    }
  };

  const listPage = { users: usersPage, posts: postsPage, comments: commentsPage }[tab] || EMPTY_PAGE;

  const userItems = useMemo(() => usersPage.content || [], [usersPage.content]);
  const postItems = useMemo(() => postsPage.content || [], [postsPage.content]);
  const commentItems = useMemo(() => commentsPage.content || [], [commentsPage.content]);

  const dashboardCards = [
    { label: '전체 사용자', value: summary?.totalUsers ?? 0 },
    { label: '활성 사용자', value: summary?.activeUsers ?? 0 },
    { label: '정지 사용자', value: summary?.suspendedUsers ?? 0 },
    { label: '전체 게시물', value: summary?.totalPosts ?? 0 },
    { label: '전체 댓글', value: summary?.totalComments ?? 0 },
    { label: '오늘 가입', value: countToday(userItems) },
    { label: '오늘 게시글', value: countToday(postItems) },
    { label: '주간 가입', value: countLastWeek(userItems) },
    { label: '주간 게시글', value: countLastWeek(postItems) },
    { label: '주간 댓글', value: countLastWeek(commentItems) },
  ];

  const chartDays = useMemo(() => buildRangeDays(DASHBOARD_DAYS), []);
  const chartLabels = chartDays.map((date) => dayKey(date.toISOString()).slice(5));
  const aggregateSeries = useMemo(() => {
    const buckets = chartDays.map((date) => dayKey(date.toISOString()));
    const makeSeries = (items) =>
      buckets.map((bucket) => items.filter((item) => dayKey(item?.createdAt) === bucket).length);

    const users = makeSeries(userItems);
    const posts = makeSeries(postItems);
    const comments = makeSeries(commentItems);

    return [
      { label: '가입자', color: '#34d399', values: users },
      { label: '게시글', color: '#60a5fa', values: posts },
      { label: '댓글', color: '#a78bfa', values: comments },
      { label: '조회흐름', color: '#f59e0b', values: users.map((value, index) => value + posts[index] + comments[index]) },
    ];
  }, [chartDays, commentItems, postItems, userItems]);

  const renderManagementFilters = () => {
    if (tab === 'users') {
      return (
        <div className="admin-filter-grid">
          <input value={userFilters.keyword} onChange={(e) => setUserFilters((prev) => ({ ...prev, keyword: e.target.value }))} placeholder="이메일 또는 이름" />
          <select value={userFilters.status} onChange={(e) => setUserFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">상태 전체</option>
            {USER_STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={userFilters.role} onChange={(e) => setUserFilters((prev) => ({ ...prev, role: e.target.value }))}>
            <option value="">권한 전체</option>
            {USER_ROLE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input value={userFilters.provider} onChange={(e) => setUserFilters((prev) => ({ ...prev, provider: e.target.value }))} placeholder="가입 방식" />
          <select value={userFilters.isActive} onChange={(e) => setUserFilters((prev) => ({ ...prev, isActive: e.target.value }))}>
            <option value="">활성 전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
          <input type="datetime-local" value={userFilters.createdFrom} onChange={(e) => setUserFilters((prev) => ({ ...prev, createdFrom: e.target.value }))} />
          <input type="datetime-local" value={userFilters.createdTo} onChange={(e) => setUserFilters((prev) => ({ ...prev, createdTo: e.target.value }))} />
        </div>
      );
    }

    if (tab === 'posts') {
      return (
        <div className="admin-filter-grid">
          <input value={postFilters.keyword} onChange={(e) => setPostFilters((prev) => ({ ...prev, keyword: e.target.value }))} placeholder="본문 검색" />
          <input value={postFilters.authorEmail} onChange={(e) => setPostFilters((prev) => ({ ...prev, authorEmail: e.target.value }))} placeholder="작성자 이메일" />
          <select value={postFilters.visibility} onChange={(e) => setPostFilters((prev) => ({ ...prev, visibility: e.target.value }))}>
            <option value="">공개 범위 전체</option>
            {VISIBILITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={postFilters.isDeleted} onChange={(e) => setPostFilters((prev) => ({ ...prev, isDeleted: e.target.value }))}>
            <option value="">삭제 여부 전체</option>
            <option value="false">정상</option>
            <option value="true">삭제</option>
          </select>
          <input type="datetime-local" value={postFilters.createdFrom} onChange={(e) => setPostFilters((prev) => ({ ...prev, createdFrom: e.target.value }))} />
          <input type="datetime-local" value={postFilters.createdTo} onChange={(e) => setPostFilters((prev) => ({ ...prev, createdTo: e.target.value }))} />
        </div>
      );
    }

    return (
      <div className="admin-filter-grid">
        <input value={commentFilters.keyword} onChange={(e) => setCommentFilters((prev) => ({ ...prev, keyword: e.target.value }))} placeholder="댓글 내용 검색" />
        <input value={commentFilters.postId} onChange={(e) => setCommentFilters((prev) => ({ ...prev, postId: e.target.value }))} placeholder="게시물 ID" />
        <input value={commentFilters.authorId} onChange={(e) => setCommentFilters((prev) => ({ ...prev, authorId: e.target.value }))} placeholder="작성자 ID" />
        <select value={commentFilters.isDeleted} onChange={(e) => setCommentFilters((prev) => ({ ...prev, isDeleted: e.target.value }))}>
          <option value="">삭제 여부 전체</option>
          <option value="false">정상</option>
          <option value="true">삭제</option>
        </select>
        <input type="datetime-local" value={commentFilters.createdFrom} onChange={(e) => setCommentFilters((prev) => ({ ...prev, createdFrom: e.target.value }))} />
        <input type="datetime-local" value={commentFilters.createdTo} onChange={(e) => setCommentFilters((prev) => ({ ...prev, createdTo: e.target.value }))} />
      </div>
    );
  };

  const renderManagementTable = () => (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          {tab === 'users' && <tr><th>ID</th><th>이메일</th><th>이름</th><th>권한</th><th>상태</th><th>가입일</th></tr>}
          {tab === 'posts' && <tr><th>ID</th><th>작성자</th><th>본문</th><th>공개</th><th>삭제</th><th>작성일</th></tr>}
          {tab === 'comments' && <tr><th>ID</th><th>게시물</th><th>작성자</th><th>내용</th><th>삭제</th><th>작성일</th></tr>}
        </thead>
        <tbody>
          {loading[tab] ? (
            <tr><td colSpan="6" className="admin-empty">목록을 불러오는 중입니다.</td></tr>
          ) : listPage.content.length === 0 ? (
            <tr><td colSpan="6" className="admin-empty">조회 결과가 없습니다.</td></tr>
          ) : (
            <>
              {tab === 'users' && listPage.content.map((item) => (
                <tr key={item.id} onClick={() => loadDetail('user', item.id)}>
                  <td>{item.id}</td><td>{item.email}</td><td>{item.name}</td><td>{item.role}</td><td>{item.status}</td><td>{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {tab === 'posts' && listPage.content.map((item) => (
                <tr key={item.id} onClick={() => loadDetail('post', item.id)}>
                  <td>{item.id}</td><td>{item.authorEmail || item.authorName}</td><td>{item.content?.slice(0, 50) || '-'}</td><td>{item.visibility}</td><td>{item.isDeleted ? 'Y' : 'N'}</td><td>{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {tab === 'comments' && listPage.content.map((item) => (
                <tr key={item.id} onClick={() => loadDetail('comment', item.id)}>
                  <td>{item.id}</td><td>{item.postId}</td><td>{item.authorEmail || item.authorName}</td><td>{item.content?.slice(0, 50) || '-'}</td><td>{item.isDeleted ? 'Y' : 'N'}</td><td>{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderDetailPanel = () => (
    <article className="admin-panel admin-detail-panel">
      <div className="admin-panel-header"><h2>상세 / 액션</h2></div>
      {loading.detail && <p className="admin-placeholder">상세 정보를 불러오는 중입니다.</p>}
      {!loading.detail && tab === 'users' && !selected.user && <p className="admin-placeholder">사용자를 선택하세요.</p>}
      {!loading.detail && tab === 'posts' && !selected.post && <p className="admin-placeholder">게시물을 선택하세요.</p>}
      {!loading.detail && tab === 'comments' && !selected.comment && <p className="admin-placeholder">댓글을 선택하세요.</p>}

      {!loading.detail && tab === 'users' && selected.user && (
        <>
          <dl className="admin-detail-list">
            <div><dt>ID</dt><dd>{selected.user.id}</dd></div>
            <div><dt>이메일</dt><dd>{selected.user.email}</dd></div>
            <div><dt>이름</dt><dd>{selected.user.name}</dd></div>
            <div><dt>슈퍼 관리자</dt><dd>{selected.user.isSuperUser ? '예' : '아니오'}</dd></div>
            <div><dt>최근 로그인</dt><dd>{formatDateTime(selected.user.lastLoginAt)}</dd></div>
          </dl>
          <section className="admin-action-box">
            <h3>상태 변경</h3>
            <select value={statusForm.status} onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}>
              {USER_STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <input value={statusForm.reason} onChange={(e) => setStatusForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="변경 사유" />
            <input type="datetime-local" value={statusForm.lockedUntil} onChange={(e) => setStatusForm((prev) => ({ ...prev, lockedUntil: e.target.value }))} disabled={statusForm.status !== 'SUSPENDED'} />
            <button type="button" onClick={updateUserStatus} disabled={loading.action}>상태 반영</button>
          </section>
          {isSuperUser ? (
            <section className="admin-action-box">
              <h3>권한 변경</h3>
              <select value={roleForm.role} onChange={(e) => setRoleForm((prev) => ({ ...prev, role: e.target.value }))}>
                {USER_ROLE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <label className="admin-checkbox">
                <input type="checkbox" checked={roleForm.superUser} onChange={(e) => setRoleForm((prev) => ({ ...prev, superUser: e.target.checked }))} />
                슈퍼 관리자
              </label>
              <input value={roleForm.reason} onChange={(e) => setRoleForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="권한 변경 사유" />
              <button type="button" onClick={updateUserRole} disabled={loading.action}>권한 반영</button>
            </section>
          ) : (
            <p className="admin-note">슈퍼 관리자만 권한 변경이 가능합니다.</p>
          )}
        </>
      )}

      {!loading.detail && tab === 'posts' && selected.post && (
        <>
          <dl className="admin-detail-list">
            <div><dt>ID</dt><dd>{selected.post.id}</dd></div>
            <div><dt>작성자</dt><dd>{selected.post.authorEmail || selected.post.authorName}</dd></div>
            <div><dt>공개 범위</dt><dd>{selected.post.visibility}</dd></div>
            <div><dt>삭제 여부</dt><dd>{selected.post.isDeleted ? '예' : '아니오'}</dd></div>
          </dl>
          <section className="admin-body-preview"><h3>본문</h3><p>{selected.post.content || '본문이 없습니다.'}</p></section>
          <section className="admin-action-box">
            <h3>운영 삭제</h3>
            <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows="4" placeholder="삭제 사유" />
            <button type="button" onClick={() => deleteItem('post')} disabled={loading.action || selected.post.isDeleted}>게시물 삭제</button>
          </section>
        </>
      )}

      {!loading.detail && tab === 'comments' && selected.comment && (
        <>
          <dl className="admin-detail-list">
            <div><dt>ID</dt><dd>{selected.comment.id}</dd></div>
            <div><dt>게시물 ID</dt><dd>{selected.comment.postId}</dd></div>
            <div><dt>작성자</dt><dd>{selected.comment.authorEmail || selected.comment.authorName}</dd></div>
            <div><dt>삭제 여부</dt><dd>{selected.comment.isDeleted ? '예' : '아니오'}</dd></div>
          </dl>
          <section className="admin-body-preview"><h3>댓글 내용</h3><p>{selected.comment.content || '댓글 내용이 없습니다.'}</p></section>
          <section className="admin-action-box">
            <h3>운영 삭제</h3>
            <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows="4" placeholder="삭제 사유" />
            <button type="button" onClick={() => deleteItem('comment')} disabled={loading.action || selected.comment.isDeleted}>댓글 삭제</button>
          </section>
        </>
      )}
    </article>
  );

  return (
    <>
      <GNB />
      <main className="admin-page">
        <section className="admin-shell">
          <div className="admin-layout">
            <aside className="admin-sidebar">
              <div className="admin-sidebar-card">
                <h2>Admin Console</h2>
                <nav className="admin-sidebar-nav">
                  {TABS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={tab === item.key ? 'active' : ''}
                      onClick={() => setTab(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <section className="admin-main">
              <header className="admin-topbar">
                <div>
                  <p className="admin-topbar-eyebrow">관리자 콘솔</p>
                  <h1>{TABS.find((item) => item.key === tab)?.label}</h1>
                </div>
                <div className="admin-identity">
                  <span>{user?.name || '관리자'}</span>
                  <strong>{isSuperUser ? 'SUPER ADMIN' : 'ADMIN'}</strong>
                </div>
              </header>

              {summaryError ? <p className="admin-banner error">{summaryError}</p> : null}
              {resourceError ? <p className="admin-banner error">{resourceError}</p> : null}

              {tab === 'dashboard' ? (
                <>
                  <section className="admin-dashboard-grid">
                    {dashboardCards.map((card) => (
                      <article className="admin-kpi-card" key={card.label}>
                        <span>{card.label}</span>
                        <strong>{loading.summary ? '...' : card.value}</strong>
                      </article>
                    ))}
                  </section>

                  <section className="admin-panel admin-trend-panel">
                    <div className="admin-panel-header">
                      <h2>일별 트렌드</h2>
                      <button type="button" onClick={fetchSummary}>새로고침</button>
                    </div>
                    <TrendChart series={aggregateSeries} labels={chartLabels} />
                  </section>

                  <section className="admin-dashboard-bottom">
                    <article className="admin-panel">
                      <div className="admin-panel-header">
                        <h2>최근 가입 사용자</h2>
                        <button type="button" onClick={() => setTab('users')}>전체 보기</button>
                      </div>
                      <div className="admin-mini-table-wrap">
                        <table className="admin-mini-table">
                          <thead>
                            <tr><th>이름</th><th>이메일</th><th>권한</th><th>상태</th><th>가입일</th></tr>
                          </thead>
                          <tbody>
                            {userItems.slice(0, 5).map((item) => (
                              <tr key={item.id}>
                                <td>{item.name}</td><td>{item.email}</td><td>{item.role}</td><td>{item.status}</td><td>{formatDateTime(item.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>

                    <article className="admin-panel">
                      <div className="admin-panel-header">
                        <h2>최근 게시글</h2>
                        <button type="button" onClick={() => setTab('posts')}>전체 보기</button>
                      </div>
                      <div className="admin-mini-table-wrap">
                        <table className="admin-mini-table">
                          <thead>
                            <tr><th>작성자</th><th>내용</th><th>공개</th><th>작성일</th></tr>
                          </thead>
                          <tbody>
                            {postItems.slice(0, 5).map((item) => (
                              <tr key={item.id}>
                                <td>{item.authorName || item.authorEmail}</td><td>{item.content?.slice(0, 36) || '-'}</td><td>{item.visibility}</td><td>{formatDateTime(item.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </section>
                </>
              ) : (
                <section className="admin-management-grid">
                  <article className="admin-panel">
                    <div className="admin-panel-header">
                      <h2>{TABS.find((item) => item.key === tab)?.label}</h2>
                      <button type="button" onClick={() => submitFilters(tab)}>조회</button>
                    </div>
                    {renderManagementFilters()}
                    {renderManagementTable()}
                    <Pagination page={listPage} onChange={(next) => setPageIndex((prev) => ({ ...prev, [tab]: next }))} />
                  </article>
                  {renderDetailPanel()}
                </section>
              )}
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminPage;
