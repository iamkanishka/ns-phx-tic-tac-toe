# lib/tic_tac_toe/accounts/accounts.ex
defmodule TicTacToe.Accounts.Users do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias TicTacToe.Repo
  alias TicTacToe.Accounts.User

  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user(id), do: Repo.get!(User, id)

  @doc """
  Gets a single user by email.

  Returns nil if user not found.

  ## Examples

      iex> get_user_by_email("test@example.com")
      %User{}

      iex> get_user_by_email("nonexistent@example.com")
      nil

  """
  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  @doc """
  Gets a single user by Google UID.

  Returns nil if user not found.

  ## Examples

      iex> get_user_by_google_uid("google_123")
      %User{}

      iex> get_user_by_google_uid("nonexistent")
      nil

  """
  def get_user_by_google_uid(google_uid) when is_binary(google_uid) do
    Repo.get_by(User, google_uid: google_uid)
  end

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a user.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end

  @doc """
  Gets or creates a user from Google OAuth data.

  ## Examples

      iex> get_or_create_user(%{
        email: "user@example.com",
        name: "John Doe",
        google_uid: "google_123",
        avatar_url: "https://avatar.url"
      })
      {:ok, %User{}}

  """
  def get_or_create_user(%{email: email, google_uid: google_uid} = user_params) do
    case get_user_by_google_uid(google_uid) do
      nil ->
        # User doesn't exist, create new one
        create_user_from_oauth(user_params)

      user ->
        # User exists, update if needed
        update_user_from_oauth(user, user_params)
    end
  end

  @doc """
  Creates a user from OAuth parameters.

  ## Examples

      iex> create_user_from_oauth(%{
        email: "user@example.com",
        name: "John Doe",
        google_uid: "google_123",
        avatar_url: "https://avatar.url"
      })
      {:ok, %User{}}

  """
  def create_user_from_oauth(attrs) do
    attrs = Map.merge(attrs, %{provider: "google"})

    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates an existing user with fresh OAuth data.

  ## Examples

      iex> update_user_from_oauth(user, %{
        name: "New Name",
        avatar_url: "https://new.avatar.url"
      })
      {:ok, %User{}}

  """
  def update_user_from_oauth(%User{} = user, attrs) do
    # Only update certain fields from OAuth
    update_attrs = Map.take(attrs, [:name, :avatar_url])

    user
    |> User.changeset(update_attrs)
    |> Repo.update()
  end

  @doc """
  Searches users by name or email.

  ## Examples

      iex> search_users("john")
      [%User{name: "John Doe", email: "john@example.com"}]

  """
  def search_users(query) when is_binary(query) do
    search_term = "%#{query}%"

    User
    |> where([u], ilike(u.name, ^search_term) or ilike(u.email, ^search_term))
    |> limit(10)
    |> Repo.all()
  end

  @doc """
  Gets user statistics.

  ## Examples

      iex> get_user_statistics(user_id)
      %{
        total_games: 10,
        wins: 5,
        losses: 3,
        draws: 2,
        win_rate: 50.0
      }

  """
  def get_user_statistics(user_id) do
    # This would require additional queries to calculate statistics
    # For now, returning basic structure
    %{
      total_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      win_rate: 0.0
    }
  end

  @doc """
  Gets user's game history with pagination.

  ## Examples

      iex> get_user_game_history(user_id, page: 1, page_size: 10)
      %{
        games: [%Game{}],
        total_pages: 5,
        total_games: 50,
        current_page: 1
      }

  """
  def get_user_game_history(user_id, opts \\ []) do
    page = opts[:page] || 1
    page_size = opts[:page_size] || 10
    offset = (page - 1) * page_size

    # This would be implemented with proper game queries
    %{
      games: [],
      total_pages: 0,
      total_games: 0,
      current_page: page
    }
  end
end
