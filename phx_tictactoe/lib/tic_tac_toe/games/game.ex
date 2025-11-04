defmodule TicTacToe.Games.Game do
  use Ecto.Schema
  import Ecto.Changeset
  alias TicTacToe.{Accounts.User, Repo}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "games" do
    belongs_to :player_x, User, foreign_key: :player_x_id, type: :binary_id
    belongs_to :player_o, User, foreign_key: :player_o_id, type: :binary_id

    field :player_x_name, :string
    field :player_o_name, :string
    field :winner, :string
    field :board, {:array, :string}, default: ["-", "-", "-", "-", "-", "-", "-", "-", "-"]
    field :current_player, :string, default: "X"
    field :status, :string, default: "waiting"
    field :winning_line, {:array, :integer}
    field :moves_count, :integer, default: 0

    timestamps()
  end

  @doc """
  Validates:
  - player_x_id and player_x_name are required.
  - player_x_id != player_o_id.
  - player_x_id and player_o_id (if provided) exist in users table.
  """
  def changeset(game, attrs) do
    game
    |> cast(attrs, [
      :player_x_id,
      :player_o_id,
      :player_x_name,
      :player_o_name,
      :winner,
      :board,
      :current_player,
      :status,
      :moves_count,
      :winning_line
    ])
    |> validate_required([:player_x_id, :player_x_name])
    |> validate_players_not_same()
    |> validate_players_exist()
  end

  # Check that both player_x_id and player_o_id are not the same user
  defp validate_players_not_same(changeset) do
    x_id = get_field(changeset, :player_x_id)
    o_id = get_field(changeset, :player_o_id)

    if x_id && o_id && x_id == o_id do
      add_error(changeset, :player_o_id, "cannot be the same as player_x_id")
    else
      changeset
    end
  end

  # Check that both users exist in the users table
  defp validate_players_exist(changeset) do
    x_id = get_field(changeset, :player_x_id)
    o_id = get_field(changeset, :player_o_id)

    changeset
    |> check_user_exists(:player_x_id, x_id)
    |> check_user_exists(:player_o_id, o_id)
  end

  defp check_user_exists(changeset, field, nil), do: changeset

  defp check_user_exists(changeset, field, user_id) do
    case Repo.get(User, user_id) do
      nil -> add_error(changeset, field, "does not exist in users")
      _ -> changeset
    end
  end
end
