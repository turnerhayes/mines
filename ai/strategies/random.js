;(function (global) {
  "use strict";

  function chooseMove(game) {
    const unrevealed = game.grid.getUnrevealedCells();

    const cell = unrevealed[
      Math.floor(Math.random() * unrevealed.length)
    ];

    return {
      position: cell.position,
      shouldFlag: !cell.isFlagged &&
        cell.countAdjacentUnrevealedCells() === cell.adjacentMines,
    };
  }

  if (!global.Mineswp) {
    global.Mineswp = {};
  }

  if (!global.Mineswp.strategies) {
    global.Mineswp.strategies = {};
  }

  global.Mineswp.strategies.random = {
    name: "Random",
    order: 2,
    chooseMove,
  };

})(window);
