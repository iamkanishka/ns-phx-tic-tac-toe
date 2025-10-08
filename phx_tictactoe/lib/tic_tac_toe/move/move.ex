

# lib/tic_tac_toe/game/move.ex
defmodule TicTacToe.Game.Move do
  use Ecto.Schema
  import Ecto.Changeset

  schema "moves" do
    field :position, :integer
    field :symbol, :string

    belongs_to :game, TicTacToe.Game.Game
    belongs_to :user, TicTacToe.Accounts.User

    timestamps()
  end

  def changeset(move, attrs) do
    move
    |> cast(attrs, [:position, :symbol, :game_id, :user_id])
    |> validate_required([:position, :symbol, :game_id, :user_id])
    |> validate_inclusion(:position, 0..8)
    |> validate_inclusion(:symbol, ~w(X O))
  end
end
