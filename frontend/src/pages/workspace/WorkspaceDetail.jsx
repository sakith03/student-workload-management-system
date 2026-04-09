// FILE: frontend/src/pages/workspace/WorkspaceDetail.jsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsApi } from '../../api/groupsApi';
import { academicApi } from '../../api/academicApi';
import InviteModal from '../../components/InviteModal';
import MainLayout from '../../components/MainLayout';
import FloatingChatbot from '../../components/FloatingChatbot';
import GroupChat from '../../components/GroupChat';
import WorkspaceSettingsModal from '../../components/WorkspaceSettingsModal';
import WorkspaceWhiteboard from '../../components/WorkspaceWhiteboard';
import WorkspaceSharedFiles from '../../components/WorkspaceSharedFiles';
import { useAuth } from '../../context/AuthContext';
import '../../styles/workspace.css';

const TEAM_CHAT_COLLAPSED_PX = 56;
const FAB_GAP_PX = 16;

export default function WorkspaceDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [teamChatCollapsed, setTeamChatCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadWorkspace = async () => {
    const [groupRes, subjectsRes] = await Promise.all([
      groupsApi.getGroup(groupId),
      academicApi.getSubjects(),
    ]);
    const g = groupRes.data;
    setGroup(g);
    const matched = subjectsRes.data.find(s => s.id === g.subjectId);
    setSubjectName(matched?.name || matched?.code || 'General');
  };

  useEffect(() => {
    (async () => {
      try {
        await loadWorkspace();
      } catch {
        navigate('/workspaces');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, navigate]);

  const isCreator = useMemo(() => {
    if (!user?.id || !group?.createdByUserId) return false;
    return String(user.id).toLowerCase() === String(group.createdByUserId).toLowerCase();
  }, [user?.id, group?.createdByUserId]);

  const handleDeleteFromDetail = async () => {
    if (!window.confirm('Delete this workspace? It will be removed for all members and related data will be deleted.')) {
      return;
    }
    try {
      await groupsApi.deleteGroup(groupId);
      navigate('/workspaces');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to delete workspace.');
    }
  };

  const expandedChatPanelWidth = Math.min(420, Math.max(280, windowWidth - 64));
  const chatPanelWidth = teamChatCollapsed ? TEAM_CHAT_COLLAPSED_PX : expandedChatPanelWidth;
  const fabRightInset = chatPanelWidth + FAB_GAP_PX;

  if (loading) return (
    <MainLayout title="Workspace">
      <div className="ws-root ws-loading-full">Loading workspace...</div>
    </MainLayout>
  );
  if (!group) return null;

  return (
    <MainLayout title={group.name}>
      <div
        className="ws-root ws-workspace-with-dock"
        style={{
          paddingRight: chatPanelWidth,
          transition: 'padding-right 0.3s ease',
        }}
      >
        <div className="ws-detail-header" style={{ border: 'none', padding: 0 }}>
          {group.description && <p className="ws-detail-desc">{group.description}</p>}
          <div className="ws-detail-meta" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="ws-meta-pill">Max {group.maxMembers} members</span>
            <span className="ws-meta-pill">Created {new Date(group.createdAt).toLocaleDateString()}</span>
            {subjectName && <span className="ws-meta-pill">📚 {subjectName}</span>}

            {isCreator && (
              <>
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost"
                  style={{ padding: '9px 16px', boxShadow: 'none' }}
                  onClick={() => setShowSettings(true)}
                >
                  Edit details
                </button>
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost-danger"
                  style={{ padding: '9px 16px' }}
                  onClick={handleDeleteFromDetail}
                >
                  Delete workspace
                </button>
              </>
            )}

            <button
              className="ws-btn"
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px' }}
              onClick={() => setShowInvite(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M1 14c0-2.761 2.239-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Invite Member
            </button>
          </div>
        </div>

        {showInvite && (
          <InviteModal groupId={groupId} onClose={() => setShowInvite(false)} />
        )}

        {showSettings && (
          <WorkspaceSettingsModal
            groupId={groupId}
            onClose={() => setShowSettings(false)}
            onSaved={async () => {
              try {
                await loadWorkspace();
              } catch {
                navigate('/workspaces');
              }
            }}
            onDeleted={() => navigate('/workspaces')}
          />
        )}

        <div className="ws-tabs">
          <button
            type="button"
            className={`ws-tab ${activeTab === 'overview' ? 'ws-tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`ws-tab ${activeTab === 'whiteboard' ? 'ws-tab--active' : ''}`}
            onClick={() => setActiveTab('whiteboard')}
          >
            Whiteboard
          </button>
          <button
            type="button"
            className={`ws-tab ${activeTab === 'files' ? 'ws-tab--active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Shared Files
          </button>
        </div>

        <div className="ws-tab-panel">
          {activeTab === 'overview' && (
            <div className="ws-coming-grid">
              {[
                { icon: '👥', title: 'Member Management', desc: 'Invite members via email using the button above — invitations expire after 7 days.' },
                { icon: '🤖', title: 'AI Assistant', desc: `Use the floating AI button to the left of the team chat panel for ${subjectName} help.` },
                { icon: '📁', title: 'Shared Files', desc: 'Use the Shared Files tab to upload and download resources for this workspace.' },
                { icon: '✅', title: 'Task Board', desc: 'Kanban task tracking for group assignments — coming in Stage 4.' },
              ].map(panel => (
                <div key={panel.title} className="ws-coming-card">
                  <div className="ws-coming-icon">{panel.icon}</div>
                  <h3 className="ws-coming-title">{panel.title}</h3>
                  <p className="ws-coming-desc">{panel.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'whiteboard' && <WorkspaceWhiteboard groupId={groupId} />}
          {activeTab === 'files' && <WorkspaceSharedFiles groupId={groupId} />}
        </div>
      </div>

      <aside
        className={`ws-chat-dock${teamChatCollapsed ? ' ws-chat-dock--collapsed' : ''}`}
        style={{ width: `${chatPanelWidth}px` }}
        aria-label="Team chat panel"
      >
        <button
          type="button"
          className="ws-chat-dock-toggle"
          onClick={() => setTeamChatCollapsed(c => !c)}
          aria-expanded={!teamChatCollapsed}
          title={teamChatCollapsed ? 'Expand team chat' : 'Shrink team chat'}
        >
          <span className="ws-chat-dock-toggle-icon" aria-hidden>
            {teamChatCollapsed ? '›' : '‹'}
          </span>
        </button>

        {!teamChatCollapsed && (
          <div className="ws-chat-dock-inner">
            <GroupChat groupId={groupId} variant="dock" />
          </div>
        )}

        {teamChatCollapsed && (
          <div className="ws-chat-dock-collapsed" aria-hidden>
            <span className="ws-chat-dock-collapsed-emoji">💬</span>
            <span className="ws-chat-dock-collapsed-text">Chat</span>
          </div>
        )}
      </aside>

      <FloatingChatbot
        workspaceGroupId={groupId}
        workspaceModuleName={subjectName}
        layoutRightInset={fabRightInset}
      />
    </MainLayout>
  );
}
