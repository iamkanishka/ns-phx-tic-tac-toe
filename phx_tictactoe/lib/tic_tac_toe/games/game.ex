defmodule TicTacToe.Games.Game do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "games" do
    field :player_x_id, :string
    field :player_o_id, :string
    field :player_x_name, :string
    field :player_o_name, :string
    field :winner, :string
    field :board, {:array, :string}, default: List.duplicate("", 9)
    field :current_player, :string, default: "X"
    field :status, :string, default: "waiting"
    field :winning_line, {:array, :integer}
    field :moves_count, :integer, default: 0

    timestamps()
  end

  def changeset(game, attrs) do
    game
    |> cast(attrs, [:player_x_id, :player_o_id, :player_x_name, :player_o_name,
                    :winner, :board, :current_player, :status, :moves_count, :winning_line])
    |> validate_required([:player_x_id, :player_x_name])
  end
end
