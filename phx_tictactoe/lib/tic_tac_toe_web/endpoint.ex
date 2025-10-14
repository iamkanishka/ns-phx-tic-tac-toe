defmodule TicTacToeWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :tic_tac_toe

  socket "/socket", TicTacToeWeb.UserSocket,
    websocket: true,
    longpoll: false

  @session_options [
    store: :cookie,
    key: "_tic_tac_toe_key",
    signing_salt: "4hwPOqKU",
    same_site: "Lax"
  ]

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]

  plug Plug.Static,
    at: "/",
    from: :tic_tac_toe,
    gzip: false,
    only: TicTacToeWeb.static_paths()

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

  # ✅ ADD YOUR CUSTOM CORS PLUG *before* session and router plugs
  plug TicTacToeWeb.Plugs.CORS

  plug Plug.Session, @session_options
  plug TicTacToeWeb.Router
end
