# lib/tic_tac_toe_web/channels/game_channel.ex
defmodule TictactoeWeb.GameChannel do
  use TictactoeWeb, :channel
  alias Tictactoe.Game

  @impl true
  def join("game:" <> game_id, _payload, socket) do
    # Initialize game if it doesn't exist
    state = Game.get_game_state(game_id) || Game.start_game_process(game_id)

    socket =
      socket
      |> assign(:game_id, game_id)
      |> assign(:player_id, socket.assigns.user_id)

    send(self(), :send_initial_state)
    {:ok, %{game: format_game_state(state)}, socket}
  end

  @impl true
  def handle_info(:send_initial_state, socket) do
    state = Game.get_game_state(socket.assigns.game_id)
    push(socket, "game_state", %{game: format_game_state(state)})
    {:noreply, socket}
  end

  @impl true
  def handle_in("join_game", %{"player" => player}, socket) do
    case Game.join_game(socket.assigns.game_id, socket.assigns.player_id, player) do
      {:ok, state} ->
        broadcast_game_state(socket, state)
        {:reply, {:ok, %{game: format_game_state(state)}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("make_move", %{"position" => position}, socket) do
    case Game.make_move(socket.assigns.game_id, socket.assigns.player_id, position) do
      {:ok, state} ->
        broadcast_game_state(socket, state)
        {:reply, {:ok, %{game: format_game_state(state)}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("reset_game", _payload, socket) do
    game_id = socket.assigns.game_id
    state = Game.get_game_state(game_id)

    # Create new game state but keep players
    new_state = %Game.State{
      id: game_id,
      board: Game.Game.initial_board(),
      status: "playing",
      current_player: "X",
      winner: nil,
      winning_line: nil,
      player_x: state.player_x,
      player_o: state.player_o,
      turn_count: 0,
      players: state.players
    }

    Game.update_game_state(game_id, new_state)
    broadcast_game_state(socket, new_state)

    {:reply, {:ok, %{game: format_game_state(new_state)}}, socket}
  end

  defp broadcast_game_state(socket, state) do
    broadcast!(socket, "game_state", %{game: format_game_state(state)})
  end

  defp format_game_state(state) do
    %{
      id: state.id,
      board: state.board,
      status: state.status,
      current_player: state.current_player,
      winner: state.winner,
      winning_line: state.winning_line,
      player_x: state.player_x,
      player_o: state.player_o,
      turn_count: state.turn_count,
      players: state.players
    }
  end
end
