import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsApi } from '../../api/groupsApi';
import '../../styles/workspace.css';
 
export default function WorkspaceDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
 
  useEffect(() => {
    groupsApi.getGroup(groupId)
      .then(r => setGroup(r.data))
      .catch(() => navigate('/workspaces'))
      .finally(() => setLoading(false));
  }, [groupId]);
 
  if (loading) return <div className="ws-root ws-loading-full">Loading workspace...</div>;
  if (!group) return null;
 
  return (
    <div className="ws-root">
      <div className="ws-detail-header">
        <button className="ws-back-btn" onClick={() => navigate('/workspaces')}>
          ← Back to Workspaces
        </button>
        <h1 className="ws-title">{group.name}</h1>
        {group.description && <p className="ws-detail-desc">{group.description}</p>}
        <div className="ws-detail-meta">
          <span className="ws-meta-pill">Max {group.maxMembers} members</span>
          <span className="ws-meta-pill">Created {new Date(group.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
 
      <div className="ws-coming-grid">
        {[
          { icon: "👥", title: "Member Management", desc: "Invite members using the group invite code — feature coming from your teammate's sprint." },
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
    </div>
  );
}
