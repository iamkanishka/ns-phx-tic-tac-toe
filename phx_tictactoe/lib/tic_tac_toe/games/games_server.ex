defmodule TicTacToe.Games.GameServer do
  use GenServer
  alias TicTacToe.{Repo, Games.Game}

  # Starts a GameServer registered under the game_id via Registry.
  def start_link(game_id) do
    GenServer.start_link(__MODULE__, game_id, name: via_tuple(game_id))
  end

  # Build the {:via, Registry, ...} name so we can find this process by game_id.
  defp via_tuple(game_id) do
    {:via, Registry, {TicTacToe.GameRegistry, game_id}}
  end

  # Boot the server with the DB-backed Game struct as state.
  # NOTE: If the game_id doesn’t exist, game will be nil — consider guarding against that.
  def init(game_id) do
    game = Repo.get(Game, game_id)
    {:ok, game}
  end

  # Public APIs that route to this process (so callers don’t need the PID).
  def get_state(game_id),                do: GenServer.call(via_tuple(game_id), :get_state)
  def make_move(game_id, player_id, pos),do: GenServer.call(via_tuple(game_id), {:make_move, player_id, pos})
  def join_game(game_id, player_id, name),do: GenServer.call(via_tuple(game_id), {:join_game, player_id, name})
  def rejoin_game(game_id, player_id),   do: GenServer.call(via_tuple(game_id), {:rejoin_game, player_id})

  # Return the current state.
  def handle_call(:get_state, _from, game) do
    {:reply, {:ok, game}, game}
  end

  # Player tries to join as O (since X is assumed pre-seated in DB).
  # Also treats "already in game" as a rejoin if status is waiting/playing.
  def handle_call({:join_game, player_id, player_name}, _from, game) do
    cond do
      # Already part of this game and game is active -> treat as rejoin.
      (game.player_x_id == player_id or game.player_o_id == player_id) and game.status in ["waiting", "playing"] ->
        refreshed_game = Repo.get(Game, game.id)

        Phoenix.PubSub.broadcast(TicTacToe.PubSub, "game:#{game.id}", {:player_rejoined, refreshed_game, player_id})
        {:reply, {:ok, refreshed_game}, refreshed_game}

      # O seat already taken -> game full.
      game.player_o_id != nil ->
        {:reply, {:error, :game_full}, game}

      # Explicit protection: player is X already.
      game.player_x_id == player_id ->
        {:reply, {:error, :already_joined}, game}

      # Happy path: set O player, flip status to "playing", broadcast start.
      true ->
        updated_game =
          game
          |> Game.changeset(%{player_o_id: player_id, player_o_name: player_name, status: "playing"})
          |> Repo.update!()

        Phoenix.PubSub.broadcast(TicTacToe.PubSub, "game:#{game.id}", {:game_started, updated_game})
        {:reply, {:ok, updated_game}, updated_game}
    end
  end

  # Rejoin logic when a known player reconnects.
  def handle_call({:rejoin_game, player_id}, _from, game) do
    cond do
      # Player belongs to this game and the game is still active.
      (game.player_x_id == player_id or game.player_o_id == player_id) and game.status in ["waiting", "playing"] ->
        refreshed_game = Repo.get(Game, game.id)

        Phoenix.PubSub.broadcast(TicTacToe.PubSub, "game:#{game.id}", {:player_rejoined, refreshed_game, player_id})
        {:reply, {:ok, refreshed_game}, refreshed_game}

      # If not active anymore -> finished.
      game.status not in ["waiting", "playing"] ->
        {:reply, {:error, :game_finished}, game}

      # Not part of this game.
      true ->
        {:reply, {:error, :not_a_player}, game}
    end
  end

  # Core move handler: validates turn/order, updates board, checks win/draw, persists, and broadcasts.
  def handle_call({:make_move, player_id, position}, _from, game) do
    cond do
      game.status != "playing" ->
        {:reply, {:error, :game_not_active}, game}

      not is_players_turn?(game, player_id) ->
        {:reply, {:error, :not_your_turn}, game}

      # Prevent overwriting a taken cell.
      Enum.at(game.board, position) != "-" ->
        {:reply, {:error, :position_taken}, game}

      true ->
        player_symbol = get_player_symbol(game, player_id)
        current_board = game.board || List.duplicate("-", 9)
        new_board = List.replace_at(current_board, position, player_symbol)

        winning_line = check_winner(new_board)
        new_moves = game.moves_count + 1
        is_draw = is_nil(winning_line) && new_moves >= 9

        {status, winner} =
          cond do
            winning_line -> {"won", player_symbol}
            is_draw      -> {"draw", nil}
            true         -> {"playing", nil}
          end

        # Only switch turn if game continues.
        next_player =
          if status == "playing", do: (if player_symbol == "X", do: "O", else: "X"), else: game.current_player

        IO.inspect(new_board, label: "✅ Updated Board (to save)")

        updated_game =
          game
          |> Game.changeset(%{
            board: new_board,
            current_player: next_player,
            status: status,
            winner: winner,
            moves_count: new_moves,
            winning_line: winning_line
          })
          |> Repo.update!()

        # Notify all subscribers exactly once.
        Phoenix.PubSub.broadcast(TicTacToe.PubSub, "game:#{game.id}", {:move_made, updated_game, player_id, position})
        {:reply, {:ok, updated_game}, updated_game}
    end
  end

  # Helpers

  # Is it this player's turn?
  defp is_players_turn?(game, player_id) do
    (game.current_player == "X" && game.player_x_id == player_id) ||
    (game.current_player == "O" && game.player_o_id == player_id)
  end

  # Map player to symbol (assumes only X and O exist).
  defp get_player_symbol(game, player_id) do
    if game.player_x_id == player_id, do: "X", else: "O"
  end

  # Return a winning combo [a,b,c] if found, else nil.
  defp check_winner(board) do
    winning_combinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], # rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], # cols
      [0, 4, 8], [2, 4, 6]             # diagonals
    ]

    Enum.find_value(winning_combinations, fn [a, b, c] = combo ->
      if Enum.at(board, a) not in ["", "-"] and
         Enum.at(board, a) == Enum.at(board, b) and
         Enum.at(board, b) == Enum.at(board, c) do
        combo
      end
    end)
  end
end
