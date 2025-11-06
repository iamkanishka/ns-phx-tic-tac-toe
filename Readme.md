# 🎮 NativeScript Phoenix Tic-Tac-Toe

A real-time multiplayer Tic-Tac-Toe mobile application built with NativeScript Angular and Phoenix Framework, featuring WebSocket-based gameplay and offline mode support.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![NativeScript](https://img.shields.io/badge/NativeScript-8%2B-green)
![Phoenix](https://img.shields.io/badge/Phoenix-1.7%2B-orange)
![Angular](https://img.shields.io/badge/Angular-14%2B-red)
![License](https://img.shields.io/badge/license-MIT-blue)



## ✨ Features

### Game Modes
- **🌐 Online Multiplayer**: Real-time gameplay via Phoenix WebSockets
- **📴 Offline Mode**: Play locally without network connection
- **🔄 Seamless Mode Switching**: Toggle between online and offline modes effortlessly

### Multiplayer Features
- ✅ Create and join games with unique game IDs
- ⚡ Real-time move synchronization across devices
- 👥 Two-player turn-based gameplay
- 🏆 Win/draw detection with winning line highlights
- 📊 Game statistics and history tracking
- 🎯 Game lobby with waiting games list

### Technical Features
- 🔌 WebSocket-based real-time communication
- 🔐 RESTful API for game management
- 💾 PostgreSQL database for game persistence
- 📱 Cross-platform mobile support (iOS & Android)
- 🎨 Responsive UI with NativeScript Angular
- 🔄 Automatic reconnection handling
- ⚡ Optimized network communication

## 🏗️ Architecture
```
┌──────────────────────────────────────────────┐
│      NativeScript Mobile App (Angular)       │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │       Game Component                 │   │
│  │  ┌────────────┐  ┌────────────────┐ │   │
│  │  │   Game     │  │   Multiplayer  │ │   │
│  │  │  Service   │◄─┤    Service     │ │   │
│  │  └────────────┘  └────────┬───────┘ │   │
│  │                           │          │   │
│  │  ┌────────────────────────┘          │   │
│  │  │  Game API Service                 │   │
│  │  └────────────────────────┬──────────┘   │
│  └───────────────────────────┼──────────────┘
│                              │              │
│                    HTTP + WebSocket         │
└──────────────────────────────┼──────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────┐
│         Phoenix Framework (Elixir)           │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         Router (Endpoints)            │   │
│  │  ┌────────────┐  ┌────────────────┐  │   │
│  │  │  REST API  │  │   WebSocket    │  │   │
│  │  │ Controller │  │    Channel     │  │   │
│  │  └─────┬──────┘  └────────┬───────┘  │   │
│  └────────┼──────────────────┼──────────┘   │
│           │                  │              │
│           ▼                  ▼              │
│  ┌──────────────────────────────────────┐   │
│  │         Game Context (Logic)         │   │
│  │  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Game Schema  │  │ Game Logic   │  │   │
│  │  │   (Ecto)     │  │  (Rules)     │  │   │
│  │  └──────┬───────┘  └──────────────┘  │   │
│  └─────────┼────────────────────────────┘   │
│            │                                │
│            ▼                                │
│  ┌──────────────────────────────────────┐   │
│  │      PostgreSQL Database             │   │
│  │   (games, moves, players)            │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## 📦 Prerequisites

### Backend Requirements
- **Elixir**: 1.14 or higher
- **Phoenix Framework**: 1.7 or higher (1.7.14 recommended)
- **PostgreSQL**: 12 or higher
- **Erlang/OTP**: 24 or higher

### Frontend Requirements
- **Node.js**: 16 or higher
- **npm** or **yarn**
- **NativeScript CLI**: 8 or higher
- **Angular**: 14 or higher

### Development Environment
- **iOS Development** (macOS only):
  - Xcode 12+ with Command Line Tools
  - CocoaPods
- **Android Development**:
  - Android Studio
  - Android SDK (API 21+)
  - Java Development Kit (JDK) 11+

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/iamkanishka/ns-phx-tic-tac-toe.git
cd ns-phx-tic-tac-toe
```

### 2. Backend Setup (Phoenix Server)

```bash
# Navigate to backend directory
cd phx_tictactoe

# Install Elixir dependencies
mix deps.get

# Create and migrate database
mix ecto.create
mix ecto.migrate


mix phx.server
```

The server will start on `http://localhost:4000`

### 3. Frontend Setup (NativeScript Mobile App)

```bash
# Navigate to mobile app directory
cd ../ns-tictactoe

# Install npm dependencies
npm install


# Verify NativeScript installation
ns doctor
```

## 📁 Project Structure

```
ns-phx-tic-tac-toe/
│
├── phx_tictactoe/                 # Phoenix Backend Server
│   ├── config/
│   │   ├── config.exs            # Main configuration
│   │   ├── dev.exs               # Development config
│   │   ├── prod.exs              # Production config
│   │   └── test.exs              # Test config
│   ├── lib/
│   │   ├── phx_tictactoe/
│   │   │   ├── application.ex    # Application supervisor
│   │   │   ├── game.ex           # Game schema (Ecto)
│   │   │   ├── game_logic.ex     # Game rules & validation
│   │   │   └── repo.ex           # Database repository
│   │   └── phx_tictactoe_web/
│   │       ├── channels/
│   │       │   ├── game_channel.ex         # WebSocket game channel
│   │       │   └── user_socket.ex          # Socket configuration
│   │       ├── controllers/
│   │       │   └── game_controller.ex      # REST API endpoints
│   │       ├── endpoint.ex       # HTTP endpoint configuration
│   │       ├── router.ex         # Route definitions
│   │       └── telemetry.ex      # Monitoring & metrics
│   ├── priv/
│   │   └── repo/
│   │       └── migrations/       # Database migrations
│   ├── test/                     # Test files
│   ├── mix.exs                   # Project & dependencies
│   └── mix.lock                  # Dependency lock file
│
└── ns-tictactoe/                  # NativeScript Angular App
    ├── App_Resources/
    │   ├── Android/              # Android platform resources
    │   │   └── src/main/
    │   │       └── AndroidManifest.xml
    │   └── iOS/                  # iOS platform resources
    │       └── Info.plist
    ├── app/
    │   ├── game/
    │   │   ├── game.component.ts        # Game UI component
    │   │   ├── game.component.html      # Game template
    │   │   └── game.component.css       # Game styles
    │   ├── services/
    │   │   ├── game.service.ts          # Offline game logic
    │   │   ├── multiplayer.service.ts   # WebSocket & API service
    │   │   └── game-api.service.ts      # HTTP API client
    │   ├── app.component.ts      # Root component
    │   ├── app.module.ts         # App module & providers
    │   └── app-routing.module.ts # Route configuration
    ├── package.json              # Dependencies
    ├── tsconfig.json             # TypeScript config
    ├── webpack.config.js         # Webpack bundler config
    └── nativescript.config.ts    # NativeScript config
```

## ⚙️ Configuration

### Backend Configuration

#### 1. Database Setup (`config/dev.exs`)

```elixir
config :phx_tictactoe, PhxTictactoe.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "phx_tictactoe_dev",
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
```

### DevTunnel Configuration

```bash
Create and Expose Port 4000 with devTunnel

Open VS Code with your project
Go to Ports panel (View → Ports)
Click Forward a Port
Enter 4000
Signin into github.com with passcode given in log
Right-click the port → Port Visibility → Public
Copy the forwarded URL (e.g., https://lk3fddm2-4000.inc1.devtunnels.ms)
```

 
### Frontend Configuration

#### 1. API Endpoints (`app/services/game-socket.service.ts``)

```typescript
// VS Code Dev Tunnels Configuration (For testing on real devices)
private readonly BASE_URL = 'https://your-devtunnel-url.devtunnels.ms';
private readonly WS_URL = 'wss://your-devtunnel-url.devtunnels.ms/socket';

// Production Configuration (Update with your server)
// private readonly BASE_URL = 'https://your-production-server.com';
// private readonly WS_URL = 'wss://your-production-server.com/socket';
```

> **Important**: When using VS Code Dev Tunnels or testing on real devices, you need to expose port 4000. See [Setting Up Dev Tunnels](#setting-up-dev-tunnels-for-device-testing) .



```bash
cd ns-tictactoe

# Run on Android Emulator
ns run android

# Run on connected device
ns run android --device

# Run with live sync
ns run android --hmr
```

#### Build for Production

```bash
# Android
ns build android --release --key-store-path <path-to-keystore> \
  --key-store-password <password> \
  --key-store-alias <alias> \
  --key-store-alias-password <alias-password>
```

### Testing the Backend API

```bash
# Test server health
curl http://localhost:4000/api/health

# Or with Dev Tunnel
curl https://lk3fddm2-4000.inc1.devtunnels.ms/api/health

# Create a game
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_id": "player123",
    "player_name": "John Doe"
  }'

# Get waiting games
curl http://localhost:4000/api/games/waiting

# Get game statistics
curl http://localhost:4000/api/games/stats
```

## 📡 API Documentation

### REST API Endpoints

#### Create Game
```http
POST /api/games
Content-Type: application/json

{
  "player_id": "unique_player_id",
  "player_name": "Player Name"
}

Response: 200 OK
{
  "game_id": "game_uuid",
  "player_id": "unique_player_id",
  "status": "waiting",
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### Get All Games
```http
GET /api/games

Response: 200 OK
{
  "games": [
    {
      "id": "game_uuid",
      "player1_name": "John Doe",
      "player2_name": "Jane Smith",
      "winner": "X",
      "status": "completed",
      "completed_at": "2025-01-15T10:45:00Z"
    }
  ]
}
```

#### Get Specific Game
```http
GET /api/games/:id

Response: 200 OK
{
  "id": "game_uuid",
  "board": ["X", "O", "X", null, "O", null, null, null, null],
  "current_player": "X",
  "player1_id": "player123",
  "player1_name": "John Doe",
  "player2_id": "player456",
  "player2_name": "Jane Smith",
  "status": "in_progress",
  "winner": null,
  "winning_line": null
}
```

#### Get Waiting Games
```http
GET /api/games/waiting

Response: 200 OK
{
  "games": [
    {
      "id": "game_uuid",
      "player1_name": "John Doe",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### Get Game Statistics
```http
GET /api/games/stats

Response: 200 OK
{
  "total_games": 150,
  "completed_games": 120,
  "active_games": 10,
  "waiting_games": 20,
  "total_moves": 1080
}
```

### API Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Game doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

## 🔌 WebSocket Events

### Connection

```typescript
// Connect to WebSocket
const socket = new Socket('ws://localhost:4000/socket', {
  params: { user_token: 'optional_token' }
});

socket.connect();

// Join game channel
const channel = socket.channel('game:game_id', {
  player_id: 'player123',
  player_name: 'John Doe'
});

channel.join()
  .receive('ok', resp => console.log('Joined successfully', resp))
  .receive('error', resp => console.log('Unable to join', resp));
```

### Client → Server Events

#### Join Game (Second Player)
```typescript
channel.push('join_game', {
  game_id: 'game_uuid',
  player_id: 'player456',
  player_name: 'Jane Smith'
})
.receive('ok', response => {
  console.log('Joined game:', response);
  // response: { status: 'game_started', your_symbol: 'O' }
})
.receive('error', error => {
  console.error('Failed to join:', error);
});
```

#### Make Move
```typescript
channel.push('make_move', {
  game_id: 'game_uuid',
  player_id: 'player123',
  position: 4  // Board position (0-8)
})
.receive('ok', response => {
  console.log('Move accepted:', response);
})
.receive('error', error => {
  console.error('Invalid move:', error);
  // error: { reason: 'not_your_turn' | 'position_occupied' | 'game_over' }
});
```

### Server → Client Events

#### Game State
```typescript
channel.on('game_state', payload => {
  // Sent when joining a game
  console.log('Current game state:', payload);
  /*
  {
    board: [null, "X", null, "O", null, null, null, null, null],
    current_player: "X",
    status: "in_progress",
    player1: { id: "player123", name: "John Doe", symbol: "X" },
    player2: { id: "player456", name: "Jane Smith", symbol: "O" }
  }
  */
});
```

#### Game Started
```typescript
channel.on('game_started', payload => {
  // Sent when second player joins
  console.log('Game started:', payload);
  /*
  {
    player1: { id: "player123", name: "John Doe", symbol: "X" },
    player2: { id: "player456", name: "Jane Smith", symbol: "O" },
    your_symbol: "O",
    current_turn: "X"
  }
  */
});
```

#### Move Made
```typescript
channel.on('move_made', payload => {
  // Sent after each valid move
  console.log('Move made:', payload);
  /*
  {
    position: 4,
    player: "X",
    board: ["X", "O", "X", null, "X", null, null, null, null],
    next_turn: "O",
    status: "in_progress"
  }
  */
});
```

#### Game Over
```typescript
channel.on('game_over', payload => {
  // Sent when game ends
  console.log('Game over:', payload);
  /*
  {
    winner: "X" | "O" | "draw",
    winning_line: [0, 1, 2] | null,
    final_board: ["X", "O", "X", "O", "X", "O", "O", "X", "X"],
    status: "completed"
  }
  */
});
```

#### Player Disconnected
```typescript
channel.on('player_disconnected', payload => {
  // Sent when opponent disconnects
  console.log('Player left:', payload);
  /*
  {
    player_id: "player456",
    message: "Opponent disconnected"
  }
  */
});
```

### Error Handling

```typescript
channel.on('error', payload => {
  console.error('Channel error:', payload);
  /*
  {
    reason: "game_full" | "game_not_found" | "invalid_move",
    message: "Error description"
  }
  */
});

// Handle connection errors
socket.onError(() => {
  console.log('Connection error');
});

socket.onClose(() => {
  console.log('Connection closed');
});
```

## 📱 Usage Guide

### Creating a New Game

```typescript
async createOnlineGame(): Promise<void> {
    this.createOnlineGameLoader = true;
    try {
      this.currentGameId = await this.gameSocketService.createGame(
        this.userInfo.user.id,
        this.userInfo.user.name
      );

      console.log(this.currentGameId + "Game Created");

      this.createOnlineGameLoader = false;

      this.showLobby = false;
      this.showCreateGame = false;

      this.showToast("Game created! Share the ID with your friend.", "success");
    } catch (error: any) {
      this.createOnlineGameLoader = false;

      console.log(error + "Error Checking");

      this.showToast("Failed to create game", "error");
    }
  }
```

### Joining an Game

```typescript
  async joinOnlineGame(gameId: string): Promise<void> {
    // if (!this.playerName.trim()) {
    //   const result = await Dialogs.prompt({
    //     title: "Enter Your Name",
    //     message: "What's your name?",
    //     okButtonText: "Join",
    //     cancelButtonText: "Cancel",
    //     defaultText: "Player 2",
    //   });

    //   if (!result.result) return;
    //   this.playerName = result.text || "Player 2";
    // }
    this.isJoinLoading = true;
    try {
      await this.gameSocketService.joinGame(
        gameId,
        this.userInfo.user.id,
        this.userInfo.user.name
      );
      this.currentGameId = gameId;
      this.showLobby = false;
      this.showJoinGame = false;

      this.isJoinLoading = false;

      this.showToast("Joined game successfully!", "success");
    } catch (error: any) {
      this.isJoinLoading = false;

      this.showToast("Failed to join game", "error");
    }
  }
```

### Making Moves

```typescript
  async makeMove(index: number, view?: View): Promise<void> {
    // 🧩 Prevent overlapping animations
    if (this.isAnimating) return;
    this.isAnimating = true;

    try {
      const isOnline = this.currentMode === GameMode.Online;

      // =========================
      // 🕹️ ONLINE MODE
      // =========================
      if (isOnline) {
        if (!this.gameSocketService.isMyTurn()) {
          this.showToast("Not your turn!", "error");
          this.isAnimating = false;
          return;
        }

        // Prevent move on already filled cell
        if (
          this.gameService.cells[index] !== "" &&
          this.gameService.cells[index] !== "-"
        ) {
          this.isAnimating = false;
          return;
        }

        // Animate tapped cell before sending
        if (view) await this.animationService.cellPop(view);

        // Send move to the server (the server updates all clients)
        this.gameSocketService.makeMove(index);

        // Wait briefly so the server update can reflect in UI
        await this.delay(100);
      }

      // =========================
      // 🎮 OFFLINE MODE
      // =========================
      else {
        if (this.gameService.gameState !== GameState.Playing) {
          this.isAnimating = false;
          return;
        }

        this.cellStates[index] = true;
        this.suggestedMove = null;

        // Animate tapped cell
        if (view) await this.animationService.cellPop(view);
        else await this.delay(this.getAnimationSpeed());

        // Apply the move in local game logic
        this.gameService.makeMove(index);
      }

      // =========================
      // 🌟 SHARED ANIMATION LOGIC
      // (Works for both Online & Offline)
      // =========================

      // Wait a bit before showing results
      await this.delay(300);

      // 🏆 WIN condition
      if (this.gameService.gameState !== GameState.Playing) {
        const winningLine = this.gameService.winningLine;

        if (winningLine && winningLine.length > 0) {
          const winViews: View[] = winningLine
            .map((i) => this.cellRefs[i])
            .filter((v): v is View => !!v);

          // 💫 Shake all winning cells together
          await this.animationService.multiCellShake(winViews);

          // 🎯 Center cell celebration
          const centerIndex = winningLine[Math.floor(winningLine.length / 2)];
          const centerCell = this.cellRefs[centerIndex];
          if (centerCell) {
            await this.animationService.celebrateWin(centerCell);
          }

          // 🎉 Confetti + celebration trigger
          this.confetti_Burst.trigger();
          this.gameService.confettiCelebrate();

          // 🔁 Keep winning cells pulsing
          this.loopWinningPulse(winViews);
        } else {
          // 🤝 DRAW condition — shake all cells
          for (const ref of this.cellRefs) {
            const cell = ref as View;
            if (cell) await this.animationService.shakeAnimation(cell);
          }
        }
      }
    } catch (err) {
      console.error("makeMove error:", err);
    } finally {
      this.isAnimating = false;
    }
  }

 
```

### Handling Game Events

```typescript
ngOnInit() {
    // Start by loading Google user info
    this.loadGoogleUserInfo();

    // Subscribe to local game state
    this.gameService.board$
      .pipe(takeUntil(this.destroy$))
      .subscribe((board) => {
        this.updateStats(board);
        this.cdRef.detectChanges();
      });

    this.gameService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings) => {
        this.settings = settings;
        this.cdRef.detectChanges();
      });

    // Subscribe to multiplayer game state
    this.gameSocketService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((game) => {
        if (game && this.currentMode === GameMode.Online) {
          // Update local game service with server state
          this.gameService.updateBoardFromServer(
            game.cells,
            game.state,
            game.winner,
            game.winning_line,
            game.current_player
          );
        }
      });

    // Subscribe to connection status
    this.gameSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.connectionStatus = status;
        this.cdRef.detectChanges();
      });

    // Subscribe to opponent connection
    this.gameSocketService.opponentConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        this.opponentConnected = connected;
        if (connected && this.currentMode === GameMode.Online) {
          this.showToast("Opponent joined! Game starting...", "success");
        }
        this.cdRef.detectChanges();
      });

    // Subscribe to player symbol
    this.gameSocketService.myPlayerSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe((symbol) => {
        this.mySymbol = symbol;
      });

    // Subscribe to errors
    this.gameSocketService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        console.log(error);

        if (error) {
          this.showToast(error, "error");
        }
      });
 
}
```

### Fetching Game Lists

```typescript
async loadWaitingGames() {
  try {
    const games = await this.multiplayerService.getWaitingGames();
    console.log('Waiting games:', games);
    
    // Display list in UI
    this.waitingGames = games;
    
  } catch (error) {
    console.error('Failed to load waiting games:', error);
  }
}

```



#### 2. Database Connection Errors

```bash

# Check if PostgreSQL is running
# make sure you have postgres

pg_isready


# Reset database
mix ecto.drop
mix ecto.create
mix ecto.migrate
```

#### 3. Missing Dependencies

```bash
# Update all dependencies
mix deps.get
mix deps.compile

# Clean build artifacts
mix clean
mix compile
```



**Checklist for WebSocket Issues:**
- [ ] Phoenix server is running (`mix phx.server`)
- [ ] Port 4000 is accessible (not blocked by firewall)
- [ ] If using Dev Tunnels, tunnel is running and URL is updated
- [ ] Correct protocol used (ws:// for local, wss:// for tunnels)
- [ ] Phoenix `check_origin` is configured correctly set to false
- [ ] Android manifest has `usesCleartextTraffic="true"` (for 