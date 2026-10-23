/* Comparison page: run DLS on one puzzle at several depth limits. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const NODE_CAP = 200000;
  const puzzle = UI.loadPuzzle();

  $('cmp-start').innerHTML = UI.mini(puzzle.start, 'lg');
  $('cmp-goal').innerHTML = UI.mini(puzzle.goal, 'lg');

  function parseLimits() {
    const list = $('limits').value.split(/[\s,;]+/).filter(Boolean).map(Number);
    if (!list.length || list.some((n) => !Number.isInteger(n) || n < 0 || n > 40)) return null;
    return Array.from(new Set(list)).sort((a, b) => a - b).slice(0, 20);
  }

  function run() {
    const msg = $('cmp-msg');
    if (!Puzzle.isSolvable(puzzle.start, puzzle.goal)) {
      msg.textContent = 'The saved puzzle is not solvable. Fix it in the solver first.'; msg.className = 'msg err mt-2'; return;
    }
    const limits = parseLimits();
    if (!limits) {
      msg.textContent = 'Enter whole numbers from 0 to 40, separated by commas.'; msg.className = 'msg err mt-2'; return;
    }
    msg.textContent = ''; msg.className = 'msg mt-2';
    const skip = $('cmp-skip').checked;
    const results = limits.map((l) => DLSearch.dls(puzzle.start, puzzle.goal, l, { skipRepeats: skip, recordCap: 0, nodeCap: NODE_CAP }));
    render(limits, results);
  }

  const outcome = {
    solution: ['Solution', 'yes'], cutoff: ['Cutoff', 'cut'], failure: ['Failure', 'fail'], aborted: ['Aborted', 'cut'],
  };

  function render(limits, results) {
    const firstHit = results.findIndex((r) => r.found);
    $('cmp-table').querySelector('tbody').innerHTML = results.map((r, i) => {
      const st = r.stats, o = outcome[r.result];
      return '<tr class="' + (i === firstHit ? 'hit' : '') + '">' +
        '<td>' + limits[i] + '</td>' +
        '<td><span class="pill ' + o[1] + '">' + o[0] + '</span></td>' +
        '<td>' + (r.found ? 'Yes' : 'No') + '</td>' +
        '<td>' + UI.fmtInt(st.generated) + '</td>' +
        '<td>' + UI.fmtInt(st.expanded) + '</td>' +
        '<td>' + (r.found ? st.moves : '–') + '</td>' +
        '<td>' + UI.fmtMs(st.timeMs) + '</td>' +
        '<td>' + UI.memClass(st.memoryBytes) + ' · ' + UI.fmtBytes(st.memoryBytes) + '</td></tr>';
    }).join('');

    const max = Math.max.apply(null, results.map((r) => r.stats.expanded)) || 1;
    $('bars').innerHTML = results.map((r, i) => {
      const pct = Math.max(0.5, (r.stats.expanded / max) * 100);
      return '<div class="bar-row ' + (r.found ? '' : 'miss') + '"><span>l = ' + limits[i] + '</span>' +
        '<span class="track"><span class="fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
        '<span class="v">' + UI.fmtInt(r.stats.expanded) + '</span></div>';
    }).join('') + '<p class="input-hint mb-0 mt-2">Cream bars found a solution, sage bars did not.</p>';
  }

  $('btn-compare').addEventListener('click', run);
  run();
})();
