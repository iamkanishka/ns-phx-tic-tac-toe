# lib/tic_tac_toe/game.ex
defmodule TicTacToe.Game.GameContext do
  import Ecto.Query, warn: false
  alias TicTacToe.Repo
  alias TicTacToe.Game.Game
  alias TicTacToe.Move.Move


  def create_game(attrs \\ %{}) do
    %Game{}
    |> Game.changeset(attrs)
    |> Repo.insert()
  end

  def join_game(game_id, user_id, symbol) when symbol in ~w(X O) do
    game = Repo.get!(Game, game_id)

    changeset = case symbol do
      "X" -> Game.changeset(game, %{player_x_id: user_id})
      "O" -> Game.changeset(game, %{player_o_id: user_id})
    end

    with {:ok, game} <- Repo.update(changeset) do
      # Start game if both players joined
      if game.player_x_id && game.player_o_id do
        update_game(game, %{status: "playing"})
      else
        {:ok, game}
      end
    end
  end

  def make_move(game_id, user_id, position) when position in 0..8 do
    game = Repo.get!(Game, game_id)

    # Determine which symbol the user is playing as
    symbol = cond do
      game.player_x_id == user_id -> "X"
      game.player_o_id == user_id -> "O"
      true -> nil
    end

    if symbol && game.status == "playing" && symbol == game.current_player do
      Repo.transaction(fn ->
        # Create move record
        move_changeset = Move.changeset(%Move{}, %{
          position: position,
          symbol: symbol,
          game_id: game_id,
          user_id: user_id
        })

        {:ok, _move} = Repo.insert(move_changeset)

        # Update game state
        updated_game = Game.make_move(game, position, symbol)

        case Repo.update(Game.changeset(updated_game, %{})) do
          {:ok, game} -> game
          {:error, _} -> Repo.rollback(:move_failed)
        end
      end)
    else
      {:error, :invalid_move}
    end
  end

  def get_game_with_moves(game_id) do
    Game
    |> where(id: ^game_id)
    |> preload([:player_x, :player_o, moves: :user])
    |> Repo.one()
  end

  def list_user_games(user_id) do
    Game
    |> where([g], g.player_x_id == ^user_id or g.player_o_id == ^user_id)
    |> order_by(desc: :updated_at)
    |> preload([:player_x, :player_o])
    |> Repo.all()
  end

  defp update_game(game, attrs) do
    game
    |> Game.changeset(attrs)
    |> Repo.update()
  end
end
