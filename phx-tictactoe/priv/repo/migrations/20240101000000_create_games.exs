# priv/repo/migrations/20240101000000_create_games.exs
defmodule Tictactoe.Repo.Migrations.CreateGames do
  use Ecto.Migration

  def change do
    create table(:games) do
      add :board, :map, default: %{}
      add :status, :string, default: "waiting"
      add :current_player, :string, default: "X"
      add :winner, :string
      add :winning_line, {:array, :integer}
      add :player_x, :string
      add :player_o, :string
      add :turn_count, :integer, default: 0
      add :completed_at, :utc_datetime

      timestamps()
    end

    create index(:games, [:status])
    create index(:games, [:completed_at])
  end
end
