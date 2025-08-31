# Deployment Guide - Voice Command Shopping Assistant

## Issues Fixed

### 1. 404 Errors for Shopping List
- **Problem**: Missing environment variables causing Firebase connection failures
- **Solution**: Added fallback to in-memory storage when Firebase credentials are missing
- **Files Updated**: `server/src/services/firestore.js`

### 2. Voice Commands Not Working
- **Problem**: Dialogflow service account path was relative and could fail in production
- **Solution**: Updated to use environment variables instead of JSON file for better security
- **Files Updated**: `server/src/services/dialogflow.js`

### 3. Better Error Handling
- **Problem**: Server crashes when services fail
- **Solution**: Added comprehensive error handling and logging
- **Files Updated**: `server/src/index.js`

## Environment Variables Required

Set these in your Render environment variables:

### Firebase Configuration
```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

### Dialogflow Configuration
```
DIALOGFLOW_PROJECT_ID=your-dialogflow-project-id
DEFAULT_LANGUAGE_CODE=en-US
```

### Server Configuration
```
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=*
```

**Note about CLIENT_ORIGIN:**
- Use `*` to allow all origins (less secure but works immediately)
- Once you know your client domain, update it to: `https://your-client-domain.onrender.com`
- For local testing: `http://localhost:3000`

## Deployment Steps

### 1. Server Deployment (Render)
1. Connect your GitHub repository to Render
2. Set the following:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: Leave empty (deploy from root)

### 2. Client Deployment (Render)
1. Create a new static site
2. Set the following:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`
   - **Root Directory**: Leave empty

### 3. Environment Variables
Add all the environment variables listed above to your server service in Render.

**Important**: The `firebase-service-account.json` file is NOT needed in production. All credentials are now handled through environment variables for better security.

## Testing After Deployment

### 1. Test Server Health
```bash
curl https://your-server-domain.onrender.com/api/health
```
Should return: `{"ok":true,"message":"Server is running!"}`

### 2. Test Shopping List API
```bash
curl https://your-server-domain.onrender.com/api/list
```
Should return an array (empty if no items)

### 3. Test Dialogflow API
```bash
curl -X POST https://your-server-domain.onrender.com/api/dialogflow/query \
  -H "Content-Type: application/json" \
  -d '{"message":"add milk","sessionId":"test"}'
```

## Troubleshooting

### If you still get 404 errors:
1. Check Render logs for server startup errors
2. Verify all environment variables are set
3. Check if the server is actually running on the correct port

### If voice commands don't work:
1. Check browser console for CORS errors
2. Verify the client is pointing to the correct server URL
3. Check if Dialogflow credentials are properly configured

### If the shopping list doesn't load:
1. Check if Firebase credentials are correct
2. The app will now fall back to in-memory storage if Firebase fails
3. Check server logs for any Firebase connection errors

## Fallback Behavior

The application now includes fallback mechanisms:
- **Firebase**: Falls back to in-memory storage if credentials are missing or connection fails
- **Dialogflow**: Returns a fallback response if the service is unavailable
- **Server**: Better error handling prevents crashes

This ensures the app remains functional even if some services are not properly configured.

## Updating Client Origin Later

Once you deploy your client and know its URL:

1. Go to your server service in Render
2. Find the environment variables section
3. Update `CLIENT_ORIGIN` from `*` to your actual client URL
4. Redeploy the server

Example:
```
CLIENT_ORIGIN=https://voice-command-shopping-assistant-client.onrender.com
```

## Security Note

- The `firebase-service-account.json` file should NOT be committed to GitHub
- All credentials are now handled through environment variables
- This is more secure and follows best practices for deployment
