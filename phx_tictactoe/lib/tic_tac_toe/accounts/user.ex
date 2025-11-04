defmodule TicTacToe.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @derive {Phoenix.Param, key: :id}
  @foreign_key_type :binary_id

  schema "users" do
    # Matches Google userinfo response
    field :sub, :string
    field :name, :string
    field :given_name, :string
    field :family_name, :string
    field :picture, :string
    field :email, :string
    field :email_verified, :boolean, default: false

    # Associations
    has_many :games_as_x, TicTacToe.Games.Game, foreign_key: :player_x_id
    has_many :games_as_o, TicTacToe.Games.Game, foreign_key: :player_o_id

    timestamps()
  end

  @doc """
  Changeset for a user.
  Ensures uniqueness of Google `sub` and `email`.
  """
  def changeset(user, attrs) do
    user
    |> cast(attrs, [
      :sub,
      :name,
      :given_name,
      :family_name,
      :picture,
      :email,
      :email_verified
    ])
    |> validate_required([:sub, :name, :email])
    |> unique_constraint(:sub, name: :users_sub_index)
    |> unique_constraint(:email, name: :users_email_index)
  end
end
