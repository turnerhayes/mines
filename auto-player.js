;(function(global) {
  "use strict";

  const DEFAULT_MOVE_INTERVAL_MS = 1500;

  class AutoPlayer {
    /**
     * 
     * @param {object} args
     * @param {Game} args.game
     * @param {function} args.chooseMove
     * @param {number} [args.moveInterval]
     */
    constructor({
      game,
      chooseMove,
      moveInterval = DEFAULT_MOVE_INTERVAL_MS,
    }) {
      this.game = game;
      this.moveInterval = moveInterval;
      this._autoMove = false;

      if (typeof chooseMove === "function") {
        this.chooseMove = chooseMove;
      }
      else {
        this.chooseMove = AutoPlayer.defaultChooseMove;
      }

      this.makeMove = this.makeMove.bind(this);
    }

    static defaultChooseMove(game) {
      const unrevealed = game.grid.getUnrevealedCells();

      return unrevealed[
        Math.floor(Math.random() * unrevealed.length)
      ].position;
    }

    get autoMove() {
      return this._autoMove;
    }

    set autoMove(value) {
      this._autoMove = value;

      if (!value && this._moveTimeout) {
        clearTimeout(this._moveTimeout);
        this._moveTimeout = undefined;
      }
    }

    makeMove() {
      let choices = this.chooseMove(this.game);

      if (choices) {
        if (!Array.isArray(choices)) {
          choices = [choices];
        }
      }
      
      if (!choices || choices.length === 0) {
        throw new Error("No move(s) chosen");
      }

      for (let choiceIndex = 0; choiceIndex < choices.length; choiceIndex++) {
        let position = this.chooseMove(this.game);
        let shouldFlag = false;
  
        if (!(position instanceof Position)) {
          shouldFlag = position.shouldFlag;
          position = position.position;
        }
  
        const result = this.game.pressCell(position, shouldFlag);

        if (result !== null) {
          if (this._moveTimeout) {
            clearTimeout(this._moveTimeout);
            this._moveTimeout = undefined;
          }
          return;
        }
  
        if (this.autoMove) {
          if (result === null) {
            this._moveTimeout = setTimeout(
              this.makeMove,
              this.moveInterval * (choiceIndex + 1)
            );
          }
          else {
            if (this._moveTimeout) {
              clearTimeout(this._moveTimeout);
              this._moveTimeout = undefined;
            }
          }
        }
      }
    }
  }

  global.AutoPlayer = AutoPlayer;
}(self));
