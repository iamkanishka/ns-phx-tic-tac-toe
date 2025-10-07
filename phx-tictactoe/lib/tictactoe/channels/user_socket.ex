# lib/tic_tac_toe_web/channels/user_socket.ex
defmodule Tictactoe.Channels.UserSocket do
  use Phoenix.Socket

  # Channels - only game channel for real-time gameplay
  channel "game:*", TictactoeWeb.GameChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case authenticate(token) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"

  defp authenticate(token) do
    # Simple token validation - in production, use proper auth
    if String.length(token) > 0 do
      {:ok, "user_#{token}"}
    else
      {:error, :invalid_token}
    end
  end
end
