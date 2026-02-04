# API Reference

Complete documentation for all API endpoints in the NBG Coaching Practice Platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Scoring Endpoints](#scoring-endpoints)
  - [Webhook Endpoints](#webhook-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Overview

The NBG Coaching Practice Platform exposes several API endpoints for:
- Triggering AI scoring workflows
- Checking scoring status
- Receiving webhooks from external services

All endpoints are built with Next.js API Routes and return JSON responses.

## Authentication

### User Authentication

Most endpoints require user authentication via Supabase session cookies.

**How it works:**
1. User logs in via `/login`
2. Supabase sets session cookie
3. API routes validate session using `createClient()`
4. User must own the resource being accessed (enforced by RLS)

**Example:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Webhook Authentication

Webhook endpoints are public but should implement signature verification in production.

**Recommended:**
- Verify webhook signatures
- Use webhook secrets
- Validate payload structure

## Base URL

**Development:**
```
http://localhost:3000
```

**Production:**
```
https://your-app.vercel.app
```

## Endpoints

### Scoring Endpoints

#### POST /api/score

Triggers the AI scoring workflow for a practice session.

**Authentication:** Required (user must own the session)

**Request Body:**
```json
{
  "session_id": "uuid-of-practice-session"
}
```

**Response (200 OK):**
```json
{
  "message": "Scoring workflow started",
  "run_id": "workflow-run-id",
  "session_id": "uuid-of-practice-session"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "session_id is required"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Practice session not found or access denied"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to start scoring workflow",
  "details": "Error message"
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    session_id: 'abc123-def456-ghi789'
  })
});

const data = await response.json();
console.log('Workflow started:', data.run_id);
```

**Workflow Steps:**
1. Validates session exists and user has access
2. Starts Vercel Workflow with session ID
3. Returns immediately with workflow run ID
4. Workflow executes asynchronously:
   - Fetches practice session and transcript
   - Fetches scoring rubric from prompts table
   - Sends to OpenAI for evaluation
   - Saves scorecard to database
   - Updates session scoring_status

**Timing:**
- API response: < 1 second
- Workflow completion: 5-15 seconds

---

#### GET /api/score/status

Checks the scoring status of a practice session.

**Authentication:** Required (user must own the session)

**Query Parameters:**
- `session_id` (required) - UUID of the practice session

**Request:**
```
GET /api/score/status?session_id=abc123-def456-ghi789
```

**Response (200 OK):**
```json
{
  "session_id": "abc123-def456-ghi789",
  "scoring_status": "scored",
  "scorecard_id": "scorecard-uuid",
  "has_transcript": true
}
```

**Scoring Status Values:**
- `null` - Not yet scored
- `"scoring"` - Currently being scored
- `"scored"` - Scoring complete
- `"failed"` - Scoring failed

**Response (400 Bad Request):**
```json
{
  "error": "session_id is required"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Session not found or access denied"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to get scoring status",
  "details": "Error message"
}
```

**Example Usage:**
```typescript
// Poll for scoring completion
const checkStatus = async (sessionId: string) => {
  const response = await fetch(
    `/api/score/status?session_id=${sessionId}`
  );
  const data = await response.json();
  
  if (data.scoring_status === 'scored') {
    console.log('Scoring complete!', data.scorecard_id);
    return true;
  } else if (data.scoring_status === 'failed') {
    console.error('Scoring failed');
    return false;
  }
  
  // Still scoring, check again
  return null;
};

// Poll every 2 seconds
const pollInterval = setInterval(async () => {
  const result = await checkStatus(sessionId);
  if (result !== null) {
    clearInterval(pollInterval);
  }
}, 2000);
```

**Use Cases:**
- Polling after triggering scoring
- Checking if session can be scored
- Verifying transcript availability
- Getting scorecard ID for display

---

### Webhook Endpoints

#### POST /api/webhooks/elevenlabs

Receives webhooks from ElevenLabs when conversations end.

**Authentication:** Public (no auth required, but should verify signature in production)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "conversation_id": "elevenlabs-conversation-id",
  "agent_id": "agent_9601kah50rr6ffzr8psnzzp2c51b",
  "transcript": [
    {
      "role": "agent",
      "message": "Hello, how can I help you today?",
      "timestamp": 1234567890
    },
    {
      "role": "user",
      "message": "I need help with my coaching skills.",
      "timestamp": 1234567895
    }
  ],
  "metadata": {
    "start_time_unix_secs": 1234567890,
    "call_duration_secs": 120,
    "termination_reason": "user_hangup",
    "cost": 15
  },
  "analysis": {
    "call_successful": true,
    "transcript_summary": "User discussed coaching skills improvement",
    "call_summary_title": "Coaching Skills Discussion"
  },
  "conversation_initiation_client_data": {
    "dynamic_variables": {
      "character_name": "Monica",
      "activity_id": "activity-uuid"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Webhook processed successfully",
  "session_id": "practice-session-uuid",
  "status": "success"
}
```

**Response (200 OK - No Session Found):**
```json
{
  "message": "No matching session found. Session may have been created client-side.",
  "status": "no_session_found"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "conversation_id is required"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to process webhook",
  "details": "Error message"
}
```

**Webhook Flow:**
1. ElevenLabs sends webhook when conversation ends
2. Endpoint finds matching practice_session by:
   - conversation_id (if stored)
   - agent_id + recent timestamp (within 5 minutes)
3. Updates session with:
   - Full transcript
   - Call metadata (duration, cost, termination reason)
   - Analysis results
   - Dynamic variables
4. Returns success response

**Configuration:**

Set webhook URL in ElevenLabs Dashboard:
```
https://your-app.vercel.app/api/webhooks/elevenlabs
```

**Security Recommendations:**

```typescript
// Add signature verification
const signature = req.headers.get('x-elevenlabs-signature');
const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

if (!verifySignature(signature, secret, payload)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

**Automatic Scoring (Optional):**

Uncomment in webhook handler to trigger scoring automatically:
```typescript
// Trigger automatic scoring
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/score`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ session_id: session.id }),
});
```

---

## Error Handling

### Standard Error Response

All endpoints return errors in this format:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Request successful |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

### Error Handling Best Practices

**Client-Side:**
```typescript
try {
  const response = await fetch('/api/score', {
    method: 'POST',
    body: JSON.stringify({ session_id }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  toast.error(error.message);
}
```

**Server-Side:**
```typescript
export async function POST(req: Request) {
  try {
    // Your logic here
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

## Rate Limiting

### Current Implementation

**No rate limiting is currently implemented.**

### Recommended for Production

Implement rate limiting to prevent abuse:

**Using Vercel Edge Config:**
```typescript
import { ratelimit } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // Continue with request
}
```

**Recommended Limits:**
- `/api/score`: 10 requests per minute per user
- `/api/score/status`: 60 requests per minute per user
- `/api/webhooks/*`: 100 requests per minute per IP

## API Client Example

### TypeScript Client

```typescript
class NBGApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  async triggerScoring(sessionId: string) {
    const response = await fetch(`${this.baseUrl}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
  
  async checkScoringStatus(sessionId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/score/status?session_id=${sessionId}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
  
  async pollUntilScored(sessionId: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkScoringStatus(sessionId);
      
      if (status.scoring_status === 'scored') {
        return status;
      } else if (status.scoring_status === 'failed') {
        throw new Error('Scoring failed');
      }
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Scoring timeout');
  }
}

// Usage
const client = new NBGApiClient();

try {
  await client.triggerScoring(sessionId);
  const result = await client.pollUntilScored(sessionId);
  console.log('Scorecard ID:', result.scorecard_id);
} catch (error) {
  console.error('Error:', error);
}
```

## Testing APIs

### Using curl

**Trigger Scoring:**
```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{"session_id": "your-session-id"}' \
  -b "cookies.txt"
```

**Check Status:**
```bash
curl http://localhost:3000/api/score/status?session_id=your-session-id \
  -b "cookies.txt"
```

**Test Webhook:**
```bash
curl -X POST http://localhost:3000/api/webhooks/elevenlabs \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

### Using Postman

1. Import collection from `/docs/postman/`
2. Set environment variables
3. Test endpoints

---

**Need more details?** Check the source code:
- [/app/api/score/route.ts](../app/api/score/route.ts)
- [/app/api/score/status/route.ts](../app/api/score/status/route.ts)
- [/app/api/webhooks/elevenlabs/route.ts](../app/api/webhooks/elevenlabs/route.ts)

**Related Documentation:**
- [Architecture Overview](ARCHITECTURE.md) - System design
- [Features Documentation](FEATURES.md) - Feature details
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues
