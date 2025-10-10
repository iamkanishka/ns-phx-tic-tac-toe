defmodule TicTacToe.Repo.Migrations.CreateGames do
  use Ecto.Migration

  def change do
    create table(:games, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :player_x_id, :string, null: false
      add :player_o_id, :string
      add :player_x_name, :string, null: false
      add :player_o_name, :string
      add :winner, :string
      add :board, {:array, :string}, default: fragment("ARRAY[''::text, ''::text, ''::text, ''::text, ''::text, ''::text, ''::text, ''::text, ''::text]")
      add :current_player, :string, default: "X"
      add :status, :string, default: "waiting"
      add :winning_line, {:array, :integer}
      add :moves_count, :integer, default: 0

      timestamps()
    end

    create index(:games, [:status])
    create index(:games, [:player_x_id])
    create index(:games, [:player_o_id])
    create index(:games, [:updated_at])
  end
end
