# Voice Command Shopping Assistant

A voice-based shopping list manager with smart suggestions, built with React, Node.js, Dialogflow, and Firebase.

## Features

- **Voice Input**: Add items using voice commands with Web Speech API
- **Natural Language Processing**: Understand varied phrases via Dialogflow
- **Smart Suggestions**: 
  - Product recommendations based on shopping history ("You frequently buy milk and haven't added it recently")
  - Seasonal recommendations (items in season)
  - Low stock alerts for frequently purchased items
- **Substitutes & Alternatives**: Get product alternatives when items are unavailable
- **Search & Price Filters**: Find items by brand, price range, and category
- **Shopping List Management**: Add/remove items with automatic categorization and quantity management
- **Multilingual Support**: Voice commands in multiple languages
- **Real-time Updates**: Instant list management with Firestore backend

## Tech Stack

- **Frontend**: React, Web Speech API, CSS3
- **Backend**: Node.js, Express
- **AI/NLP**: Google Dialogflow
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Data Sourcing**: Product catalog, categorization, and suggestion data are inspired by public datasets such as Instacart Grocery Orders, Groceries Dataset (Kaggle), and Open Food Facts for realistic recommendations.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Google Cloud Project with Dialogflow API enabled
- Firebase project with Firestore database

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd voice-command-shopping-assistant

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

#### Server Environment (server/.env)
```env
PORT=5000
DIALOGFLOW_PROJECT_ID=your-dialogflow-project-id
DEFAULT_LANGUAGE_CODE=en-US
FIREBASE_PROJECT_ID=your-firebase-project-id
CLIENT_ORIGIN=http://localhost:3000
```

#### Client Environment (client/.env)
```env
REACT_APP_API_BASE=http://localhost:5000
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Generate service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `server/firebase-service-account.json`

### 4. Dialogflow Setup

1. Create a Dialogflow project at [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Create entities:
   - **item** (custom): Add items like milk, bread, apple, toothpaste
   - **brand** (custom): Add brands like Amul, Britannia, Colgate
   - **size** (custom): Add sizes like 1L, 500g, 1kg
   - **category** (custom): Add categories like dairy, produce, bakery, staples, personal care, snacks, beverages

3. Create intents with exact names:
   - **AddItemIntent**: Parameters: item (@item), quantity (@sys.number)
   - **RemoveItemIntent**: Parameters: item (@item)
   - **GetListIntent**: No parameters
   - **SearchItemIntent**: Parameters: item (@item), brand (@brand), category (@category), minPrice (@sys.number), maxPrice (@sys.number)
   - **SuggestionsIntent**: No parameters
   - **SubstitutesIntent**: Parameters: item (@item)

4. Add training phrases for each intent (see Dialogflow documentation)

### 5. Run the Application

```bash
# Start server (from server directory)
cd server
npm start

# Start client (from client directory, in new terminal)
cd client
npm start
```

The application will be available at:
- Client: http://localhost:3000
- Server: http://localhost:5000

## Usage

### Voice Commands

- **Add items**: "Add milk", "Add 2 bottles of milk", "I need apples"
- **Remove items**: "Remove milk", "Take bread off the list"
- **View list**: "What's on my list", "Show my shopping list"
- **Search items**: "Find toothpaste under 80 rupees", "Search Amul milk"
- **Get suggestions**: "What should I buy", "Give me suggestions"
- **Find substitutes**: "What can I use instead of milk", "Find alternatives to bread"
- **Quantity management**: "Add 5 oranges", "Buy 2 bottles of water"

### Manual Input

Use the text input field for commands when voice recognition is unavailable.

## API Endpoints

- `POST /api/dialogflow/query` - Process voice/text commands
- `GET /api/list` - Get all shopping list items
- `POST /api/list` - Add item to list
- `DELETE /api/list/:id` - Remove item from list

## Project Structure

```
voice-command-shopping-assistant/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   └── App.css        # Styling
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   └── package.json
└── README.md
```

## Deployment

### Option 1: Firebase Hosting + Cloud Functions
- Deploy client to Firebase Hosting
- Deploy server to Cloud Functions

### Option 2: Vercel + Render
- Deploy client to Vercel
- Deploy server to Render

### Option 3: Single VM (GCP/AWS)
- Deploy both client and server to a single VM

## Troubleshooting

### Voice Recognition Issues
- Ensure microphone permissions are granted
- Use HTTPS in production (required for Web Speech API)
- Try different browsers (Chrome recommended)

### Dialogflow Issues
- Verify project ID and credentials
- Check intent names match exactly
- Ensure training phrases are comprehensive

### Firebase Issues
- Verify service account key path
- Check Firestore rules allow read/write

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
