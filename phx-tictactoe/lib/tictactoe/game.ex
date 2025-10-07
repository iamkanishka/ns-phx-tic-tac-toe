# lib/tic_tac_toe/game.ex
defmodule Tictactoe.Game do
  import Ecto.Query, warn: false
  alias Tictactoe.Repo
  alias Tictactoe.Game.Game

  @winning_combinations [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], # rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], # columns
    [0, 4, 8], [2, 4, 6]             # diagonals
  ]

  # In-memory game state (for active games)
  defmodule State do
    defstruct [
      :id,
      :board,
      :status,
      :current_player,
      :winner,
      :winning_line,
      :player_x,
      :player_o,
      :turn_count,
      :players
    ]
  end

  # Game process registry
  def start_game_process(game_id, player_x \\ nil, player_o \\ nil) do
    initial_state = %State{
      id: game_id,
      board: Game.initial_board(),
      status: "waiting",
      current_player: "X",
      winner: nil,
      winning_line: nil,
      player_x: player_x,
      player_o: player_o,
      turn_count: 0,
      players: %{}
    }

    # Store in process dictionary or ETS for production
    Process.put({:game, game_id}, initial_state)
    initial_state
  end

  def get_game_state(game_id) do
    Process.get({:game, game_id})
  end

  def update_game_state(game_id, updates) do
    case get_game_state(game_id) do
      nil -> nil
      state ->
        new_state = struct!(state, updates)
        Process.put({:game, game_id}, new_state)
        new_state
    end
  end

  # Socket-only gameplay operations
  def join_game(game_id, player_id, player \\ nil) do
    state = get_game_state(game_id)

    cond do
      is_nil(state) ->
        {:error, "Game not found"}

      state.status != "waiting" ->
        {:error, "Game already started"}

      true ->
        players = Map.put(state.players, player_id, player || determine_player_role(state))
        new_state = %{state | players: players}

        # Auto-assign X and O if not set
        new_state =
          if is_nil(new_state.player_x) do
            %{new_state | player_x: player_id}
          else
            %{new_state | player_o: player_id}
          end

        # Auto-start if both players joined
        new_state =
          if new_state.player_x && new_state.player_o do
            %{new_state | status: "playing"}
          else
            new_state
          end

        update_game_state(game_id, new_state)
        {:ok, new_state}
    end
  end

  defp determine_player_role(state) do
    if is_nil(state.player_x), do: "X", else: "O"
  end

  def make_move(game_id, player_id, position) when position in 0..8 do
    state = get_game_state(game_id)

    with :ok <- validate_move(state, player_id, position) do
      symbol = get_player_symbol(state, player_id)
      board = update_board(state.board, position, symbol)

      {winner, winning_line} = check_winner(board)
      turn_count = state.turn_count + 1

      # Determine new status
      status = cond do
        winner -> "finished"
        turn_count == 9 -> "finished"
        true -> "playing"
      end

      new_state = %{
        state |
        board: board,
        current_player: if(symbol == "X", do: "O", else: "X"),
        winner: winner || (if turn_count == 9, do: "draw", else: nil),
        winning_line: winning_line,
        status: status,
        turn_count: turn_count
      }

      update_game_state(game_id, new_state)

      # Save to database only when game is finished
      if status == "finished" do
        save_completed_game(new_state)
      end

      {:ok, new_state}
    end
  end

  defp validate_move(state, player_id, position) do
    cond do
      is_nil(state) ->
        {:error, "Game not found"}
      state.status != "playing" ->
        {:error, "Game is not in progress"}
      get_player_symbol(state, player_id) != state.current_player ->
        {:error, "It's not your turn"}
      state.board[to_string(position)] != nil ->
        {:error, "Position already taken"}
      true ->
        :ok
    end
  end

  defp get_player_symbol(state, player_id) do
    cond do
      state.player_x == player_id -> "X"
      state.player_o == player_id -> "O"
      true -> nil
    end
  end

  defp update_board(board, position, symbol) do
    Map.put(board, to_string(position), symbol)
  end

  defp check_winner(board) do
    @winning_combinations
    |> Enum.find_value(fn combo ->
      values = Enum.map(combo, &board[to_string(&1)])
      if Enum.all?(values) && Enum.uniq(values) |> length() == 1 do
        {hd(values), combo}
      end
    end)
    |> case do
      {winner, line} -> {winner, line}
      nil -> {nil, nil}
    end
  end

  # Save completed game to database
  defp save_completed_game(state) do
    game_attrs = %{
      board: state.board,
      status: "finished",
      current_player: state.current_player,
      winner: state.winner,
      winning_line: state.winning_line,
      player_x: state.player_x,
      player_o: state.player_o,
      turn_count: state.turn_count,
      completed_at: DateTime.utc_now()
    }

    %Game{}
    |> Game.changeset(game_attrs)
    |> Repo.insert()
  end

  # API for retrieving completed games
  def get_completed_game(game_id) do
    Game
    |> where([g], g.id == ^game_id and g.status == "finished")
    |> Repo.one()
  end

  def list_completed_games(limit \\ 20) do
    Game
    |> where([g], g.status == "finished")
    |> order_by(desc: :completed_at)
    |> limit(^limit)
    |> Repo.all()
  end

  # Cleanup for abandoned games
  def cleanup_abandoned_games do
    # In production, you'd want to track last activity
    # and remove games that have been inactive for too long
    :ok
  end
end
