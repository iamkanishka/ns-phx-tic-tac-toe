defmodule TicTacToeWeb.UserSocket do
  use Phoenix.Socket

  channel "game:*", TicTacToeWeb.GameChannel

  def connect(%{"player_id" => player_id, "player_name" => player_name}, socket, _connect_info) do
    {:ok, assign(socket, :player_id, player_id) |> assign(:player_name, player_name)}
  end

  def connect(_params, _socket, _connect_info) do
    :error
  end

  def id(socket), do: "user_socket:#{socket.assigns.player_id}"
end
