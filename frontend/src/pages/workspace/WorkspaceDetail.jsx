// FILE PATH:
// frontend/src/pages/workspace/WorkspaceDetail.jsx
//
// ════════════════════════════════════════════════════════
//  Replace your existing WorkspaceDetail.jsx with this file.
//  Changes: Added "Invite Member" button + InviteModal.
// ════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsApi } from '../../api/groupsApi';
import InviteModal from '../../components/InviteModal';  // ✚ NEW
import MainLayout from '../../components/MainLayout';
import '../../styles/workspace.css';

export default function WorkspaceDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);   // ✚ NEW
  const navigate = useNavigate();

  useEffect(() => {
    groupsApi.getGroup(groupId)
      .then(r => setGroup(r.data))
      .catch(() => navigate('/workspaces'))
      .finally(() => setLoading(false));
  }, [groupId, navigate]);

  if (loading) return (
    <MainLayout title="Workspace">
      <div className="ws-root ws-loading-full">Loading workspace...</div>
    </MainLayout>
  );
  if (!group) return null;

  return (
    <MainLayout title={group.name}>
      <div className="ws-detail-header" style={{ border: 'none', padding: 0 }}>
        {group.description && <p className="ws-detail-desc">{group.description}</p>}
        <div className="ws-detail-meta" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="ws-meta-pill">Max {group.maxMembers} members</span>
          <span className="ws-meta-pill">Created {new Date(group.createdAt).toLocaleDateString()}</span>

          {/* ✚ NEW — Invite Member Button */}
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

      {/* ✚ NEW — Invite Modal */}
      {showInvite && (
        <InviteModal
          groupId={groupId}
          onClose={() => setShowInvite(false)}
        />
      )}

      <div className="ws-coming-grid">
        {[
          { icon: "👥", title: "Member Management", desc: "Invite members via email using the button above — invitations expire after 7 days." },
          { icon: "💬", title: "Group Chat", desc: "Real-time messaging for your group — coming in Stage 2 (SignalR)." },
          { icon: "📁", title: "Shared Files", desc: "Upload and share files with your group — coming in Stage 3." },
          { icon: "✅", title: "Task Board", desc: "Kanban task tracking for group assignments — coming in Stage 4." },
        ].map(panel => (
          <div key={panel.title} className="ws-coming-card">
            <div className="ws-coming-icon">{panel.icon}</div>
            <h3 className="ws-coming-title">{panel.title}</h3>
            <p className="ws-coming-desc">{panel.desc}</p>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}