defmodule TicTacToeWeb.UserSocket do
  use Phoenix.Socket

  # This defines which channel topics this socket can join.
  # Any topic that matches "game:*" (for example "game:123")
  # will be handled by the GameChannel module.
  channel "game:*", TicTacToeWeb.GameChannel

  # The connect/3 function determines whether a WebSocket connection
  # is allowed. The client must provide both a player_id and player_name
  # when connecting. If they do, we store those values in the socket
  # so we can use them later inside channels.
  def connect(%{"player_id" => player_id, "player_name" => player_name}, socket, _connect_info) do
    {:ok,
      socket
      |> assign(:player_id, player_id)
      |> assign(:player_name, player_name)
    }
  end

  # If the client does not send the required params,
  # we refuse the WebSocket connection.
  def connect(_params, _socket, _connect_info) do
    :error
  end

  # The id/1 function gives a unique identifier for this socket connection.
  # This is useful because Phoenix can broadcast messages to all sockets
  # belonging to a specific user (for example to force-disconnect them).
  #
  # Example returned id: "user_socket:player123"
  def id(socket), do: "user_socket:#{socket.assigns.player_id}"
end
