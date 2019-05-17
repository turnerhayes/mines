;(function(global) {
  "use strict";

  const STRATEGIES = {
    random: {
      order: 1,
      name: "Random",
      chooseMove(game) {
        const unrevealed = game.grid.getUnrevealedCells();

        const cell = unrevealed[
          Math.floor(Math.random() * unrevealed.length)
        ];

        return {
          position: cell.position,
          shouldFlag: !cell.isFlagged &&
            cell.countAdjacentUnrevealedCells() === cell.adjacentMines,
        };
      },
    },

    flaggingFirst: {
      name: "Flagging First",
      order: 2,
      chooseMove(game) {
        // Find if there's a cell we can flag
        const unrevealed = game.grid.getUnrevealedCells()
          .sort(
            (a, b) => a.countAdjacentUnrevealedCells(true) -
              b.countAdjacentUnrevealedCells(true)
          );
        
        const cell = unrevealed[0];

        const adjacentWithHints = cell.getAdjacentRevealedCells(true);

        if (
          adjacentWithHints.every(
            function(adjacentCell) {
              return adjacentCell.adjacentMines === 1
            }
          ) &&
          adjacentWithHints.length === 3
        ) {
          return {
            position: cell.position,
            shouldFlag: true,
          };
        }

        return cell.position;

        // for (let i = 0; i < unrevealed.length; i++) {
        //   const cell = unrevealed[i];

        //   if (cell.isFlagged) {
        //     continue;
        //   }

        //   // "corner" 1s
          
        //   // is top left all 1s?
        //   if (cell.position.column > 0 && cell.position.row > 0) {
        //     // there is a top left

        //   }
        // }

        return {
          position: cell.position,
          shouldFlag: !cell.isFlagged &&
            cell.countAdjacentUnrevealedCells() === cell.adjacentMines,
        };
      },
    },

    scores: {
      name: "Scores",
      order: 0,
      chooseMove(game) {
        const cells = game.grid.getUnrevealedCells(true);

        const scores = [];

        const scoreToPosition = {};

        let minScore = -Infinity;

        let shouldFlag = false;
        let position;
        
        for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
          const cell = cells[cellIndex];

          if (!(cell.position.row in scores)) {
            scores[cell.position.row] = new Array(game.grid.width);
          }
  
          const adjacentCells = cell.getAdjacentRevealedCells(true);

          let isRevealedMissingAFlag = false;

          for (let aCIndex = 0; aCIndex < adjacentCells.length; aCIndex++) {
            const adjacentCell = adjacentCells[aCIndex];

            if (adjacentCell.adjacentMines < adjacentCell.countAdjacentFlaggedCells()) {
              isRevealedMissingAFlag = true;
            }

            if (adjacentCell.adjacentMines === adjacentCell.countAdjacentUnrevealedCells()) {
              shouldFlag = true;
            }
          }

          if (!isRevealedMissingAFlag) {
            return {
              position: cell.position,
              shouldFlag: false,
            };
          }

          if (shouldFlag) {
            return {
              position: cell.position,
              shouldFlag: true,
            };
          }
          
          const score = (
            adjacentCells.reduce(
              (score, adjacentCell) => {
                score += adjacentCell.adjacentMines;
  
                return score;
              },
              0
            )
          );

          scores[cell.position.row][cell.position.column] = score;

          if (score > minScore) {
            minScore = score;
          }

          if (!scoreToPosition[score]) {
            scoreToPosition[score] = [];
          }

          scoreToPosition[score].push(JSON.stringify(cell.position));
        }

        console.table(scores);
        console.table(scoreToPosition);
        
        if (!position) {
          position = cells[
            Math.floor(Math.random() * cells.length)
          ].position;
        }

        return {
          // position: scoreToPosition[minScore][0],
          position,
          shouldFlag,
        };
      },
    },

    csp: {
      name: "CSP",
      order: 3,
      chooseMove(game) {

      },
    },
  };

  /**
   * 
   * @param {Player} player 
   */
  function prepareControls(player) {
    const controls = document.getElementsByClassName("ai-controls")[0];

    const playButton = controls.getElementsByClassName("play-button")[0];

    const playButtonListener = function () {
      if (controls.classList.contains("playing")) {
        controls.classList.add("paused");
        controls.classList.remove("playing");

        player.autoMove = false;
      }
      else {
        controls.classList.remove("paused");
        controls.classList.add("playing");

        player.autoMove = true;
        player.makeMove();
      }
    };

    playButton.addEventListener(
      "click",
      playButtonListener
    );

    const stepButtonListener = function () {
      player.makeMove();
    };

    const stepButton = controls.getElementsByClassName("step-button")[0];

    stepButton.addEventListener(
      "click",
      stepButtonListener
    );

    return function cleanup() {
      playButton.removeEventListener("click", playButtonListener);
      stepButton.removeEventListener("click", stepButtonListener);
      controls.classList.add("paused");
      controls.classList.remove("playing");
    };
  }

  function loadGame(gridContainer, strategySelector) {
    const game = new Game({
      mineCount: 10,
      width: 10,
      height: 10,
      protectFirstClick: true,
    });

    game.once("win", function() {
      gridContainer.classList.add("won");
    });

    game.once("loss", function() {
      gridContainer.classList.add("lost");
    });

    game.render(gridContainer);

    let strategy = strategySelector.value;

    let player = new AutoPlayer({
      game,
      chooseMove: global.Mineswp.strategies[strategy].chooseMove,
    });

    /// DEBUG
    window.player = player;
    /// END DEBUG

    let cleanup = prepareControls(player);
    
    const handleStrategyChange = function() {
      if (game.isStarted) {
        return;
      }

      strategy = strategySelector.value;

      cleanup();
      
      player = new AutoPlayer({
        game,
        chooseMove: global.Mineswp.strategies[strategy].chooseMove,
      });
  
      /// DEBUG
      window.player = player;
      /// END DEBUG

      cleanup = prepareControls(player);
    };

    strategySelector.addEventListener(
      "change",
      handleStrategyChange
    );

    return function() {
      cleanup();
      strategySelector.removeEventListener(
        "change",
        handleStrategyChange
      );
    };
  }

  function onReady() {
    const gridContainer = document.getElementsByClassName("grid-container")[0];

    const strategySelector = document.getElementsByClassName("strategy-selector")[0];

    strategySelector.innerHTML = "";

    const strategyNames = Object.keys(global.Mineswp.strategies).sort(
      (a, b) => (global.Mineswp.strategies[a].order || 0) - (global.Mineswp.strategies[b].order || 0)
    );

    for (let index = 0; index < strategyNames.length; index++) {
      const strategyName = strategyNames[index];
      const strategy = global.Mineswp.strategies[strategyName];

      const option = document.createElement("option");
      option.value = strategyName;
      option.textContent = strategy.name;

      if (strategySelector.childNodes.length === 0) {
        option.selected = true;
      }

      strategySelector.appendChild(option);
    }

    let cleanup = loadGame(gridContainer, strategySelector);

    const reloadButton = document.getElementsByClassName("reload-button")[0];

    reloadButton.addEventListener(
      "click",
      function () {
        gridContainer.classList.remove("won", "lost");

        cleanup();

        cleanup = loadGame(gridContainer, strategySelector);
      }
    );
  }

  if (document.readyState === "complete") {
    onReady();
  }
  else {
    const listener = function () {
      onReady();

      document.removeEventListener("DOMContentLoaded", listener);
    };

    document.addEventListener("DOMContentLoaded", listener);
  }
})(window);
