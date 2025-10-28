defmodule TicTacToe.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sub, :string, null: false
      add :name, :string, null: false
      add :given_name, :string
      add :family_name, :string
      add :picture, :string
      add :email, :string, null: false
      add :email_verified, :boolean, default: false

      timestamps()
    end

    create unique_index(:users, [:sub])
    create unique_index(:users, [:email])
  end
end
