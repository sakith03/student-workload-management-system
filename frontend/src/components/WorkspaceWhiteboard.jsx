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

export default function WorkspaceWhiteboard({ groupId }) {
  const canvasRef = useRef(null);
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
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
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

    return () => {
      mounted = false;
      window.removeEventListener('resize', onResize);
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

  return (
    <div className="ws-whiteboard">
      <div className="ws-whiteboard-toolbar">
        <button type="button" className={`ws-btn ws-btn--sm ${tool === 'pen' ? '' : 'ws-btn--ghost'}`} onClick={() => setTool('pen')}>
          Pen
        </button>
        <button type="button" className={`ws-btn ws-btn--sm ${tool === 'brush' ? '' : 'ws-btn--ghost'}`} onClick={() => setTool('brush')}>
          Brush
        </button>
        <button type="button" className={`ws-btn ws-btn--sm ${tool === 'marker' ? '' : 'ws-btn--ghost'}`} onClick={() => setTool('marker')}>
          Marker
        </button>
        <button type="button" className={`ws-btn ws-btn--sm ${tool === 'erase' ? '' : 'ws-btn--ghost'}`} onClick={() => setTool('erase')}>
          Erase
        </button>
        <label className="ws-whiteboard-color-wrap">
          Color
          <input
            type="color"
            className="ws-whiteboard-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={tool === 'erase'}
          />
        </label>
        <button type="button" className="ws-btn ws-btn--ghost ws-btn--sm" onClick={handleUndo}>
          Undo
        </button>
        <button type="button" className="ws-btn ws-btn--ghost ws-btn--sm" onClick={handleRedo}>
          Redo
        </button>
        <button type="button" className="ws-btn ws-btn--ghost ws-btn--sm" onClick={clearBoard}>
          Clear board
        </button>
      </div>
      {error && <div className="ws-error">{error}</div>}
      <canvas
        ref={canvasRef}
        className="ws-whiteboard-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </div>
  );
}
