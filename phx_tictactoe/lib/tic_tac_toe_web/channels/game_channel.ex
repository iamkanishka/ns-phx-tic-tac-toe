defmodule TicTacToeWeb.GameChannel do
  use Phoenix.Channel
  alias TicTacToe.{Repo, Games.Game, Games.GameServer, GameSupervisor}

  def join("game:" <> game_id, _params, socket) do
    case Repo.get(Game, game_id) do
      nil ->
        {:error, %{reason: "game_not_found"}}

      _game ->
        send(self(), :after_join)
        {:ok, assign(socket, :game_id, game_id)}
    end
  end

  def handle_info(:after_join, socket) do
    game_id = socket.assigns.game_id

    case Registry.lookup(TicTacToe.GameRegistry, game_id) do
      [] -> GameSupervisor.start_game(game_id)
      _ -> :ok
    end

    Phoenix.PubSub.subscribe(TicTacToe.PubSub, "game:#{game_id}")

    {:ok, game} = GameServer.get_state(game_id)
    push(socket, "game_state", format_game_state(game))

    {:noreply, socket}
  end

  def handle_in("join_game", _payload, socket) do
    game_id = socket.assigns.game_id
    player_id = socket.assigns.player_id
    player_name = socket.assigns.player_name

    case GameServer.join_game(game_id, player_id, player_name) do
      {:ok, game} ->
        {:reply, {:ok, format_game_state(game)}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: Atom.to_string(reason)}}, socket}
    end
  end

  def handle_in("rejoin_game", _payload, socket) do
    game_id = socket.assigns.game_id
    player_id = socket.assigns.player_id

    case GameServer.rejoin_game(game_id, player_id) do
      {:ok, game} ->
        {:reply, {:ok, format_game_state(game)}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: Atom.to_string(reason)}}, socket}
    end
  end

  def handle_in("make_move", %{"index" => index}, socket) do
    game_id = socket.assigns.game_id
    player_id = socket.assigns.player_id

    case GameServer.make_move(game_id, player_id, index) do
      {:ok, game} ->
        {:reply, {:ok, format_game_state(game)}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: Atom.to_string(reason)}}, socket}
    end
  end

  def handle_info({:game_started, game}, socket) do
    push(socket, "game_started", format_game_state(game))
    {:noreply, socket}
  end

  def handle_info({:player_rejoined, game, player_id}, socket) do
    push(socket, "player_rejoined", Map.merge(format_game_state(game), %{
      rejoined_player_id: player_id
    }))
    {:noreply, socket}
  end

  def handle_info({:move_made, game, player_id, position}, socket) do
    push(socket, "move_made", Map.merge(format_game_state(game), %{
      last_move: %{
        player_id: player_id,
        position: position
      }
    }))
    {:noreply, socket}
  end

  defp format_game_state(game) do
    %{
      id: game.id,
      cells: game.board,
      state: game.status,
      current_player: game.current_player,
      winner: game.winner,
      winning_line: game.winning_line,
      player_x: %{
        id: game.player_x_id,
        name: game.player_x_name
      },
      player_o: if game.player_o_id do
        %{
          id: game.player_o_id,
          name: game.player_o_name
        }
      else
        nil
      end,
      moves_count: game.moves_count
    }
  end
end
