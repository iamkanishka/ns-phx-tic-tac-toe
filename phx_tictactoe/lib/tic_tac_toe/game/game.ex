# lib/tic_tac_toe/game/game.ex
defmodule TicTacToe.Game.Game do
  use Ecto.Schema
  import Ecto.Changeset

  @win_patterns [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], # rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], # columns
    [0, 4, 8], [2, 4, 6]             # diagonals
  ]

  schema "games" do
    field :board, {:array, :string}
    field :current_player, :string
    field :status, :string
    field :winner, :string
    field :winning_line, {:array, :integer}
    field :completed_at, :utc_datetime

    belongs_to :player_x, TicTacToe.Accounts.User
    belongs_to :player_o, TicTacToe.Accounts.User
    has_many :moves, TicTacToe.Game.Move

    timestamps()
  end

  def changeset(game, attrs) do
    game
    |> cast(attrs, [:board, :current_player, :status, :winner, :winning_line, :player_x_id, :player_o_id, :completed_at])
    |> validate_inclusion(:status, ~w(waiting playing completed))
    |> validate_inclusion(:current_player, ~w(X O))
    |> validate_board()
  end

  defp validate_board(changeset) do
    validate_change(changeset, :board, fn :board, board ->
      if is_list(board) && length(board) == 9 && Enum.all?(board, &(&1 in ["", "X", "O"])) do
        []
      else
        [board: "must be a list of 9 elements containing only '', 'X', or 'O'"]
      end
    end)
  end

  def check_win(board) do
    @win_patterns
    |> Enum.find(fn [a, b, c] ->
      board[a] != "" && board[a] == board[b] && board[a] == board[c]
    end)
  end

  def check_draw(board) do
    Enum.all?(board, &(&1 != ""))
  end

  def make_move(game, position, symbol) when position in 0..8 do
    if game.board[position] == "" && symbol == game.current_player do
      new_board = List.replace_at(game.board, position, symbol)

      case {check_win(new_board), check_draw(new_board)} do
        {winning_line, _} when not is_nil(winning_line) ->
          %{game |
            board: new_board,
            status: "completed",
            winner: symbol,
            winning_line: winning_line,
            completed_at: DateTime.utc_now()
          }
        {nil, true} ->
          %{game |
            board: new_board,
            status: "completed",
            completed_at: DateTime.utc_now()
          }
        _ ->
          %{game |
            board: new_board,
            current_player: if(symbol == "X", do: "O", else: "X")
          }
      end
    else
      game
    end
  end
end
