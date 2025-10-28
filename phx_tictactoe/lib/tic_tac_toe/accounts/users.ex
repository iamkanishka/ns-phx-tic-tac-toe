defmodule TicTacToe.Accounts.Users do
  @moduledoc """
  The Accounts context for managing Google-authenticated users.
  """

  import Ecto.Query, warn: false
  alias TicTacToe.Repo
  alias TicTacToe.Accounts.User

  # ---------------------------------------------------------------------------
  # Basic Queries
  # ---------------------------------------------------------------------------

  @doc "List all users."
  def list_users, do: Repo.all(User)

  @doc "Get a user by ID, raising if not found."
  def get_user!(id), do: Repo.get!(User, id)

  @doc "Get a user by email (returns nil if not found)."
  def get_user_by_email(email) when is_binary(email), do: Repo.get_by(User, email: email)

  @doc "Get a user by Google `sub` (UID)."
  def get_user_by_sub(sub) when is_binary(sub), do: Repo.get_by(User, sub: sub)

  # ---------------------------------------------------------------------------
  # Google OAuth Handling
  # ---------------------------------------------------------------------------

  @doc """
  Finds or creates a user from Google user info map.

  Accepts a map like:

      %{
        "sub" => "105270191512611820698",
        "name" => "Kanishka Naik",
        "given_name" => "Kanishka",
        "family_name" => "Naik",
        "picture" => "https://lh3.googleusercontent.com/a/....",
        "email" => "kanishkanaik97@gmail.com",
        "email_verified" => true
      }
  """
  def get_or_create_user(%{"sub" => sub} = google_info) do
    case get_user_by_sub(sub) do
      nil -> create_user_from_google(google_info)
      user -> update_user_from_google(user, google_info)
    end
  end

  @doc "Creates a new user using Google OAuth data."
  def create_user_from_google(attrs) do
    mapped_attrs = %{
      sub: attrs["sub"],
      name: attrs["name"],
      given_name: attrs["given_name"],
      family_name: attrs["family_name"],
      picture: attrs["picture"],
      email: attrs["email"],
      email_verified: attrs["email_verified"]
    }

    %User{}
    |> User.changeset(mapped_attrs)
    |> Repo.insert()
  end

  @doc "Updates an existing user with latest Google data."
  def update_user_from_google(%User{} = user, attrs) do
    update_attrs = %{
      name: attrs["name"],
      given_name: attrs["given_name"],
      family_name: attrs["family_name"],
      picture: attrs["picture"],
      email_verified: attrs["email_verified"]
    }

    user
    |> User.changeset(update_attrs)
    |> Repo.update()
  end

  # ---------------------------------------------------------------------------
  # Maintenance Helpers
  # ---------------------------------------------------------------------------

  @doc "Deletes a user."
  def delete_user(%User{} = user), do: Repo.delete(user)

  @doc "Returns a changeset for a user."
  def change_user(%User{} = user, attrs \\ %{}), do: User.changeset(user, attrs)
end
