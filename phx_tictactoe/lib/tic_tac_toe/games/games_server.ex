defmodule TicTacToe.Games.GameServer do
  use GenServer
  alias TicTacToe.{Repo, Games.Game}

  def start_link(game_id) do
    GenServer.start_link(__MODULE__, game_id, name: via_tuple(game_id))
  end

  defp via_tuple(game_id) do
    {:via, Registry, {TicTacToe.GameRegistry, game_id}}
  end

  def init(game_id) do
    game = Repo.get(Game, game_id)
    {:ok, game}
  end

  def get_state(game_id) do
    GenServer.call(via_tuple(game_id), :get_state)
  end

  def make_move(game_id, player_id, position) do
    GenServer.call(via_tuple(game_id), {:make_move, player_id, position})
  end

  def join_game(game_id, player_id, player_name) do
    GenServer.call(via_tuple(game_id), {:join_game, player_id, player_name})
  end

  def handle_call(:get_state, _from, game) do
    {:reply, {:ok, game}, game}
  end

  def handle_call({:join_game, player_id, player_name}, _from, game) do
    cond do
      game.player_o_id != nil ->
        {:reply, {:error, :game_full}, game}

      game.player_x_id == player_id ->
        {:reply, {:error, :already_joined}, game}

      true ->
        updated_game =
          game
          |> Game.changeset(%{
            player_o_id: player_id,
            player_o_name: player_name,
            status: "playing"
          })
          |> Repo.update!()

        Phoenix.PubSub.broadcast(
          TicTacToe.PubSub,
          "game:#{game.id}",
          {:game_started, updated_game}
        )

        {:reply, {:ok, updated_game}, updated_game}
    end
  end

  def handle_call({:make_move, player_id, position}, _from, game) do
    cond do
      game.status != "playing" ->
        {:reply, {:error, :game_not_active}, game}

      !is_players_turn?(game, player_id) ->
        {:reply, {:error, :not_your_turn}, game}

      Enum.at(game.board, position) != "" ->
        {:reply, {:error, :position_taken}, game}

      true ->
        player_symbol = get_player_symbol(game, player_id)
        new_board = List.replace_at(game.board, position, player_symbol)

        winning_line = check_winner(new_board)
        new_moves = game.moves_count + 1
        is_draw = is_nil(winning_line) && new_moves >= 9

        {status, winner} = cond do
          winning_line -> {"won", player_symbol}
          is_draw -> {"draw", nil}
          true -> {"playing", nil}
        end

        next_player = if status == "playing" do
          if player_symbol == "X", do: "O", else: "X"
        else
          game.current_player
        end

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

        Phoenix.PubSub.broadcast(
          TicTacToe.PubSub,
          "game:#{game.id}",
          {:move_made, updated_game, player_id, position}
        )

        {:reply, {:ok, updated_game}, updated_game}
    end
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
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ]

    Enum.find_value(winning_combinations, fn [a, b, c] = combo ->
      if Enum.at(board, a) != "" and
         Enum.at(board, a) == Enum.at(board, b) and
         Enum.at(board, b) == Enum.at(board, c) do
        combo
      end
    end)
  end
end
