;(function(global) {
  "use strict";

  const BOMB = "💣";

  class Position {
    constructor(position) {
      if (position instanceof Position) {
        return position;
      }

      this.column = position[0];
      this.row = position[1];
    }

    toString() {
      return `${this.column},${this.row}`;
    }

    toJSON() {
      return [this.column, this.row];
    }

    static fromString(positionString) {
      return new Position(
        positionString
          .split(",")
          .map(
            function (coord) {
              return Number(coord);
            }
          )
        );
    }
  }

  global.Position = Position;

  class Cell {
    constructor({
      grid,
      position,
      isMine = false,
      isFlagged = false,
      isRevealed = false,
    } = {}) {
      this.grid = grid,
      this.position = position;
      this.isMine = isMine;
      this.isFlagged = isFlagged;
      this.isRevealed = isRevealed;

      this._adjacentMines = null;

      this.grid.on(
        "mine-moved",
        () => {
          // Invalidate adjacentMines cache
          this._adjacentMines = null;
        }
      );
    }

    get adjacentMines() {
      if (this._adjacentMines === null) {
        this._adjacentMines = this._countAdjacentMines();
      }

      return this._adjacentMines;
    }

    _countAdjacentMines() {
      let count = 0;

      const startRow = Math.max(this.position.row - 1, 0);
      const endRow = Math.min(
        this.position.row + 1,
        this.grid.height - 1
      );
      const startColumn = Math.max(this.position.column - 1, 0);
      const endColumn = Math.min(
        this.position.column + 1,
        this.grid.width - 1
      );

      for (let row = startRow; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          if (
            !(
              row === this.position.row &&
              column === this.position.column
            ) &&
            this.grid.get([column, row]).isMine
          ) {
            count += 1;
          }
        }
      }

      return count;
    }

    _getAdjacentCellsStartAndEnd() {
      const startRow = Math.max(this.position.row - 1, 0);
      const endRow = Math.min(
        this.position.row + 1,
        this.grid.height - 1
      );
      const startColumn = Math.max(this.position.column - 1, 0);
      const endColumn = Math.min(
        this.position.column + 1,
        this.grid.width - 1
      );

      return {
        row: [startRow, endRow],
        column: [startColumn, endColumn],
      };
    }

    getAdjacentRevealedCells(skipEmpty = false) {
      const cells = [];

      const {
        row: [startRow, endRow],
        column: [startColumn, endColumn],
      } = this._getAdjacentCellsStartAndEnd();

      for (let row = startRow; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          if (
            row === this.position.row &&
            column === this.position.column
          ) {
            continue;
          }

          const adjacentCell = this.grid.get([column, row]);

          if (
            adjacentCell.isRevealed &&
            (
              !skipEmpty ||
              adjacentCell.adjacentMines > 0
            )
          ) {
            cells.push(adjacentCell);
          }
        }
      }

      return cells;
    }

    countAdjacentUnrevealedCells(skipFlagged) {
      let count = 0;

      const {
        row: [startRow, endRow],
        column: [startColumn, endColumn],
      } = this._getAdjacentCellsStartAndEnd();

      for (let row = startRow; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          if (
            row === this.position.row &&
            column === this.position.column
          ) {
            continue;
          }

          const adjacentCell = this.grid.get([column, row]);

          if (
            !adjacentCell.isRevealed &&
            (
              !skipFlagged || !adjacentCell.isFlagged
            )
          ) {
            count += 1;
          }
        }
      }

      return count;
    }

    countAdjacentFlaggedCells() {
      let count = 0;
  
      const {
        row: [startRow, endRow],
        column: [startColumn, endColumn],
      } = this._getAdjacentCellsStartAndEnd();
  
      for (let row = startRow; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          if (
            row === this.position.row &&
            column === this.position.column
          ) {
            continue;
          }
          const adjacentCell = this.grid.get([column, row]);
          
          if (
            adjacentCell.isFlagged
          ) {
            count += 1;
          }
        }
      }
  
      return count;
    }
  }

  global.Cell = Cell;

  class Grid {
    constructor(width, height) {
      this.width = width;
      this.height = height;

      this._matrix = [];

      this._emitter = new EventEmitter3();

      for (let rowNum = 0; rowNum < this.height; rowNum++) {
        const row = [];

        for (let column = 0; column < this.width; column++) {
          row.push(new Cell({
            grid: this,
            position: new Position([column, rowNum]),
          }));
        }

        this._matrix.push(row);
      }
    }

    on(eventName, handler, context) {
      this._emitter.on(eventName, handler, context);
    }

    once(eventName, handler, context) {
      this._emitter.once(eventName, handler, context);
    }

    off(eventName, handler) {
      this._emitter.off(eventName, handler);
    }

    /**
     * Gets the cell at the given position
     *
     * @param {Position|[number, number]} position the position of the cell to
     * get
     *
     * @return {Cell}
     */
    get(position) {
      position = new Position(position);
      return this._matrix[position.row][position.column];
    }

    addMineAt(position) {
      this.get(position).isMine = true;
    }

    moveMine(cell) {
      let newPosition = new Position([0, 0]);

      let newCell = this.get(newPosition);

      while (newCell.isMine) {
        let newColNum = newPosition.column + 1;
        let newRowNum = newPosition.row;

        if (newColNum >= this.width) {
          newRowNum += 1;
          newColNum = newColNum % this.width;
        }

        newPosition = new Position([newColNum, newRowNum]);
        newCell = this.get(newPosition);
      }
      
      this.addMineAt(newPosition);
      cell.isMine = false;

      this._emitter.emit("mine-moved", {
        grid: this,
        fromCell: cell,
        toCell: newCell,
      });

      return newCell;
    }

    getUnrevealedCells(skipFlagged = false) {
      return this._matrix.reduce(
        function (unrevealed, row) {
          row.forEach(
            function (cell) {
              if (
                !cell.isRevealed && (
                  !skipFlagged ||
                  !cell.isFlagged
                )
              ) {
                unrevealed.push(cell);
              }
            }
          );

          return unrevealed;
        },
        []
      );
    }

    each(iterator) {
      for (let row = 0; row < this.height; row++) {
        for (let column = 0; column < this.width; column++) {
          iterator(this.get([column, row]), new Position([column, row]));
        }
      }
    }
  }

  global.Grid = Grid;

  class Game {
    constructor({
      mineCount,
      width,
      height,
      protectFirstClick = false,
    }) {
      this.grid = Game._createGameGrid({
        mineCount,
        width,
        height,
      });

      this.protectFirstClick = protectFirstClick;

      this._won = false;
      this._lost = false;
      this._started = false;

      this._emitter = new EventEmitter3();
    }

    /**
     * @prop {boolean}
     */
    get won() {
      return this._won;
    }
    
    /**
     * @prop {boolean}
     */
    get lost() {
      return this._lost;
    }

    get isOver() {
      return this.won || this.lost;
    }

    get isStarted() {
      return this._started;
    }

    on(eventName, handler, context) {
      this._emitter.on(eventName, handler, context);
    }

    once(eventName, handler, context) {
      this._emitter.once(eventName, handler, context);
    }

    off(eventName, handler) {
      this._emitter.off(eventName, handler);
    }

    render(container) {
      const table = document.createElement("table");
      table.classList.add("grid");

      const tbody = document.createElement("tbody");
      table.appendChild(tbody);

      for (let rowNum = 0; rowNum < this.grid.height; rowNum++) {
        const rowEl = document.createElement("tr");

        for (let colNum = 0; colNum < this.grid.width; colNum++) {
          const cellEl = document.createElement("td");
          cellEl.dataset.position = new Position([colNum, rowNum]);
          
          /// DEBUG
          const cell = this.grid.get([colNum, rowNum]);
          if (cell.isMine) {
            cellEl.setAttribute("data-content", BOMB);
          }
          else if (cell.adjacentMines > 0) {
            cellEl.setAttribute("data-content", cell.adjacentMines);
          }
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


    /**
     * Gets a random cell position within the specified grid dimensions.
     *
     * @param {number} width the width of the grid
     * @param {number} height the height of the grid
     *
     * @return {Position}
     */
    static _getRandomCoordinates(width, height) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      return new Position([x, y]);
    }

    /**
     * 
     * @param {object} args
     * @param {number} args.mineCount the number of mines to place in the grid
     * @param {number} args.width the width of the grid
     * @param {number} args.height the height of the grid
     */
    static _createGameGrid({ mineCount, width, height }) {
      const grid = new Grid(width, height);

      let mineNumber = 0;

      while (mineNumber < mineCount) {
        const coords = Game._getRandomCoordinates(width, height);

        if (!grid.get(coords).isMine) {
          grid.addMineAt(coords);
          mineNumber += 1;
        }
      }

      return grid;
    }

    pressCell(position, isFlagging = false) {
      if (this.isOver) {
        return;
      }

      const cell = this.grid.get(position);

      if (cell.isRevealed) {
        return null;
      }

      if (isFlagging) {
        const cellElement = this._getCellElement(cell);
        cellElement.innerHTML = "";

        if (cell.isFlagged === true) {
          cell.isFlagged = false;
          cellElement.classList.remove("flagged");
        }
        else if (cell.isFlagged === false) {
          cell.isFlagged = true;
          cellElement.classList.add("flagged");
        }

        const didWin = this._markWinner();

        return didWin || null;
      }

      if (cell.isFlagged) {
        return null;
      }

      if (!this.isStarted) {
        if (this.protectFirstClick && cell.isMine) {
          this.grid.moveMine(cell);
        }

        this._started = true;
      }

      const isMine = this.revealCell(cell);
      const currentLastMove = this.table.getElementsByClassName("last-move")[0];

      if (currentLastMove) {
        currentLastMove.classList.remove("last-move");
      }
      this._getCellElement(cell).classList.add("last-move");

      if (isMine) {
        this.revealAllCells();

        this.grid.each(
          (cell) => {
            if (cell.isMine) {
              this._getCellElement(cell).classList.add(BOMB);
            }
          }
        );

        this._emitter.emit("loss", this);
        this._lost = true;
        this.table.classList.add("over");
        return false;
      }
      else if (cell.adjacentMines === 0) {
        this.revealAdjacentEmpties(cell);
      }

      const didWin = this._markWinner();

      return didWin || null;
    }

    revealCell(cell) {
      if (cell.isRevealed) {
        return;
      }

      if (cell.isFlagged) {
        if (this.isOver)
        return;
      }

      let isMine = cell.isMine;

      const cellElement = this._getCellElement(cell);

      if (isMine || cell.adjacentMines) {
        const span = document.createElement("span");
        span.classList.add("cell-content");
        span.textContent = isMine ?
          BOMB :
          cell.adjacentMines;

        if (isMine) {
          cellElement.classList.add(BOMB);
        }

        cellElement.innerHTML = "";
        cellElement.appendChild(span);
      }

      cellElement.classList.add("revealed");

      cell.isRevealed = true;

      return isMine;
    }

    revealAllCells() {
      for (let row = 0; row < this.grid.length; row++) {
        for (let col = 0; col < this.grid[row].length; col++) {
          this.revealCell(this.grid.get([col, row]));
        }
      }
    }

    revealAdjacentEmpties(cell) {
      const startRow = Math.max(cell.position.row - 1, 0);
      const endRow = Math.min(cell.position.row + 1, this.grid.height - 1);
      const startColumn = Math.max(cell.position.column - 1, 0);
      const endColumn = Math.min(
        cell.position.column + 1,
        this.grid.width - 1
      );

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startColumn; col <= endColumn; col++) {
          if (
            row === cell.position.row &&
            col === cell.position.column
          ) {
            continue;
          }

          const adjacentCell = this.grid.get([col, row]);

          if (adjacentCell.isRevealed || adjacentCell.isFlagged) {
            continue;
          }

          if (adjacentCell.isMine) {
            continue;
          }

          this.revealCell(adjacentCell);
          if (adjacentCell.adjacentMines === 0) {
            this.revealAdjacentEmpties(adjacentCell);
          }
        }
      }
    }

    _didWin() {
      for (let row = 0; row < this.grid.height; row++) {
        for (let col = 0; col < this.grid.width; col++) {
          const cell = this.grid.get([col, row]);

          if (cell.isRevealed) {
            continue;
          }

          if (!cell.isFlagged) {
            return false;
          }

          if (!cell.isMine) {
            return false;
          }
        }
      }

      return true;
    }

    _markWinner() {
      if (this._didWin()) {
        this.table.classList.add("over");

        this._emitter.emit("win", this);

        this._won = true;
        return true;
      }

      return false;
    }

    _getCellElement(cell) {
      return this.table.getElementsByTagName("tr")[cell.position.row]
        .getElementsByTagName("td")[cell.position.column];
    }

    _handleCellClick(event) {
      const cell = event.target.closest("td");

      if (!cell) {
        return;
      }

      const position = Position.fromString(cell.dataset.position);

      this.pressCell(position, event.ctrlKey);
    }
  }

  global.Game = Game;
}(self));
