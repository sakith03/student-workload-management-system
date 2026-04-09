import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { workspaceApi } from '../api/workspaceApi';

function drawStroke(ctx, stroke) {
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.fromX, stroke.fromY);
  ctx.lineTo(stroke.toX, stroke.toY);
  ctx.stroke();
}

export default function WorkspaceWhiteboard({ groupId }) {
  const canvasRef = useRef(null);
  const connectionRef = useRef(null);
  const drawingRef = useRef(false);
  const previousPointRef = useRef(null);
  const strokesRef = useRef([]);

  const [tool, setTool] = useState('draw');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke);
      }
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const stroke of strokesRef.current) drawStroke(ctx, stroke);
    };

    connection.on('strokeReceived', (stroke) => {
      if (!mounted) return;
      strokesRef.current.push(stroke);
      drawStroke(ctx, stroke);
    });

    connection.on('boardCleared', () => {
      if (!mounted) return;
      strokesRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    const stroke = {
      fromX: previous.x,
      fromY: previous.y,
      toX: next.x,
      toY: next.y,
      color: tool === 'erase' ? '#ffffff' : '#111827',
      lineWidth: tool === 'erase' ? 18 : 2.5,
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

  return (
    <div className="ws-whiteboard">
      <div className="ws-whiteboard-toolbar">
        <button type="button" className={`ws-btn ws-btn--sm ${tool === 'draw' ? '' : 'ws-btn--ghost'}`} onClick={() => setTool('draw')}>
          Draw
        </button>
        <button type="button" className={`ws-btn ws-btn--sm ${tool === 'erase' ? '' : 'ws-btn--ghost'}`} onClick={() => setTool('erase')}>
          Erase
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
