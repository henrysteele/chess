const board = document.querySelector("chess-board");
const game = new Chess();

board.addEventListener("drag-start", (e) => {
  const { source, piece, position, orientation } = e.detail;

  // do not pick up pieces if the game is over
  if (game.game_over()) {
    e.preventDefault();
    return;
  }

  // only pick up pieces for White
  if (piece.search("b") > -1) {
    e.preventDefault();
    return;
  }
});

document.addEventListener("keyup", function (event) {
  if (event.code == "Escape") {
    game.undo();
    board.setPosition(game.fen());
  }
});

board.addEventListener("drop", (e) => {
  const { source, target, setAction } = e.detail;

  // see if the move is legal
  const move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) {
    setAction("snapback");
    return;
  }

  // make random legal move for black
  window.setTimeout(makeSmartMove, 250);
});

function sortDesc(array) {
  return array.sort((x, y) => y.length - x.length);
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
board.addEventListener("snap-end", (e) => {
  board.setPosition(game.fen());
});

////////////////////////////////////////////////////////////////

function swapPlayer(fen) {
  const isWhite = fen.includes(" w ");
  return isWhite ? fen.replace(" w ", " b ") : fen.replace(" b ", " w ");
}

function isProtected(move) {
  pos = move.substr(-2);
  const myPossibleMoves = game
    .moves()
    .filter((item) => item != move)
    .map((item) => item.substr(-2));

  //TODO include protectedByPawn using game.board() analysis

  return myPossibleMoves.includes(pos);
}

function isVulnerable(move) {
  game.move(move);
  const attacks = game.moves().map((item) => item.substr(-2));
  game.undo();
  const pos = move.substr(-2);
  return attacks.includes(pos);
}

function isEmpty(move) {
  pos = move.substr(-2);
  return !chess.get(pos);
}
function isBlack(move) {
  pos = move.substr(-2);
  return chess.get(pos).includes("b");
}

function intersect(array1, array2) {
  return array1.filter((value) => array2.includes(value));
}

function makeSmartMove() {
  let possibleMoves = game.moves();

  // game over
  if (possibleMoves.length === 0) {
    return;
  }

  const safeMoves = sortDesc(
    intersect(
      possibleMoves.filter((move) => !isVulnerable(move)),
      possibleMoves.filter((move) => isProtected(move))
    )
  );

  const myMove = safeMoves[0] || sortDesc(possibleMoves)[0];

  game.move(myMove);
  board.setPosition(game.fen());
}
