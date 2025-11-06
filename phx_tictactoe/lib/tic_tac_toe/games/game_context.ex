defmodule TicTacToe.Games.GameContext do
  @moduledoc """
  The Games context - handles all business logic for Tic Tac Toe games.
  """
  alias TicTacToe.{Repo, Games.Game}

  @doc """
  Gets a game by ID.
  """
  def get_game(game_id) do
    Repo.get(Game, game_id)
  end

  @doc """
  Joins a player to a game as player O.
  Returns {:ok, game} or {:error, reason}.
  """
  def join_player(game, player_id, player_name) do
    cond do
      # Already part of this game and game is active -> treat as rejoin
      is_player_in_game?(game, player_id) and game.status in ["waiting", "playing"] ->
        {:ok, Repo.get(Game, game.id)}

      # O seat already taken -> game full
      game.player_o_id != nil ->
        {:error, :game_full}

      # Explicit protection: player is X already
      game.player_x_id == player_id ->
        {:error, :already_joined}

      # Happy path: set O player, flip status to "playing"
      true ->
        game
        |> Game.changeset(%{
          player_o_id: player_id,
          player_o_name: player_name,
          status: "playing"
        })
        |> Repo.update()
    end
  end

  @doc """
  Rejoins a known player to an active game.
  Returns {:ok, game} or {:error, reason}.
  """
  def rejoin_player(game, player_id) do
    cond do
      # Player belongs to this game and the game is still active
      is_player_in_game?(game, player_id) and game.status in ["waiting", "playing"] ->
        {:ok, Repo.get(Game, game.id)}

      # If not active anymore -> finished
      game.status not in ["waiting", "playing"] ->
        {:error, :game_finished}

      # Not part of this game
      true ->
        {:error, :not_a_player}
    end
  end

  @doc """
  Makes a move on the game board.
  Returns {:ok, updated_game} or {:error, reason}.
  """
  def make_move(game, player_id, position) do
    cond do
      game.status != "playing" ->
        {:error, :game_not_active}

      not is_players_turn?(game, player_id) ->
        {:error, :not_your_turn}

      # Prevent overwriting a taken cell
      Enum.at(game.board, position) != "-" ->
        {:error, :position_taken}

      true ->
        execute_move(game, player_id, position)
    end
  end

  # Private helper functions

  defp execute_move(game, player_id, position) do
    player_symbol = get_player_symbol(game, player_id)
    current_board = game.board || List.duplicate("-", 9)
    new_board = List.replace_at(current_board, position, player_symbol)

    winning_line = check_winner(new_board)
    new_moves = game.moves_count + 1
    is_draw = is_nil(winning_line) && new_moves >= 9

    {status, winner} =
      cond do
        winning_line -> {"won", player_symbol}
        is_draw -> {"draw", nil}
        true -> {"playing", nil}
      end

    # Only switch turn if game continues
    next_player =
      if status == "playing" do
        if player_symbol == "X", do: "O", else: "X"
      else
        game.current_player
      end

    IO.inspect(new_board, label: "✅ Updated Board (to save)")

    game
    |> Game.changeset(%{
      board: new_board,
      current_player: next_player,
      status: status,
      winner: winner,
      moves_count: new_moves,
      winning_line: winning_line
    })
    |> Repo.update()
  end

  defp is_player_in_game?(game, player_id) do
    game.player_x_id == player_id or game.player_o_id == player_id
  end

  defp is_players_turn?(game, player_id) do
    (game.current_player == "X" && game.player_x_id == player_id) ||
      (game.current_player == "O" && game.player_o_id == player_id)
  end

  defp get_player_symbol(game, player_id) do
    if game.player_x_id == player_id, do: "X", else: "O"
  end

  defp check_winner(board) do
    winning_combinations = [
      # rows
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      # cols
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      # diagonals
      [0, 4, 8],
      [2, 4, 6]
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
