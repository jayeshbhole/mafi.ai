import { Hono } from 'hono';
import { RTCManager } from './RTCManager';
import { GameState } from './types';

const app = new Hono();
const rtcManager = new RTCManager(process.env.HUDDLE01_API_KEY || '');

// In-memory game state storage (in production, use Redis or similar)
const gameStates = new Map<string, GameState>();

// Middleware to handle errors
app.use('*', async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Create a new game room
app.post('/rooms', async (c) => {
  const body = await c.req.json();
  const { title, hostId } = body;

  const room = await rtcManager.createRoom(title);
  
  gameStates.set(room.roomId, {
    roomId: room.roomId,
    hostId,
    players: new Map([[hostId, { id: hostId, name: body.hostName, isHost: true }]]),
    messages: [],
    status: 'waiting'
  });

  return c.json({ 
    roomId: room.roomId,
    token: room.token 
  });
});

// Join a game room
app.post('/rooms/:roomId/join', async (c) => {
  const roomId = c.req.param('roomId');
  const body = await c.req.json();
  const { peerId, peerName } = body;

  const gameState = gameStates.get(roomId);
  if (!gameState) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const joinToken = await rtcManager.joinRoom(roomId, peerId);
  
  gameState.players.set(peerId, {
    id: peerId,
    name: peerName,
    isHost: false
  });

  return c.json({ 
    token: joinToken,
    gameState: {
      ...gameState,
      players: Array.from(gameState.players.values())
    }
  });
});

// Send a message in the room
app.post('/rooms/:roomId/messages', async (c) => {
  const roomId = c.req.param('roomId');
  const body = await c.req.json();
  const { senderId, content, type } = body;

  const gameState = gameStates.get(roomId);
  if (!gameState) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const message = {
    id: Date.now().toString(),
    senderId,
    content,
    timestamp: Date.now(),
    type
  };

  gameState.messages.push(message);

  return c.json({ message });
});

// Get room state
app.get('/rooms/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  
  const gameState = gameStates.get(roomId);
  if (!gameState) {
    return c.json({ error: 'Room not found' }, 404);
  }

  return c.json({
    ...gameState,
    players: Array.from(gameState.players.values())
  });
});

// Update player status
app.patch('/rooms/:roomId/players/:playerId', async (c) => {
  const { roomId, playerId } = c.req.param();
  const body = await c.req.json();

  const gameState = gameStates.get(roomId);
  if (!gameState) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const player = gameState.players.get(playerId);
  if (!player) {
    return c.json({ error: 'Player not found' }, 404);
  }

  gameState.players.set(playerId, { ...player, ...body });

  return c.json({ player: gameState.players.get(playerId) });
});

export default app; 