/* 8-puzzle state helpers.
 * A state is a 9-character string, row by row, "0" is the blank.
 * Example: "283164705" is
 *   2 8 3
 *   1 6 4
 *   7 _ 5
 */
(function (root) {
  'use strict';

  const DEFAULT_START = '283164705';
  const DEFAULT_GOAL = '123804765';

  function isValid(s) {
    return typeof s === 'string' && /^[0-8]{9}$/.test(s) && new Set(s).size === 9;
  }

  // Successors in a fixed order: the blank moves Up, Down, Left, Right.
  function neighbors(s) {
    const b = s.indexOf('0');
    const r = (b / 3) | 0;
    const c = b % 3;
    const out = [];
    const add = (move, ok, target) => {
      if (!ok) return;
      const a = s.split('');
      a[b] = a[target];
      a[target] = '0';
      out.push({ state: a.join(''), move: move, tile: s[target] });
    };
    add('Up', r > 0, b - 3);
    add('Down', r < 2, b + 3);
    add('Left', c > 0, b - 1);
    add('Right', c < 2, b + 1);
    return out;
  }

  function inversions(s) {
    let n = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        if (s[i] !== '0' && s[j] !== '0' && s[i] > s[j]) n++;
      }
    }
    return n;
  }

  // On a 3x3 board two states are mutually reachable iff their inversion parities match.
  function isSolvable(start, goal) {
    return inversions(start) % 2 === inversions(goal) % 2;
  }

  // Scramble the goal with random legal moves, so the result is always solvable.
  function randomFrom(goal, moves) {
    for (;;) {
      let cur = goal;
      let prev = null;
      for (let i = 0; i < moves; i++) {
        const options = neighbors(cur).filter((n) => n.state !== prev);
        const pick = options[Math.floor(Math.random() * options.length)];
        prev = cur;
        cur = pick.state;
      }
      if (cur !== goal) return cur;
    }
  }

  function toRows(s) {
    return [s.slice(0, 3), s.slice(3, 6), s.slice(6, 9)];
  }

  function format(s) {
    return toRows(s).map((r) => r.split('').map((x) => (x === '0' ? '_' : x)).join(' ')).join(' / ');
  }

  const api = { DEFAULT_START, DEFAULT_GOAL, isValid, neighbors, inversions, isSolvable, randomFrom, toRows, format };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzle = api;
})(typeof self !== 'undefined' ? self : this);
