defmodule TicTacToe.Games.GameServer do
  use GenServer
  alias TicTacToe.Games.GameContext

  @moduledoc """
  GenServer that manages the lifecycle and state of a single game.
  Delegates business logic to the Games context.
  """

  # Client API

  @doc """
  Starts a GameServer registered under the game_id via Registry.
  """
  def start_link(game_id) do
    GenServer.start_link(__MODULE__, game_id, name: via_tuple(game_id))
  end

  @doc """
  Returns the current game state.
  """
  def get_state(game_id) do
    GenServer.call(via_tuple(game_id), :get_state)
  end

  @doc """
  Makes a move on the game board.
  """
  def make_move(game_id, player_id, pos) do
    GenServer.call(via_tuple(game_id), {:make_move, player_id, pos})
  end

  @doc """
  Joins a player to the game.
  """
  def join_game(game_id, player_id, name) do
    GenServer.call(via_tuple(game_id), {:join_game, player_id, name})
  end

  @doc """
  Rejoins an existing player to the game.
  """
  def rejoin_game(game_id, player_id) do
    GenServer.call(via_tuple(game_id), {:rejoin_game, player_id})
  end

  # Server Callbacks

  @impl true
  def init(game_id) do
    case GameContext.get_game(game_id) do
      nil -> {:stop, :game_not_found}
      game -> {:ok, game}
    end
  end

  @impl true
  def handle_call(:get_state, _from, game) do
    {:reply, {:ok, game}, game}
  end

  @impl true
  def handle_call({:join_game, player_id, player_name}, _from, game) do
    case GameContext.join_player(game, player_id, player_name) do
      {:ok, updated_game} ->
        # Determine if this was a new join (game started) or a rejoin
        event =
          if game.status == "waiting" and updated_game.status == "playing" do
            {:game_started, updated_game}
          else
            {:player_rejoined, updated_game, player_id}
          end

        Phoenix.PubSub.broadcast(
          TicTacToe.PubSub,
          "game:#{game.id}",
          event
        )

        {:reply, {:ok, updated_game}, updated_game}

      {:error, reason} ->
        {:reply, {:error, reason}, game}
    end
  end

  @impl true
  def handle_call({:rejoin_game, player_id}, _from, game) do
    case GameContext.rejoin_player(game, player_id) do
      {:ok, refreshed_game} ->
        Phoenix.PubSub.broadcast(
          TicTacToe.PubSub,
          "game:#{game.id}",
          {:player_rejoined, refreshed_game, player_id}
        )

        {:reply, {:ok, refreshed_game}, refreshed_game}

      {:error, reason} ->
        {:reply, {:error, reason}, game}
    end
  end

  @impl true
  def handle_call({:make_move, player_id, position}, _from, game) do
    case GameContext.make_move(game, player_id, position) do
      {:ok, updated_game} ->
        Phoenix.PubSub.broadcast(
          TicTacToe.PubSub,
          "game:#{game.id}",
          {:move_made, updated_game, player_id, position}
        )

        {:reply, {:ok, updated_game}, updated_game}

      {:error, reason} ->
        {:reply, {:error, reason}, game}
    end
  end

  # Private Functions

  defp via_tuple(game_id) do
    {:via, Registry, {TicTacToe.GameRegistry, game_id}}
  end
end
