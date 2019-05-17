;(function(global) {
  "use strict";

  function chooseMove(game) { }

  if (!global.Mineswp) {
    global.Mineswp = {};
  }

  if (!global.Mineswp.strategies) {
    global.Mineswp.strategies = {};
  }

  global.Mineswp.strategies.tank = {
    name: "Tank",
    order: 1,
    chooseMove,
  };

})(window);
