defmodule PhxTictactoe.Repo do
  use Ecto.Repo,
    otp_app: :phx_tictactoe,
    adapter: Ecto.Adapters.Postgres
end
