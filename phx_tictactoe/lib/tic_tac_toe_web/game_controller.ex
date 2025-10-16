
# ============================================
# REST API CONTROLLER
# ============================================
# lib/tic_tac_toe_web/controllers/game_controller.ex
defmodule TicTacToeWeb.GameController do
  use Phoenix.Controller
  alias TicTacToe.{Repo, Games.Game, GameSupervisor}
  import Ecto.Query

  def create(conn, %{"player_id" => player_id, "player_name" => player_name}) do
    game = %Game{
      player_x_id: player_id,
      player_x_name: player_name,
       board: List.duplicate("-", 9),
      status: "waiting"
    }
    |> Repo.insert!()

    GameSupervisor.start_game(game.id)

    json(conn, %{
      id: game.id,
      status: game.status,
      player_x_name: game.player_x_name
    })
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Game, id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Game not found"})

      game ->
        json(conn, format_game_response(game))
    end
  end

  def index(conn, _params) do
    games =
      Game
      |> where([g], g.status in ["won", "draw"])
      |> order_by([g], desc: g.updated_at)
      |> limit(50)
      |> Repo.all()

    json(conn, Enum.map(games, &format_game_response/1))
  end

  def waiting_games(conn, _params) do
    games =
      Game
      |> where([g], g.status == "waiting")
      |> order_by([g], desc: g.inserted_at)
      |> limit(20)
      |> Repo.all()

    json(conn, Enum.map(games, fn game ->
      %{
        id: game.id,
        player_x_name: game.player_x_name,
        status: game.status,
        created_at: game.inserted_at
      }
    end))
  end

  def stats(conn, _params) do
    total_games = Repo.aggregate(Game, :count, :id)

    completed_games =
      Game
      |> where([g], g.status in ["won", "draw"])
      |> Repo.aggregate(:count, :id)

    x_wins =
      Game
      |> where([g], g.winner == "X")
      |> Repo.aggregate(:count, :id)

    o_wins =
      Game
      |> where([g], g.winner == "O")
      |> Repo.aggregate(:count, :id)

    draws =
      Game
      |> where([g], g.status == "draw")
      |> Repo.aggregate(:count, :id)

    avg_moves =
      Game
      |> where([g], g.status in ["won", "draw"])
      |> select([g], avg(g.moves_count))
      |> Repo.one()
      |> case do
        nil -> 0
        value -> Float.round(value, 2)
      end

    json(conn, %{
      total_games: total_games,
      completed_games: completed_games,
      x_wins: x_wins,
      o_wins: o_wins,
      draws: draws,
      average_moves: avg_moves
    })
  end

  defp format_game_response(game) do
    board_map = game.board
    |> Enum.with_index()
    |> Enum.map(fn {value, index} ->
      {Integer.to_string(index), if(value == "", do: nil, else: value)}
    end)
    |> Enum.into(%{})

    %{
      id: game.id,
      board: board_map,
      status: game.status,
      winner: game.winner,
      winning_line: game.winning_line,
      player_x: game.player_x_name,
      player_o: game.player_o_name,
      turn_count: game.moves_count,
      completed_at: game.updated_at,
      inserted_at: game.inserted_at,
      updated_at: game.updated_at
    }
  end
end
