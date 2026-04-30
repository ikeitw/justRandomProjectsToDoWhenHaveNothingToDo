# RDS Predict AI Proxy Server

Windows-friendly local AI proxy server using GitHub Models API.

## Quick Start (5 Minutes)

```powershell
# 1. Install
npm install

# 2. Configure
Copy-Item .env.example .env
# Edit .env with your GitHub token and app secret

# 3. Run
npm start

# 4. Test
npm test
```

Server runs on `http://localhost:3000`

---

## Setup

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- GitHub Personal Access Token ([create](https://github.com/settings/tokens))

### Installation

```powershell
# Install dependencies
npm install

# Copy configuration template
Copy-Item .env.example .env
```

### Configuration (.env)

```env
PORT=3000
APP_BEARER_TOKEN=your_super_secret_token_here
GITHUB_MODELS_TOKEN=your_github_pat_here
GITHUB_MODEL=openai/gpt-4.1
NODE_ENV=development
```

Generate secure `APP_BEARER_TOKEN`:
```powershell
$token = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
Write-Host $token
```

### Starting the Server

```powershell
npm start
```

Output:
```
✅ AI Proxy Server listening on port 3000
🔐 Auth: Bearer token required for /ai/chat
🤖 Provider: GitHub Models (openai/gpt-4.1)
```

---

## API Reference

### Health Check (No Auth)

```http
GET /health

Response:
{
  "ok": true,
  "provider": "github-models",
  "timestamp": "2026-04-21T...",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

### Chat Endpoint (Bearer Auth Required)

```http
POST /ai/chat
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

Request:
{
  "message": "What is Node.js?",
  "system": "Optional system prompt"
}

Response:
{
  "ok": true,
  "model": "openai/gpt-4.1",
  "output_text": "Node.js is a JavaScript runtime...",
  "raw": {
    "usage": {"prompt_tokens": 10, "completion_tokens": 50},
    "finish_reason": "stop"
  },
  "timestamp": "2026-04-21T..."
}
```

---

## Client Examples

### PowerShell
```powershell
$token = "YOUR_TOKEN"
$body = @{message = "What is AI?"} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/ai/chat `
  -Method POST -Body $body `
  -Headers @{"Authorization"="Bearer $token"}
```

### JavaScript/Node.js
```javascript
const token = 'YOUR_TOKEN';

fetch('http://localhost:3000/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What is Node.js?'
  })
})
.then(r => r.json())
.then(d => console.log(d.output_text))
```

### Python
```python
import requests

token = 'YOUR_TOKEN'
response = requests.post(
    'http://localhost:3000/ai/chat',
    json={'message': 'What is Python?'},
    headers={'Authorization': f'Bearer {token}'}
)

print(response.json()['output_text'])
```

### C#
```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;

var client = new HttpClient();
var token = "YOUR_TOKEN";

var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:3000/ai/chat")
{
    Content = new StringContent(
        JsonSerializer.Serialize(new { message = "What is C#?" }),
        Encoding.UTF8,
        "application/json"
    )
};
request.Headers.Add("Authorization", $"Bearer {token}");

var response = await client.SendAsync(request);
```

### cURL
```bash
curl -X POST http://localhost:3000/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is REST?"}'
```

### Go
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    token := "YOUR_TOKEN"
    body := map[string]string{"message": "What is Go?"}
    jsonBody, _ := json.Marshal(body)
    
    req, _ := http.NewRequest("POST", "http://localhost:3000/ai/chat", bytes.NewBuffer(jsonBody))
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    fmt.Println(resp.Status)
}
```

### Rust
```rust
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let client = Client::new();
    let token = "YOUR_TOKEN";
    
    let response = client
        .post("http://localhost:3000/ai/chat")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({"message": "What is Rust?"}))
        .send()
        .await;
}
```

---

## Project Structure

```
rds_predict/
├── server.js              # Express app entry point
├── package.json           # Dependencies
├── .env.example           # Config template
├── .gitignore            # Git security
├── README.md             # This file
│
├── src/
│   ├── config.js         # Environment loader
│   ├── middleware/
│   │   └── auth.js       # Bearer token validation
│   ├── controllers/
│   │   ├── healthController.js
│   │   └── aiController.js
│   ├── services/
│   │   └── githubModelsProvider.js
│   ├── routes/
│   │   ├── healthRoutes.js
│   │   └── aiRoutes.js
│   └── utils/
│       └── logger.js     # Secure logging
│
├── scripts/
│   └── test.js          # Test suite
│
└── [Original Python files - unchanged]
    ├── drift_aggregator.py
    ├── drift_ai_engine.py
    ├── fastapi_server.py
    └── index.html
```

---

## Testing

### Automated Tests
```powershell
npm test
```

### Manual Test
```powershell
# Health check
Invoke-WebRequest http://localhost:3000/health

# Chat request
$token = "YOUR_TOKEN"
$body = @{message = "Hello"} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/ai/chat `
  -Method POST `
  -Body $body `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## Security Features

- ✅ Bearer token authentication
- ✅ Rate limiting (100 req/15 min per IP)
- ✅ Helmet.js security headers
- ✅ CORS configured
- ✅ Input validation
- ✅ Token masking in logs
- ✅ No hardcoded secrets (.env only)
- ✅ HTTPS-ready

---

## Architecture

```
Your App
   │
   ├─ POST /ai/chat
   ├─ Authorization: Bearer token
   │
   ▼
Express Proxy (localhost:3000)
   │
   ├─ Auth validation
   ├─ Input validation
   ├─ Rate limiting
   │
   ▼
GitHub Models API
   │
   ├─ Process request
   ├─ Generate response
   │
   ▼
Return to app
```

---

## How to Extend

### Add New Provider

1. Create `src/services/newProvider.js`
```javascript
class NewProvider {
  async chat(userMessage, systemMessage = null) {
    // Call external API
    return {
      model: "model-name",
      output_text: "response",
      raw: { ... }
    };
  }
}
export default new NewProvider();
```

2. Update `src/config.js` to select provider
3. Update `src/controllers/aiController.js` to use new provider

### Add Streaming

Modify `src/routes/aiRoutes.js` to return Server-Sent Events (SSE) instead of JSON.

### Add Chat History

Add database layer (SQLite/PostgreSQL) to store conversations.

---

## Troubleshooting

### "npm: command not found"
Install Node.js 18+ from https://nodejs.org/

### "Module not found: express"
```powershell
npm install
```

### "EADDRINUSE: Port 3000 already in use"
```powershell
$env:PORT=3001
npm start
```

### "401 Unauthorized"
- Verify Authorization header is sent
- Format: `Authorization: Bearer YOUR_TOKEN`

### "503 Service Unavailable"
- Check GITHUB_MODELS_TOKEN is valid
- Visit https://github.com/settings/tokens

### "Authentication failed"
- Token might be expired
- Create a new GitHub PAT

---

## Deployment

### Production

```powershell
# Install PM2 (process manager)
npm install -g pm2

# Start with PM2
pm2 start server.js --name "ai-proxy"

# View logs
pm2 logs ai-proxy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
COPY server.js .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

### Behind Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    location /ai {
        proxy_pass http://localhost:3000;
        proxy_set_header Authorization $http_authorization;
    }
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| APP_BEARER_TOKEN | (required) | App auth token |
| GITHUB_MODELS_TOKEN | (required) | GitHub PAT |
| GITHUB_MODEL | openai/gpt-4.1 | AI model |
| LOG_LEVEL | info | Logging level |

---

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | ✅ OK | Request successful |
| 400 | ❌ Bad Request | Invalid message |
| 401 | ❌ Unauthorized | Missing auth header |
| 403 | ❌ Forbidden | Invalid token |
| 429 | ⏸️ Rate Limited | 100+ req/15 min |
| 503 | ⚠️ Unavailable | Provider error |
| 500 | 🔴 Server Error | Unhandled exception |

---

## Performance

- Startup: ~1 second
- First request: 2-5 seconds
- Typical request: 3-8 seconds
- Memory: ~50MB idle
- Max concurrent: ~100 per instance

---

## License

MIT

---

## Support

- Check `.env.example` for configuration
- Review `src/` for implementation
- Run `npm test` to verify setup
- Check logs for errors: `npm start`

---

## Original Python Code

The original Python files remain for reference:
- `drift_aggregator.py` - Web scraper
- `drift_ai_engine.py` - AI engine
- `fastapi_server.py` - FastAPI server
- `index.html` - Frontend

These are not used by the Node.js proxy server.

---

**Your AI proxy is ready! Start with: `npm install && npm start`**

