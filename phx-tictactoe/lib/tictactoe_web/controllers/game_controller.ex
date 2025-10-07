# lib/tic_tac_toe_web/controllers/game_controller.ex
defmodule TictactoeWeb.GameController do
  use TictactoeWeb, :controller
  alias Tictactoe.Game

  action_fallback TictactoeWeb.FallbackController

  # Only for retrieving completed games
  def index(conn, _params) do
    games = Game.list_completed_games()
    render(conn, :index, games: games)
  end

  def show(conn, %{"id" => id}) do
    case Game.get_completed_game(id) do
      nil ->
        {:error, :not_found}

      game ->
        render(conn, :show, game: game)
    end
  end

  # Stats endpoint
  def stats(conn, _params) do
    # This would query the database for completed games only
    stats = %{
      total_games: get_total_completed_games(),
      x_wins: get_wins_count("X"),
      o_wins: get_wins_count("O"),
      draws: get_wins_count("draw")
    }

    render(conn, :stats, stats: stats)
  end

  defp get_total_completed_games do
    # Implement database query
    0
  end

  defp get_wins_count(_player) do
    # Implement database query
    0
  end
end
