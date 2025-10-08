# lib/tic_tac_toe_web/controllers/auth_controller.ex
defmodule TicTacToeWeb.AuthController do
  use TicTacToeWeb, :controller
  alias TicTacToe.Accounts
  alias TicTacToe.Guardian

  def google_auth(conn, %{"code" => code}) do
    # You'll need to implement OAuth2 flow here
    # For simplicity, I'll show the structure
    case get_google_user_info(code) do
      {:ok, user_info} ->
        case Accounts.get_or_create_user(user_info) do
          {:ok, user} ->
            {:ok, token, _claims} = Guardian.encode_and_sign(user)

            conn
            |> put_status(:ok)
            |> render("auth.json", %{user: user, token: token})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> render("error.json", %{error: changeset})
        end

      {:error, reason} ->
        conn
        |> put_status(:unauthorized)
        |> render("error.json", %{error: reason})
    end
  end

  defp get_google_user_info(_code) do
    # Implement Google OAuth2 flow
    # This would make requests to Google's token and userinfo endpoints
    {:ok, %{email: "test@example.com", name: "Test User", google_uid: "123", avatar_url: ""}}
  end
end
