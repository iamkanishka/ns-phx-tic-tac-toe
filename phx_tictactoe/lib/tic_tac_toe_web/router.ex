defmodule TicTacToeWeb.Router do
  use TicTacToeWeb, :router
 import Plug.Conn

  pipeline :api do
    plug :accepts, ["json"]
    plug  TicTacToeWeb.Plugs.CORS
 end

  scope "/api", TicTacToeWeb do
    pipe_through :api

    post "/games", GameController, :create
    get "/games/stats", GameController, :stats
    get "/games/waiting", GameController, :waiting_games
    get "/games/:id", GameController, :show
    get "/games", GameController, :index
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:tic_tac_toe, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: TicTacToeWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
