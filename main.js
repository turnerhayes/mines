;(function() {
  "use strict";

  let grid;

  let gridContainer;

  const BOMB = "💣";

  function didWin(gridState) {
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState.length; col++) {
        const cell = gridState[row][col];

        if (cell.isRevealed) {
          continue;
        }
        
        if (cell.isFlagged && cell.content !== BOMB) {
          return false;
        }

        if (!cell.isFlagged && cell.content === BOMB) {
          return false;
        }
      }
    }

    return true;
  }

  function markWinner(gridState) {
    if (didWin(gridState)) {
      gridContainer.classList.add("won");
    }
  }

  function getRandomCoordinates(width, height) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);

    return [x, y];
  }

  function getCellElement(position) {
    return grid.getElementsByTagName("tr")[position[1]]
      .getElementsByTagName("td")[position[0]];
  }

  function countAdjacentMines(gridState, pos) {
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

  function generateGrid(gridState) {
    let tbody = grid.getElementsByTagName("tbody")[0];

    if (!tbody) {
      tbody = document.createElement("tbody");
      grid.appendChild(tbody);
    }
    else {
      tbody.innerHTML = "";
    }

    for (let rowNum = 0; rowNum < gridState.length; rowNum++) {
      const rowEl = document.createElement("tr");

      for (let colNum = 0; colNum < gridState[rowNum].length; colNum++) {
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
  }

  function revealAdjacentEmpties(gridState, position) {
    const height = gridState.length;
    const width = gridState[0].length;

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

        const cell = gridState[col][row];

        if (cell.isRevealed || cell.isFlagged) {
          continue;
        }

        const cellContent = cell.content;

        if (cellContent !== BOMB) {
          revealCell(gridState, [col, row]);

          if (!cellContent) {
            revealAdjacentEmpties(gridState, [col, row]);
          }
        }
      }
    }
  }

  function revealCell(gridState, position) {
    const cell = gridState[position[0]][position[1]];

    if (cell.isRevealed) {
      return;
    }
    
    const cellContent = cell.content;

    const cellElement = getCellElement(position);

    if (cellContent) {
      if (cellContent === BOMB) {
        cellElement.classList.add(BOMB);
      }

      cellElement.innerHTML = cellContent;
    }

    cellElement.classList.add("revealed");

    gridState[position[0]][position[1]].isRevealed = true;

    return cellContent;
  }

  function revealAllCells(gridState) {
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        revealCell(gridState, [col, row]);
      }
    }
  }

  function initializeGrid({ mines, width, height }) {
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

    while (mineNumber < mines) {
      const coords = getRandomCoordinates(width, height);

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

        const adjacent = countAdjacentMines(gridState, [column, row]);

        if (adjacent > 0) {
          gridState[row][column].content = adjacent;
        }
      }
    }

    grid.addEventListener(
      "click",
      function(event) {
        const positionString = event.target.closest("td").dataset.position;
        const position = positionString
          .split(",")
          .map(
            function(coord) {
              return Number(coord);
            }
          );
        
        const cell = gridState[position[0]][position[1]];
        
        if (cell.isRevealed) {
          return;
        }

        if (event.ctrlKey) {
          const cellElement = getCellElement(position);
          cellElement.innerHTML = "";

          if (cell.isFlagged === true) {
            cell.isFlagged = "?";
            cellElement.classList.add("uncertain");
          }
          else if (cell.isFlagged === "?") {
            cell.isFlagged = false;
            cellElement.classList.remove("flagged", "uncertain");
          }
          else if (cell.isFlagged === false) {
            cell.isFlagged = true;
            cellElement.classList.add("flagged");
          }

          markWinner(gridState);

          return;
        }

        if (cell.isFlagged) {
          return;
        }

        const cellContent = revealCell(gridState, position);

        if (cellContent === BOMB) {
          revealAllCells(gridState);
          getCellElement(position).classList.add("last-move");
          return;
        }

        if (!cellContent) {
          revealAdjacentEmpties(gridState, position);
        }

        markWinner(gridState);
      },
      false
    )

    /// DEBUG
    window.getState = function() {
      return gridState;
    };

    window.getStateString = function() {
      return gridState.map((r) => r.map((c) => {
        const bs = c.isRevealed ? "(" : "[";
        const be = c.isRevealed ? ")" : "]";
        return `${bs}${c.content || " "}${c.isFlagged ? "F" : " "}${be}`;
      }).join("")).join("\n");
    }
    /// END DEBUG

    generateGrid(gridState);
  }

  function onReady() {
    gridContainer = document.getElementsByClassName("grid-container")[0];
    grid = gridContainer.getElementsByClassName("grid")[0];

    initializeGrid({
      mines: 5,
      width: 5,
      height: 5,
    });
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
