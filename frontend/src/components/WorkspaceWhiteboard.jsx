import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { workspaceApi } from '../api/workspaceApi';

function drawStroke(ctx, stroke) {
  const alpha = typeof stroke.alpha === 'number' ? stroke.alpha : 1;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.fromX, stroke.fromY);
  ctx.lineTo(stroke.toX, stroke.toY);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const IconPen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconBrush = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M9.06 11.9l8.94-8.94a2.25 2.25 0 0 1 3.18 0l.78.78a2.25 2.25 0 0 1 0 3.18l-8.94 8.94a4.5 4.5 0 0 1-1.9 1.13L9 18l.8-2.69a4.5 4.5 0 0 1 1.26-1.41z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconHighlighter = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M15 5l4 4-9 9H6v-4l9-9z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconEraser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconUndo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 7v6h6M21 17a9 9 0 0 0-15-6l-3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconRedo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 7v6h-6M3 17a9 9 0 0 1 15-6l3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconPalette = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0zM6.34 12.66L12 7l5.66 5.66M12 2.69V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function WorkspaceWhiteboard({ groupId }) {
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const connectionRef = useRef(null);
  const drawingRef = useRef(false);
  const previousPointRef = useRef(null);
  const strokesRef = useRef([]);
  const redoStackRef = useRef([]);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#111827');
  const [error, setError] = useState('');

  const brushOptions = {
    pen: { lineWidth: 2.5, alpha: 1 },
    brush: { lineWidth: 5, alpha: 0.95 },
    marker: { lineWidth: 10, alpha: 0.35 },
    erase: { lineWidth: 18, alpha: 1 },
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  };

  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const setupCanvas = () => {
      const wrap = canvasWrapRef.current;
      const w = wrap ? wrap.clientWidth : canvas.getBoundingClientRect().width;
      const h = wrap ? wrap.clientHeight : canvas.getBoundingClientRect().height;
      const width = Math.max(1, Math.floor(w));
      const height = Math.max(1, Math.floor(h));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      redrawCanvas();
    };
    setupCanvas();

    const token = localStorage.getItem('jwt_token') || '';
    const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiOrigin}/hubs/whiteboard`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connectionRef.current = connection;

    const loadState = async () => {
      const { data } = await workspaceApi.getWhiteboardState(groupId);
      const strokes = JSON.parse(data.stateJson || '[]');
      strokesRef.current = Array.isArray(strokes) ? strokes : [];
      redoStackRef.current = [];
      redrawCanvas();
    };

    connection.on('strokeReceived', (stroke) => {
      if (!mounted) return;
      strokesRef.current.push(stroke);
      redoStackRef.current = [];
      drawStroke(ctx, stroke);
    });

    connection.on('boardCleared', () => {
      if (!mounted) return;
      strokesRef.current = [];
      redoStackRef.current = [];
      redrawCanvas();
    });

    connection.on('boardStateReplaced', (strokes) => {
      if (!mounted) return;
      strokesRef.current = Array.isArray(strokes) ? strokes : [];
      redoStackRef.current = [];
      redrawCanvas();
    });

    (async () => {
      try {
        await loadState();
        await connection.start();
        await connection.invoke('JoinWorkspace', groupId);
      } catch {
        setError('Whiteboard failed to connect.');
      }
    })();

    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    const wrapEl = canvasWrapRef.current;
    const ro =
      wrapEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => setupCanvas())
        : null;
    if (ro) ro.observe(wrapEl);

    return () => {
      mounted = false;
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      connection.stop();
    };
  }, [groupId]);

  const toPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event) => {
    drawingRef.current = true;
    previousPointRef.current = toPoint(event);
  };

  const onPointerMove = async (event) => {
    if (!drawingRef.current || !previousPointRef.current) return;
    const next = toPoint(event);
    const previous = previousPointRef.current;
    previousPointRef.current = next;

    const selectedBrush = brushOptions[tool] ?? brushOptions.pen;
    const stroke = {
      fromX: previous.x,
      fromY: previous.y,
      toX: next.x,
      toY: next.y,
      color: tool === 'erase' ? '#ffffff' : color,
      lineWidth: selectedBrush.lineWidth,
      alpha: selectedBrush.alpha,
    };

    try {
      await connectionRef.current?.invoke('SendStroke', groupId, stroke);
    } catch {
      setError('Failed to sync stroke.');
    }
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    previousPointRef.current = null;
  };

  const clearBoard = async () => {
    try {
      await connectionRef.current?.invoke('ClearBoard', groupId);
    } catch {
      setError('Failed to clear board.');
    }
  };

  const replaceSharedBoardState = async () => {
    try {
      await connectionRef.current?.invoke('ReplaceBoardState', groupId, strokesRef.current);
    } catch {
      setError('Failed to sync board changes.');
    }
  };

  const handleUndo = async () => {
    if (strokesRef.current.length === 0) return;
    const last = strokesRef.current[strokesRef.current.length - 1];
    redoStackRef.current.push(last);
    strokesRef.current = strokesRef.current.slice(0, -1);
    redrawCanvas();
    await replaceSharedBoardState();
  };

  const handleRedo = async () => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    strokesRef.current.push(next);
    redrawCanvas();
    await replaceSharedBoardState();
  };

  const tools = [
    { id: 'pen', label: 'Pen', icon: IconPen },
    { id: 'brush', label: 'Brush', icon: IconBrush },
    { id: 'marker', label: 'Highlighter', icon: IconHighlighter },
    { id: 'erase', label: 'Eraser', icon: IconEraser },
  ];

  return (
    <div className="ws-whiteboard">
      <div className="ws-whiteboard-toolbar">
        <div className="ws-wb-toolbar-group" role="toolbar" aria-label="Drawing tools">
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`ws-wb-tool ${tool === id ? 'ws-wb-tool--active' : ''}`}
              onClick={() => setTool(id)}
              title={label}
              aria-label={label}
              aria-pressed={tool === id}
            >
              <Icon />
            </button>
          ))}
        </div>
        <span className="ws-wb-toolbar-divider" aria-hidden />
        <div className="ws-wb-toolbar-group" title="Stroke color">
          <span className="ws-wb-tool" style={{ width: 36, height: 36, pointerEvents: 'none', color: '#64748b' }}>
            <IconPalette />
          </span>
          <label className="ws-wb-color-btn" aria-label="Stroke color">
            <input
              type="color"
              className="ws-whiteboard-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={tool === 'erase'}
            />
          </label>
        </div>
        <span className="ws-wb-toolbar-divider" aria-hidden />
        <div className="ws-wb-toolbar-group" role="toolbar" aria-label="History">
          <button type="button" className="ws-wb-tool" onClick={handleUndo} title="Undo" aria-label="Undo">
            <IconUndo />
          </button>
          <button type="button" className="ws-wb-tool" onClick={handleRedo} title="Redo" aria-label="Redo">
            <IconRedo />
          </button>
          <button
            type="button"
            className="ws-wb-tool ws-wb-tool--danger"
            onClick={clearBoard}
            title="Clear board"
            aria-label="Clear board"
          >
            <IconTrash />
          </button>
        </div>
      </div>
      {error && <div className="ws-error ws-whiteboard-error">{error}</div>}
      <p className="ws-whiteboard-hint">Live canvas — sketches sync for everyone in this workspace.</p>
      <div ref={canvasWrapRef} className="ws-whiteboard-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="ws-whiteboard-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
    </div>
  );
}
