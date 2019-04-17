;(function() {
  "use strict";

  function getGameParameters(controlsContainer) {
    const width = controlsContainer
      .querySelector('[name="width"]').valueAsNumber;
    const height = controlsContainer
      .querySelector('[name="height"]').valueAsNumber;
    const mineCount = controlsContainer
      .querySelector('[name="num_mines"]').valueAsNumber;
    const protectFirstClick = controlsContainer
      .querySelector('[name="protect_first"]').checked;
    
    return {
      width,
      height,
      mineCount,
      protectFirstClick,
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

    const game = new Game(
      getGameParameters(controlsContainer)
    );
    
    game.once("win", onWin);
    game.once("loss", onLoss);
    
    game.render(gridContainer);
    
    const reloadButton = document.getElementsByClassName("reload-button")[0];
    
    reloadButton.addEventListener(
      "click",
      function() {
        gridContainer.classList.remove("won", "lost");

        const game = new Game(
          getGameParameters(controlsContainer)
        );

        game.once("win", onWin);
        game.once("loss", onLoss);

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
