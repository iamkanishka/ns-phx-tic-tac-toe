defmodule TicTacToeWeb.AuthController do
  use TicTacToeWeb, :controller

  alias TicTacToe.Accounts.Users

  @doc """
  Handles Google OAuth login (from frontend).

  Expects a POST request with JSON body like:
  {
    "sub": "105270191512611820698",
    "name": "Kanishka Naik",
    "given_name": "Kanishka",
    "family_name": "Naik",
    "picture": "https://lh3.googleusercontent.com/a/....",
    "email": "kanishkanaik97@gmail.com",
    "email_verified": true
  }
  """
  def google(conn, params) do
    with {:ok, user} <- ensure_user(params) do
      json(conn, %{
        message: "User authenticated successfully",
        user: %{
          id: user.id,
          sub: user.sub,
          name: user.name,
          given_name: user.given_name,
          family_name: user.family_name,
          picture: user.picture,
          email: user.email,
          email_verified: user.email_verified
        }
      })
    else
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          error: "Could not create or update user",
          details: Ecto.Changeset.traverse_errors(changeset, fn {msg, _} -> msg end)
        })

      _ ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid request"})
    end
  end

  defp ensure_user(%{"sub" => _} = params) do
    case Users.get_or_create_user(params) do
      {:ok, user} -> {:ok, user}
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp ensure_user(_), do: {:error, :invalid}
end
