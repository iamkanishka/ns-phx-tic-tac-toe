defmodule TicTacToeWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :tic_tac_toe

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  @session_options [
    store: :cookie,
    key: "_tic_tac_toe_key",
    signing_salt: "GLhEQGsx",
    same_site: "Lax"
  ]

  # ✅ Add your custom game WebSocket endpoint here
  socket "/game", TicTacToeWeb.GameChannel,
    websocket: true,
    longpoll: false

  # Phoenix LiveView socket
  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]

  # Serve static files
  plug Plug.Static,
    at: "/",
    from: :tic_tac_toe,
    gzip: false,
    only: TicTacToeWeb.static_paths()

  # Code reloading
  if code_reloading? do
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :tic_tac_toe
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug TicTacToeWeb.Router
end
