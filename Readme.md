# Tic Tac Toe Multiplayer - Complete Setup Guide

## 🎮 Overview
This setup integrates real-time multiplayer functionality into your existing NativeScript Angular Tic Tac Toe game using Phoenix WebSockets.

---

## 📋 Prerequisites

### Backend (Phoenix)
- Elixir 1.14+
- Phoenix 1.7+
- PostgreSQL 12+

### Frontend (NativeScript Angular)
- Node.js 16+
- NativeScript CLI 8+
- Angular 14+

---

## 🚀 Backend Setup (Phoenix)

### 1. Create Phoenix Project
```bash
mix phx.new tic_tac_toe --no-html --no-assets
cd tic_tac_toe
```

### 2. Add Dependencies
Add to `mix.exs`:
```elixir
defp deps do
  [
    {:phoenix, "~> 1.7.14"},
    {:phoenix_ecto, "~> 4.5"},
    {:ecto_sql, "~> 3.11"},
    {:postgrex, ">= 0.0.0"},
    {:jason, "~> 1.4"},
    {:cors_plug, "~> 3.0"},
    {:plug_cowboy, "~> 2.7"}
  ]
end
```

### 3. Install Dependencies
```bash
mix deps.get
```

### 4. Configure Database
Edit `config/dev.exs`:
```elixir
config :tic_tac_toe, TicTacToe.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "tic_tac_toe_dev",
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
```

### 5. Create Database & Run Migration
```bash
mix ecto.create
mix ecto.migrate
```

### 6. Generate Secret Keys
```bash
mix phx.gen.secret
```
Update `config/config.exs` with the generated secret key.

### 7. Start Server
```bash
mix phx.server
```
Server runs on `http://localhost:4000`

### 8. Test API
```bash
# Create a game
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{"player_id":"test123","player_name":"TestPlayer"}'

# Get waiting games
curl http://localhost:4000/api/games/waiting

# Get stats
curl http://localhost:4000/api/games/stats
```

---

## 📱 Frontend Setup (NativeScript Angular)

### 1. Install Phoenix Socket Client
```bash
npm install phoenix --save
```

### 2. Add Services to Your Project

Copy these files to your project:
- `multiplayer.service.ts` → `app/services/multiplayer.service.ts`
- Update your existing `game.service.ts` with the provided version
- `game.component.ts` → `app/game/game.component.ts`

### 3. Update App Module

```typescript
// app.module.ts
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule } from '@nativescript/angular';
import { NativeScriptHttpClientModule } from '@nativescript/angular';
import { NativeScriptFormsModule } from '@nativescript/angular';

import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { GameService } from './services/game.service';
import { MultiplayerService } from './services/multiplayer.service';
import { GameApiService } from './services/game-api.service';

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    NativeScriptModule,
    NativeScriptHttpClientModule,
    NativeScriptFormsModule
  ],
  declarations: [
    AppComponent,
    GameComponent
  ],
  providers: [
    GameService,
    MultiplayerService,
    GameApiService
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
```

### 4. Configure Server URL

Update `multiplayer.service.ts`:
```typescript
// For development
private readonly BASE_URL = 'http://localhost:4000';
private readonly WS_URL = 'ws://localhost:4000/socket';

// For production
private readonly BASE_URL = 'https://your-server.com';
private readonly WS_URL = 'wss://your-server.com/socket';
```

### 5. iOS Configuration

Add to `App_Resources/iOS/Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 6. Android Configuration

Add to `App_Resources/Android/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<application
    android:usesCleartextTraffic="true"
    ...>
```

---

## 🎯 Usage Examples

### Creating a New Game
```typescript
// In your component
async createGame() {
  const playerId = this.generatePlayerId();
  const playerName = 'YourName';
  
  try {
    const gameId = await this.multiplayerService.createGame(playerId, playerName);
    console.log('Game created:', gameId);
  } catch (error) {
    console.error('Failed to create game:', error);
  }
}
```

### Joining an Existing Game
```typescript
async joinGame(gameId: string) {
  const playerId = this.generatePlayerId();
  const playerName = 'YourName';
  
  try {
    await this.multiplayerService.joinGame(gameId, playerId, playerName);
    console.log('Joined game successfully');
  } catch (error) {
    console.error('Failed to join game:', error);
  }
}
```

### Making a Move
```typescript
onCellClick(index: number) {
  if (this.multiplayerService.isOnlineMode) {
    this.multiplayerService.makeOnlineMove(index);
  } else {
    this.gameService.makeMove(index);
  }
}
```

### Switching Between Modes
```typescript
// Go offline
this.multiplayerService.setMode(MultiplayerMode.Offline);

// Go online
this.multiplayerService.setMode(MultiplayerMode.Online);
```

---

## 🔧 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Or use a different port in config/dev.exs
config :tic_tac_toe, TicTacToeWeb.Endpoint,
  http: [port: 4001]
```

**Database connection errors:**
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
mix ecto.drop && mix ecto.create && mix ecto.migrate
```

**CORS errors:**
Make sure CORS is configured in your router:
```elixir
plug CORSPlug, origin: "*"
```

### Frontend Issues

**WebSocket connection fails:**
- Check server is running
- Verify WebSocket URL is correct
- Check firewall/network settings
- For Android: Ensure `usesCleartextTraffic="true"` in manifest

**Phoenix module not found:**
```bash
npm install phoenix --save
```

**Haptic feedback not working:**
Implement NativeScript haptic feedback:
```typescript
import { Feedback } from '@nativescript/feedback';

const feedback = new Feedback();
feedback.success({
  title: 'Success',
  message: 'Move made!',
  duration: 1000
});
```

---

## 📊 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games` | Create new game |
| GET | `/api/games` | Get completed games |
| GET | `/api/games/:id` | Get specific game |
| GET | `/api/games/waiting` | Get waiting games |
| GET | `/api/games/stats` | Get game statistics |

### WebSocket Events

**Client → Server:**
- `join_game` - Join as second player
- `make_move` - Make a move

**Server → Client:**
- `game_state` - Initial game state
- `game_started` - Game started (both players joined)
- `move_made` - Move was made

---

## 🎨 Customization

### Change Colors
Edit the CSS in `game.component.css`:
```css
.btn-primary {
  background-color: #your-color;
}

.cell.x .cell-value {
  color: #your-x-color;
}

.cell.o .cell-value {
  color: #your-o-color;
}
```

### Add Sound Effects
```typescript
import { Audio } from '@nativescript/audio';

playSound(type: 'move' | 'win' | 'lose') {
  const player = new Audio();
  player.audioFromFile(`~/sounds/${type}.mp3`);
  player.play();
}
```

### Add Animations
Use NativeScript animations:
```typescript
import { Animation } from '@nativescript/core';

animateCell(cell: View) {
  const animation = new Animation([{
    target: cell,
    scale: { x: 1.2, y: 1.2 },
    duration: 200
  }]);
  animation.play();
}
```

---

## 🚢 Deployment

### Backend (Heroku)
```bash
# Add buil