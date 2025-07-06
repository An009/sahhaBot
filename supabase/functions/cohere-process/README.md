# Cohere Process Edge Function

This Supabase Edge Function processes user input using the Cohere API and returns relevant data with comprehensive error handling and security measures.

## Features

- ✅ Cohere API integration with authentication
- ✅ Comprehensive error handling (API errors, rate limits, timeouts)
- ✅ CORS support for web applications
- ✅ Request validation and sanitization
- ✅ 30-second timeout protection
- ✅ Detailed logging for monitoring
- ✅ Security headers and measures

## API Specification

### Endpoint
```
POST /functions/v1/cohere-process
```

### Request Body
```json
{
  "query": "string (required) - The user's input text",
  "max_tokens": "number (optional, default: 100) - Maximum response length (1-2048)",
  "temperature": "number (optional, default: 0.7) - Response creativity level (0-2)"
}
```

### Response Format

#### Success Response
```json
{
  "status": "success",
  "data": {
    "text": "Generated response from Cohere",
    "query": "Original user query",
    "parameters": {
      "max_tokens": 100,
      "temperature": 0.7
    }
  }
}
```

#### Error Response
```json
{
  "status": "error",
  "error": "Error message describing what went wrong"
}
```

## Error Handling

The function handles the following error scenarios:

- **400 Bad Request**: Invalid parameters, missing query, malformed JSON
- **401 Unauthorized**: Invalid API key
- **405 Method Not Allowed**: Non-POST requests
- **408 Request Timeout**: Requests taking longer than 30 seconds
- **429 Too Many Requests**: API rate limit exceeded
- **500 Internal Server Error**: Unexpected server errors
- **503 Service Unavailable**: Network connectivity issues

## Usage Examples

### Basic Request
```javascript
const response = await fetch('/functions/v1/cohere-process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'What are the symptoms of a common cold?'
  })
});

const result = await response.json();
console.log(result.data.text);
```

### Advanced Request
```javascript
const response = await fetch('/functions/v1/cohere-process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'Explain the treatment for headaches',
    max_tokens: 200,
    temperature: 0.5
  })
});

const result = await response.json();
if (result.status === 'success') {
  console.log(result.data.text);
} else {
  console.error(result.error);
}
```

## Deployment

1. Make sure you have Supabase CLI installed and configured
2. Deploy the function:
   ```bash
   supabase functions deploy cohere-process
   ```

## Testing

Run the included test suite:
```bash
deno run --allow-net supabase/functions/cohere-process/test.ts
```

The test suite covers:
- Valid requests with various parameters
- Error scenarios (missing parameters, invalid values)
- CORS functionality
- Network error handling

## Security Considerations

- API key is embedded in the function (consider using environment variables in production)
- CORS is configured to allow all origins (restrict in production)
- Request timeout prevents hanging connections
- Input validation prevents malicious payloads
- Comprehensive logging for security monitoring

## Monitoring

The function logs the following events:
- Request processing start (with parameters)
- Successful completions (with response length)
- All error conditions with details
- API authentication failures
- Rate limiting events
- Network timeouts

Monitor these logs in your Supabase dashboard for operational insights.