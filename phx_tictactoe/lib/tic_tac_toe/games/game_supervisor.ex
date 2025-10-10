defmodule TicTacToe.GameSupervisor do
  use DynamicSupervisor

  def start_link(_) do
    DynamicSupervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def start_game(game_id) do
    spec = {TicTacToe.Games.GameServer, game_id}
    DynamicSupervisor.start_child(__MODULE__, spec)
  end
end
