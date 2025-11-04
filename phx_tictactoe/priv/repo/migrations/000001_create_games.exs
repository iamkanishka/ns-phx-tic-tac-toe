defmodule TicTacToe.Repo.Migrations.CreateGames do
  use Ecto.Migration

  def change do
    create table(:games, primary_key: false) do
      add :id, :binary_id, primary_key: true

      # Foreign key references to users table
      add :player_x_id, references(:users, type: :binary_id, on_delete: :nothing), null: false
      add :player_o_id, references(:users, type: :binary_id, on_delete: :nothing)

      # Game metadata
      add :player_x_name, :string, null: false
      add :player_o_name, :string
      add :winner, :string

      # Board state (9 cells for TicTacToe)
      add :board, {:array, :string}, default: ["-", "-", "-", "-", "-", "-", "-", "-", "-"]

      # Game logic fields
      add :current_player, :string, default: "X"
      add :status, :string, default: "waiting"
      add :winning_line, {:array, :integer}
      add :moves_count, :integer, default: 0

      timestamps()
    end

    # Helpful indexes
    create index(:games, [:player_x_id])
    create index(:games, [:player_o_id])

    # Optional: add constraint to prevent same player as X and O
    # execute("""
    # ALTER TABLE games
    # ADD CONSTRAINT check_different_players
    # CHECK (player_x_id IS NULL OR player_o_id IS NULL OR player_x_id <> player_o_id)
    # """)
  end
end
