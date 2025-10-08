# lib/tic_tac_toe/accounts/user.ex
defmodule TicTacToe.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :name, :string
    field :avatar_url, :string
    field :google_uid, :string
    field :provider, :string

    has_many :games_as_x, TicTacToe.Game.Game, foreign_key: :player_x_id
    has_many :games_as_o, TicTacToe.Game.Game, foreign_key: :player_o_id
    has_many :moves, TicTacToe.Game.Move

    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name, :avatar_url, :google_uid, :provider])
    |> validate_required([:email, :name, :google_uid])
    |> unique_constraint(:email)
    |> unique_constraint(:google_uid)
  end
end
