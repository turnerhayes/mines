;(function() {
  "use strict";

  const BOMB = "💣";

  class Game {
    constructor({
      mineCount,
      width,
      height,
      onWin,
      onLoss,
    }) {
      this.grid = Game._createGameGrid({
        mineCount,
        width,
        height,
      });

      if (typeof onWin === "function") {
        this.onWin = onWin;
      }

      if (typeof onLoss === "function") {
        this.onLoss = onLoss;
      }
    }

    render(container) {
      const table = document.createElement("table");
      table.classList.add("grid");

      const tbody = document.createElement("tbody");
      table.appendChild(tbody);

      for (let rowNum = 0; rowNum < this.grid.length; rowNum++) {
        const rowEl = document.createElement("tr");

        for (let colNum = 0; colNum < this.grid[rowNum].length; colNum++) {
          const cellEl = document.createElement("td");
          cellEl.dataset.position = colNum + "," + rowNum;

          /// DEBUG
          // if (gridState[colNum][rowNum].content) {
          //   cellEl.setAttribute("data-content", gridState[colNum][rowNum].content);
          // }
          /// END DEBUG
          rowEl.appendChild(cellEl);
        }

        tbody.appendChild(rowEl);
      }

      container.innerHTML = "";
      container.appendChild(table);

      table.addEventListener(
        "click",
        this._handleCellClick.bind(this),
        false
      );

      this.table = table;
    }


    static _getRandomCoordinates(width, height) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      return [x, y];
    }

    static _countAdjacentMines(gridState, pos) {
      let count = 0;
      const height = gridState.length;
      const width = gridState[0].length;

      const startRow = Math.max(pos[1] - 1, 0);
      const endRow = Math.min(pos[1] + 1, height - 1);
      const startColumn = Math.max(pos[0] - 1, 0);
      const endColumn = Math.min(pos[0] + 1, width - 1);

      for (let row = startRow; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          if (
            !(
              row === pos[1] &&
              column === pos[0]
            ) &&
            gridState[row][column].content === BOMB
          ) {
            count += 1;
          }
        }
      }

      return count;
    }

    static _createGameGrid({ mineCount, width, height }) {
      const gridState = [];

      for (let i = 0; i < height; i++) {
        const row = [];

        for (let j = 0; j < width; j++) {
          row.push({
            content: undefined,
            isRevealed: false,
            isFlagged: false,
          });
        }

        gridState.push(row);
      }

      let mineNumber = 0;

      while (mineNumber < mineCount) {
        const coords = Game._getRandomCoordinates(width, height);

        if (!gridState[coords[1]][coords[0]].content) {
          gridState[coords[1]][coords[0]].content = BOMB;
          mineNumber += 1;
        }
      }

      for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
          if (gridState[row][column].content === BOMB) {
            continue;
          }

          const adjacent = Game._countAdjacentMines(gridState, [column, row]);

          if (adjacent > 0) {
            gridState[row][column].content = adjacent;
          }
        }
      }

      return gridState;
    }

    pressCell(position, isFlagging = false) {
      const cell = this.grid[position[0]][position[1]];
      
      if (cell.isRevealed) {
        return;
      }

      if (isFlagging) {
        const cellElement = this._getCellElement(position);
        cellElement.innerHTML = "";

        if (cell.isFlagged === true) {
          cell.isFlagged = false;
          cellElement.classList.remove("flagged");
        }
        else if (cell.isFlagged === false) {
          cell.isFlagged = true;
          cellElement.classList.add("flagged");
        }

        this._markWinner();

        return;
      }

      if (cell.isFlagged) {
        return;
      }

      const cellContent = this.revealCell(position);

      if (cellContent === BOMB) {
        this.revealAllCells();
        this._getCellElement(position).classList.add("last-move");

        if (this.onLoss) {
          this.onLoss();
        }
        return;
      }

      if (!cellContent) {
        this.revealAdjacentEmpties(position);
      }

      this._markWinner();
    }
    
    revealCell(position) {
      const cell = this.grid[position[0]][position[1]];

      if (cell.isRevealed) {
        return;
      }

      const cellContent = cell.content;

      const cellElement = this._getCellElement(position);

      if (cellContent) {
        if (cellContent === BOMB) {
          cellElement.classList.add(BOMB);
        }

        cellElement.innerHTML = cellContent;
      }

      cellElement.classList.add("revealed");

      this.grid[position[0]][position[1]].isRevealed = true;

      return cellContent;
    }

    revealAllCells() {
      for (let row = 0; row < this.grid.length; row++) {
        for (let col = 0; col < this.grid[row].length; col++) {
          this.revealCell([col, row]);
        }
      }
    }

    revealAdjacentEmpties(position) {
      const height = this.grid.length;
      const width = this.grid[0].length;

      const startRow = Math.max(position[1] - 1, 0);
      const endRow = Math.min(position[1] + 1, height - 1);
      const startColumn = Math.max(position[0] - 1, 0);
      const endColumn = Math.min(position[0] + 1, width - 1);

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startColumn; col <= endColumn; col++) {
          if (
            row === position[1] &&
            col === position[0]
          ) {
            continue;
          }

          const cell = this.grid[col][row];

          if (cell.isRevealed || cell.isFlagged) {
            continue;
          }

          const cellContent = cell.content;

          if (cellContent !== BOMB) {
            this.revealCell([col, row]);

            if (!cellContent) {
              this.revealAdjacentEmpties([col, row]);
            }
          }
        }
      }
    }

    _didWin() {
      for (let row = 0; row < this.grid.length; row++) {
        for (let col = 0; col < this.grid.length; col++) {
          const cell = this.grid[row][col];

          if (cell.isRevealed) {
            continue;
          }

          if (!cell.isFlagged) {
            return false;
          }

          if (cell.content !== BOMB) {
            return false;
          }
        }
      }

      return true;
    }

    _markWinner() {
      if (this._didWin()) {
        if (typeof this.onWin === "function") {
          this.onWin();
        }
      }
    }

    _getCellElement(position) {
      return this.table.getElementsByTagName("tr")[position[1]]
        .getElementsByTagName("td")[position[0]];
    }

    _handleCellClick(event) {
      const cell = event.target.closest("td");

      if (!cell) {
        return;
      }

      const position = cell.dataset.position
        .split(",")
        .map(
          function (coord) {
            return Number(coord);
          }
        );

      this.pressCell(position, event.ctrlKey);
    }
  }

  function getGameParameters(controlsContainer) {
    const width = controlsContainer
      .querySelector('[name="width"]').valueAsNumber;
    const height = controlsContainer
      .querySelector('[name="height"]').valueAsNumber;
    const mineCount = controlsContainer
      .querySelector('[name="num_mines"]').valueAsNumber;
    
    return {
      width,
      height,
      mineCount,
    };
  }

  function onReady() {
    const gridContainer = document.getElementsByClassName("grid-container")[0];

    const controlsContainer = document.getElementsByClassName("controls")[0];

    const onWin = function() {
      gridContainer.classList.add("won");
    };

    const onLoss = function() {
      gridContainer.classList.add("lost");
    };

    const game = new Game({
      ...getGameParameters(controlsContainer),
      onWin,
      onLoss,
    });
    
    
    game.render(gridContainer);
    
    const reloadButton = document.getElementsByClassName("reload-button")[0];
    
    reloadButton.addEventListener(
      "click",
      function() {
        gridContainer.classList.remove("won", "lost");

        const game = new Game({
          ...getGameParameters(controlsContainer),
          onWin,
          onLoss,
        });

        game.render(gridContainer);
      }
    );
  }

  if (document.readyState === "complete") {
    onReady();
  }
  else {
    const listener = function() {
      onReady();

      document.removeEventListener("DOMContentLoaded", listener);
    };

    document.addEventListener("DOMContentLoaded", listener);
  }
}());
