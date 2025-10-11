defmodule TicTacToeWeb.Plugs.CORS do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    conn
    |> put_resp_header("access-control-allow-origin", "*")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "Content-Type, Authorization, Accept")
    |> maybe_handle_options()
  end

  # Handle preflight OPTIONS request (used by browsers)
  defp maybe_handle_options(%Plug.Conn{method: "OPTIONS"} = conn) do
    conn
    |> send_resp(204, "")
    |> halt()
  end

  defp maybe_handle_options(conn), do: conn
end
