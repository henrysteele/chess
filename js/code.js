const board = document.querySelector("chess-board")
const game = new Chess()

function getPosition(str) {
  return str.replace(/[+-]/g, "").substr(-2)
}

function swapPlayer(fen) {
  const isWhite = fen.includes(" w ")
  return isWhite ? fen.replace(" w ", " b ") : fen.replace(" b ", " w ")
}

function isProtected(move) {
  pos = getPosition(move)
  const myPossibleMoves = game
    .moves()
    .filter((item) => item != move)
    .map((item) => getPosition(item))

  //TODO include protectedByPawn using game.board() analysis

  return myPossibleMoves.includes(pos)
}

function isVulnerable(move) {
  if (!move) return false
  game.move(move)
  const attacks = game.moves().map((item) => getPosition(item))
  game.undo()
  const pos = getPosition(move)
  return attacks.includes(pos)
}

function isVulnerablePosition(pos) {
  if (!pos) return false
  const tempGame = new Chess(swapPlayer(game.fen()))
  const attacks = tempGame
    .moves()
    .filter((move) => getPosition(move) == getPosition(pos))
  return attacks.length > 0
}

function allMyPositions() {
  const myColor = game.turn()
  const board = game.board()
  const rows = [8, 7, 6, 5, 4, 3, 2, 1]
  const cols = "abcdefgh".split("")

  // add square to board matrix
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < cols.length; col++) {
      if (!board[row][col]) continue
      board[row][col].square = cols[col] + rows[row]
    }
  }
  const flatBoard = board.flat().filter((item) => !!item)
  return flatBoard
    .filter((item) => item?.color == myColor)
    .map((item) => item?.square)
}

function isEmpty(move) {
  const pos = getPosition(move)
  return !chess.get(pos)
}
function isBlack(move) {
  const pos = getPosition(move)
  return chess.get(pos).includes("b")
}

function getTargetValue(move) {
  const values = "0PNBRQK"
  const pos = getPosition(move)
  const value = game.get(pos)?.type
  return value ? values.indexOf(value.toUpperCase()) : null
}

function allMyVulnerablePositions() {
  const list = allMyPositions().filter((pos) => isVulnerablePosition(pos))
  const royaltyFirst = list.sort(
    (x, y) => getTargetValue(y) - getTargetValue(x)
  )
  return royaltyFirst
}

function intersect(array1, array2) {
  return array1.filter((value) => array2.includes(value))
}

function safeMoves(moves) {
  return sortRoyalFirst([
    ...moves.filter((move) => !isVulnerable(move)),
    ...moves.filter((move) => isProtected(move)),
  ])
}

function meanMoves(moves) {
  return moves
    .map((move) => {
      return { move, value: getTargetValue(move) }
    })
    .filter((item) => item.value)
    .sort((x, y) => y.value - x.value)
    .map((item) => item.move)
}

function safeMeanMoves(moves) {
  return sortRoyalFirst(intersect(meanMoves(moves), safeMoves(moves)))
}

function bestDefensiveMove() {
  const moves = game.moves({ square: allMyVulnerablePositions()[0] })
  const mean = safeMeanMoves(moves)
  const safe = safeMoves(moves)
  if (mean.length) return mean[0]
  if (safe.length) return safe[0]
  return sortRoyalFirst(moves)[0]
}

function makeSmartMove() {
  let possibleMoves = game.moves()

  // game over
  if (possibleMoves.length === 0) {
    return
  }

  const myMove =
    bestDefensiveMove() ||
    safeMeanMoves(possibleMoves)[0] ||
    safeMoves(possibleMoves)[0] ||
    sortPawnsFirst(possibleMoves)[0]

  game.move(myMove)
  board.setPosition(game.fen())
}

////////////////////////

board.addEventListener("drag-start", (e) => {
  const { source, piece, position, orientation } = e.detail

  // do not pick up pieces if the game is over
  if (game.game_over()) {
    e.preventDefault()
    return
  }

  // only pick up pieces for White
  if (piece.search("b") > -1) {
    e.preventDefault()
    return
  }
})

document.addEventListener("keyup", function (event) {
  if (event.code == "Escape") {
    game.undo()
    board.setPosition(game.fen())
  }
})

board.addEventListener("drop", (e) => {
  const { source, target, setAction } = e.detail

  // see if the move is legal
  const move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) {
    setAction("snapback")
    return
  }

  // make random legal move for black
  window.setTimeout(makeSmartMove, 250)
})

function sortRoyalFirst(moves) {
  const list = moves.sort((x, y) => y.length - x.length)
  const rooks = list.filter((item) => item.toLowerCase().includes("r"))
  const filtered = list.filter((item) => !rooks.includes(item))
  return [...filtered, ...rooks]
}

function sortPawnsFirst(moves) {
  return moves.sort((x, y) => x.length - y.length)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
board.addEventListener("snap-end", (e) => {
  board.setPosition(game.fen())
})
