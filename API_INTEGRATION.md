# 3Blox Game API Integration Guide

This guide explains how to integrate the 3Blox game into your platform using our plug-and-play API.

## Overview

The 3Blox Game API allows you to:
- Embed the game on your platform
- Manage player sessions and credits from your system
- Receive real-time webhooks for game events
- Track player statistics and prizes

## Getting Started

### 1. Get Your API Key

Contact your administrator to get an API key for your platform. The API key will be provided to you along with webhook configuration options.

### 2. API Base URL

All API requests should be made to:
```
https://your-game-domain.com/api/game
```

### 3. Authentication

Include your API key in all requests using the `X-API-Key` header:

```bash
curl -H "X-API-Key: your_api_key_here" \
     https://your-game-domain.com/api/game/sessions
```

## API Endpoints

### Create Game Session

Start a new game session for a player.

**Endpoint:** `POST /api/game/sessions`

**Headers:**
```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "externalPlayerId": "player123",
  "playerName": "John Doe",
  "initialCredits": 100.00,
  "stake": "1.00"
}
```

**Parameters:**
- `externalPlayerId` (optional): Your platform's player ID
- `playerName` (optional): Player's display name
- `initialCredits` (required): Starting credit balance (decimal)
- `stake` (required): Game stake amount - can be "FREE", "0.5", "1", "2", "5", "10", or "20"

**Response:**
```json
{
  "session": {
    "id": 1,
    "sessionToken": "a1b2c3d4e5f6...",
    "externalPlayerId": "player123",
    "playerName": "John Doe",
    "initialCredits": "100.00",
    "stake": "1.00",
    "status": "active",
    "createdAt": "2025-01-24T10:30:00Z"
  },
  "embedUrl": "https://your-game-domain.com?session=a1b2c3d4e5f6..."
}
```

### Get Session Details

Retrieve information about an active or completed session.

**Endpoint:** `GET /api/game/sessions/:sessionToken`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Response:**
```json
{
  "session": {
    "id": 1,
    "sessionToken": "a1b2c3d4e5f6...",
    "externalPlayerId": "player123",
    "playerName": "John Doe",
    "initialCredits": "100.00",
    "stake": "1.00",
    "score": 450,
    "prize": "2.00",
    "prizeType": "cash",
    "blocksStacked": 10,
    "highestRow": 10,
    "status": "completed",
    "createdAt": "2025-01-24T10:30:00Z",
    "endedAt": "2025-01-24T10:35:00Z"
  }
}
```

### End Game Session

Mark a session as completed and record the final results.

**Endpoint:** `POST /api/game/sessions/:sessionToken/end`

**Headers:**
```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "score": 450,
  "prize": 2.00,
  "prizeType": "cash",
  "blocksStacked": 10,
  "highestRow": 10
}
```

**Parameters:**
- `score` (required): Final game score
- `prize` (optional): Prize amount won
- `prizeType` (optional): "cash" or "points"
- `blocksStacked` (required): Number of blocks successfully stacked
- `highestRow` (required): Highest row reached

**Response:**
```json
{
  "session": {
    // Complete session object with updated fields
  },
  "message": "Session ended successfully"
}
```

## Webhooks

The API can send real-time webhook notifications to your platform for game events.

### Webhook Events

#### 1. game.started

Sent when a new game session is created.

```json
{
  "sessionId": 1,
  "sessionToken": "a1b2c3d4e5f6...",
  "externalPlayerId": "player123",
  "playerName": "John Doe",
  "initialCredits": "100.00",
  "stake": "1.00",
  "timestamp": "2025-01-24T10:30:00Z"
}
```

#### 2. game.ended

Sent when a game session is completed.

```json
{
  "sessionId": 1,
  "sessionToken": "a1b2c3d4e5f6...",
  "externalPlayerId": "player123",
  "playerName": "John Doe",
  "score": 450,
  "prize": "2.00",
  "prizeType": "cash",
  "blocksStacked": 10,
  "highestRow": 10,
  "timestamp": "2025-01-24T10:35:00Z"
}
```

#### 3. prize.won

Sent when a player wins a prize (only when prize > 0).

```json
{
  "sessionId": 1,
  "sessionToken": "a1b2c3d4e5f6...",
  "externalPlayerId": "player123",
  "playerName": "John Doe",
  "prize": "2.00",
  "prizeType": "cash",
  "timestamp": "2025-01-24T10:35:00Z"
}
```

### Webhook Security

All webhooks include an `X-Webhook-Signature` header containing an HMAC SHA-256 signature of the request body.

**Verifying Webhooks:**

```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return signature === expectedSignature;
}

// In your webhook endpoint:
app.post('/webhooks/3blox', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, YOUR_WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook event
  const eventType = req.headers['x-event-type'];
  console.log('Received event:', eventType, req.body);
  
  res.json({ received: true });
});
```

## Embedding the Game

### Option 1: iframe Embed

The simplest way to embed the game is using an iframe with the session token:

```html
<iframe 
  src="https://your-game-domain.com?session=SESSION_TOKEN_HERE"
  width="800"
  height="600"
  frameborder="0"
  allow="fullscreen"
></iframe>
```

### Option 2: Direct Link

Send players directly to the game URL with the session parameter:

```
https://your-game-domain.com?session=SESSION_TOKEN_HERE
```

## Complete Integration Example

Here's a complete example of integrating the game into your Node.js platform:

```javascript
const axios = require('axios');
const crypto = require('crypto');

const API_KEY = 'your_api_key_here';
const WEBHOOK_SECRET = 'your_webhook_secret_here';
const GAME_API_URL = 'https://your-game-domain.com/api/game';

// Create a game session
async function createGameSession(playerId, playerName, credits, stake) {
  try {
    const response = await axios.post(
      `${GAME_API_URL}/sessions`,
      {
        externalPlayerId: playerId,
        playerName: playerName,
        initialCredits: credits,
        stake: stake
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error.response?.data || error.message);
    throw error;
  }
}

// Webhook handler
function handleWebhook(req, res) {
  const signature = req.headers['x-webhook-signature'];
  const eventType = req.headers['x-event-type'];
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Handle different event types
  switch (eventType) {
    case 'game.started':
      console.log('Game started:', req.body);
      // Update your database, log analytics, etc.
      break;
      
    case 'game.ended':
      console.log('Game ended:', req.body);
      // Update player stats, credits, etc.
      break;
      
    case 'prize.won':
      console.log('Prize won:', req.body);
      // Credit player account, send notification, etc.
      if (req.body.prizeType === 'cash') {
        // Handle cash prize
        creditPlayerAccount(req.body.externalPlayerId, req.body.prize);
      } else {
        // Handle points prize
        addPlayerPoints(req.body.externalPlayerId, req.body.prize);
      }
      break;
  }
  
  res.json({ received: true });
}

// Example usage
async function startGameForPlayer(playerId, playerName) {
  const session = await createGameSession(playerId, playerName, 100.00, '1.00');
  
  console.log('Session created:', session.session.sessionToken);
  console.log('Embed URL:', session.embedUrl);
  
  return session;
}
```

## Prize Structure

The game has a 14-row grid with the following prize structure:

### Points Prizes (Rows 6-8)
- Row 6: 250 points
- Row 7: 500 points
- Row 8: 1,000 points

### Cash Prizes (Rows 9-13)
- Row 9: 1x stake
- Row 10: 2x stake
- Row 11: 5x stake
- Row 12: 10x stake
- Row 13: 100x stake

**Note:** Point prizes are multiplied based on the stake amount. Cash prizes are only available when playing with real money stakes (not FREE mode).

## Stake Options

Available stake amounts:
- `"FREE"` - Free play mode (points only)
- `"0.5"` - $0.50
- `"1"` - $1.00
- `"2"` - $2.00
- `"5"` - $5.00
- `"10"` - $10.00
- `"20"` - $20.00

## Error Handling

All API endpoints return standard HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - API key inactive or insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error responses include details:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Best Practices

1. **Store Session Tokens Securely** - Keep session tokens in your database associated with player IDs
2. **Handle Webhooks Asynchronously** - Process webhook data in background jobs to avoid timeouts
3. **Verify Webhook Signatures** - Always validate webhook signatures before processing
4. **Implement Retry Logic** - Handle temporary API failures with exponential backoff
5. **Monitor API Usage** - Track your API calls and session creation rates
6. **Test in Sandbox** - Test your integration thoroughly before going live

## Support

For technical support or to request an API key, contact your system administrator.
