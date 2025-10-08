# lib/tic_tac_toe_web/channels/game_channel.ex
defmodule TicTacToeWeb.GameChannel do
  use TicTacToeWeb, :channel
  alias TicTacToe.Game
  alias TicTacToe.Guardian

  def join("game:" <> game_id, _params, socket) do
    case Guardian.resource_from_token(socket.assigns.token) do
      {:ok, user} ->
        case Game.get_game_with_moves(game_id) do
          nil ->
            {:error, %{reason: "game not found"}}
          game ->
            if user_can_join_game?(game, user) do
              socket = socket
                |> assign(:game_id, game_id)
                |> assign(:user_id, user.id)

              {:ok, game_state(game), socket}
            else
              {:error, %{reason: "unauthorized"}}
            end
        end
      _ ->
        {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("join_game", %{"symbol" => symbol}, socket) when symbol in ~w(X O) do
    case Game.join_game(socket.assigns.game_id, socket.assigns.user_id, symbol) do
      {:ok, game} ->
        broadcast_game_state(game)
        {:reply, {:ok, game_state(game)}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{error: "failed to join game"}}, socket}
    end
  end

  def handle_in("make_move", %{"position" => position}, socket) do
    case Game.make_move(socket.assigns.game_id, socket.assigns.user_id, position) do
      {:ok, game} ->
        broadcast_game_state(game)
        {:reply, {:ok, game_state(game)}, socket}

      {:error, :invalid_move} ->
        {:reply, {:error, %{error: "invalid move"}}, socket}

      {:error, _} ->
        {:reply, {:error, %{error: "move failed"}}, socket}
    end
  end

  def handle_in("reset_game", _params, socket) do
    # Implement game reset logic
    {:reply, {:ok, %{}}, socket}
  end

  defp user_can_join_game?(game, user) do
    game.status == "waiting" ||
    game.player_x_id == user.id ||
    game.player_o_id == user.id
  end

  defp game_state(game) do
    %{
      id: game.id,
      board: game.board,
      current_player: game.current_player,
      status: game.status,
      winner: game.winner,
      winning_line: game.winning_line,
      player_x: user_info(game.player_x),
      player_o: user_info(game.player_o),
      moves: Enum.map(game.moves, &move_info/1)
    }
  end

  defp user_info(nil), do: nil
  defp user_info(user) do
    %{
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url
    }
  end

  defp move_info(move) do
    %{
      position: move.position,
      symbol: move.symbol,
      user_id: move.user_id,
      inserted_at: move.inserted_at
    }
  end

  defp broadcast_game_state(game) do
    TicTacToeWeb.Endpoint.broadcast!("game:#{game.id}", "game_updated", game_state(game))
  end
end
