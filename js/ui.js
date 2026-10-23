/* Shared UI helpers: mini boards, the animated board, 3x3 input grids, formatting. */
(function (root) {
  'use strict';
  const P = root.Puzzle;

  function mini(state, size) {
    const cells = state.split('').map((c) => (c === '0' ? '<i class="blank"></i>' : '<i>' + c + '</i>')).join('');
    return '<span class="mini ' + (size || '') + '" role="img" aria-label="' + P.format(state) + '">' + cells + '</span>';
  }

  function node(state, tag, cls, size) {
    return '<span class="node ' + (cls || '') + '">' + mini(state, size || 'sm') + '<span class="tag">' + tag + '</span></span>';
  }

  // Board whose tiles slide to new positions with a CSS transition.
  function AnimBoard(el) {
    this.el = el;
    this.tiles = {};
    for (let n = 1; n <= 8; n++) {
      const t = document.createElement('div');
      t.className = 'tile';
      t.innerHTML = '<span>' + n + '</span>';
      el.appendChild(t);
      this.tiles[n] = t;
    }
  }
  AnimBoard.prototype.set = function (state) {
    for (let i = 0; i < 9; i++) {
      if (state[i] === '0') continue;
      this.tiles[state[i]].style.transform = 'translate(' + (i % 3) * 100 + '%,' + Math.floor(i / 3) * 100 + '%)';
    }
  };
  AnimBoard.prototype.setDuration = function (ms) {
    this.el.style.setProperty('--dur', ms + 'ms');
  };

  // 3x3 grid of text inputs
  function buildGrid(container, prefix, state, onChange) {
    container.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'form-control';
      inp.id = prefix + i;
      inp.maxLength = 1;
      inp.autocomplete = 'off';
      inp.inputMode = 'numeric';
      inp.setAttribute('aria-label', 'Row ' + (Math.floor(i / 3) + 1) + ' column ' + ((i % 3) + 1));
      inp.addEventListener('input', onChange);
      inp.addEventListener('focus', function () { inp.select(); });
      container.appendChild(inp);
    }
    setGrid(container, state);
  }
  function setGrid(container, state) {
    const inputs = container.querySelectorAll('input');
    for (let i = 0; i < 9; i++) {
      inputs[i].value = state[i] === '0' ? '' : state[i];
      inputs[i].classList.remove('bad');
    }
  }
  // Returns { state, error }. Marks invalid or duplicate cells.
  function readGrid(container) {
    const inputs = container.querySelectorAll('input');
    const vals = [];
    const bad = new Set();
    for (let i = 0; i < 9; i++) {
      const v = inputs[i].value.trim();
      if (v === '' || v === '_' || v === '-' || v === '0') vals.push('0');
      else if (/^[1-8]$/.test(v)) vals.push(v);
      else { vals.push('x'); bad.add(i); }
    }
    const seen = {};
    vals.forEach((v, i) => {
      if (v === 'x') return;
      if (seen[v] !== undefined) { bad.add(i); bad.add(seen[v]); } else seen[v] = i;
    });
    inputs.forEach((inp, i) => inp.classList.toggle('bad', bad.has(i)));
    if (bad.size) return { state: null, error: 'Use each of 1 to 8 once, with one empty cell for the blank.' };
    const state = vals.join('');
    if (!P.isValid(state)) return { state: null, error: 'Use each of 1 to 8 once, with exactly one empty cell for the blank.' };
    return { state: state, error: null };
  }

  function fmtMs(ms) {
    return ms < 1 ? '< 1 ms' : ms < 100 ? ms.toFixed(1) + ' ms' : Math.round(ms) + ' ms';
  }
  function fmtBytes(b) {
    return b < 1024 ? b + ' B' : (b / 1024).toFixed(1) + ' KB';
  }
  function memClass(b) {
    return b < 50 * 1024 ? 'Low' : b < 500 * 1024 ? 'Medium' : 'High';
  }
  function fmtInt(n) { return Number(n).toLocaleString('en-US'); }

  function savePuzzle(start, goal) {
    try { localStorage.setItem('ai8.puzzle', JSON.stringify({ start: start, goal: goal })); } catch (e) { /* storage unavailable */ }
  }
  function loadPuzzle() {
    try {
      const v = JSON.parse(localStorage.getItem('ai8.puzzle'));
      if (v && P.isValid(v.start) && P.isValid(v.goal)) return v;
    } catch (e) { /* ignore */ }
    return { start: P.DEFAULT_START, goal: P.DEFAULT_GOAL };
  }

  root.UI = { mini, node, AnimBoard, buildGrid, setGrid, readGrid, fmtMs, fmtBytes, memClass, fmtInt, savePuzzle, loadPuzzle };
})(window);
