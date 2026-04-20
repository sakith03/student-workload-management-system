import { useEffect, useMemo, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WorkspaceSharedFiles({ groupId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data } = await workspaceApi.getFiles(groupId);
      setFiles(data.files || []);
      setError('');
    } catch {
      setError('Failed to load workspace files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [groupId]);

  const handleUpload = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setUploading(true);
    try {
      await workspaceApi.uploadFile(groupId, selected);
      await loadFiles();
    } catch {
      setError('File upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const token = useMemo(() => localStorage.getItem('jwt_token') || '', []);

  return (
    <div className="ws-files-panel">
      <div className="ws-files-actions">
        <label className="ws-btn ws-btn--sm">
          {uploading ? 'Uploading...' : 'Upload file'}
          <input type="file" className="ws-files-input" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <div className="ws-error">{error}</div>}

      {loading ? (
        <div className="ws-loading">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="ws-empty">
          <p>No files uploaded in this workspace yet.</p>
        </div>
      ) : (
        <div className="ws-files-list">
          {files.map((file) => (
            <div key={file.id} className="ws-files-item">
              <div>
                <p className="ws-files-name">{file.fileName}</p>
                <p className="ws-files-meta">
                  {formatSize(file.sizeBytes)} • {new Date(file.uploadedAt).toLocaleString()}
                </p>
              </div>
              <a
                className="ws-btn ws-btn--ghost ws-btn--sm"
                href={workspaceApi.getDownloadUrl(groupId, file.id)}
                download={file.fileName}
                onClick={(e) => {
                  // Token-authenticated download via fetch because anchor tags don't include Authorization headers.
                  e.preventDefault();
                  fetch(workspaceApi.getDownloadUrl(groupId, file.id), {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then((res) => res.blob())
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = file.fileName;
                      link.click();
                      URL.revokeObjectURL(url);
                    });
                }}
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
