# lib/tic_tac_toe/game/game.ex

defmodule Tictactoe.Game.Game do
  use Ecto.Schema
  import Ecto.Changeset

  @valid_statuses ["waiting", "playing", "finished", "cancelled"]
  @valid_players ["X", "O"]
  @board_size 9

  schema "games" do
    field :board, :map, default: %{}
    field :status, :string, default: "waiting"
    field :current_player, :string, default: "X"
    field :winner, :string
    field :winning_line, {:array, :integer}
    field :player_x, :string
    field :player_o, :string
    field :turn_count, :integer, default: 0
    field :completed_at, :utc_datetime

    timestamps()
  end

  def changeset(game, attrs) do
    game
    |> cast(attrs, [
      :board,
      :status,
      :current_player,
      :winner,
      :winning_line,
      :player_x,
      :player_o,
      :turn_count,
      :completed_at
    ])
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_inclusion(:current_player, @valid_players)
    |> validate_inclusion(:winner, @valid_players ++ [nil, "draw"])
  end

  def initial_board do
    for i <- 0..8, into: %{}, do: {to_string(i), nil}
  end
end
