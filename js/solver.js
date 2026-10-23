/* Solver page: input, running DLS, and replaying the recorded search. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const DELAYS = [1600, 1200, 900, 700, 550, 400, 300, 200, 120, 60]; // ms per step for slider 1..10

  const saved = UI.loadPuzzle();
  const board = new UI.AnimBoard($('board-current'));
  const S = { res: null, frames: [], idx: -1, playing: false, timer: null, start: saved.start, goal: saved.goal };

  UI.buildGrid($('start-grid'), 's', saved.start, onInput);
  UI.buildGrid($('goal-grid'), 'g', saved.goal, onInput);

  function delay() { return DELAYS[Number($('speed').value) - 1]; }
  function showMsg(text, kind) {
    const m = $('msg');
    m.textContent = text || '';
    m.className = 'msg mt-2' + (kind ? ' ' + kind : '');
  }

  function onInput() { resetAll(true); }

  /* ---------- reading and validating the form ---------- */
  function readInputs() {
    const a = UI.readGrid($('start-grid'));
    const b = UI.readGrid($('goal-grid'));
    if (a.error || b.error) { showMsg(a.error || b.error, 'err'); return null; }
    if (!Puzzle.isSolvable(a.state, b.state)) {
      showMsg('This start state cannot reach this goal state (odd inversion parity). Change a pair of tiles, or press Generate Random Puzzle.', 'err');
      return null;
    }
    const limit = parseInt($('limit').value, 10);
    if (!(limit >= 0 && limit <= 40)) { showMsg('Enter a depth limit between 0 and 40.', 'err'); return null; }
    S.start = a.state; S.goal = b.state;
    UI.savePuzzle(a.state, b.state);
    return { start: a.state, goal: b.state, limit: limit, skip: $('skip').checked };
  }

  /* ---------- running the search ---------- */
  function compute() {
    const inp = readInputs();
    if (!inp) return false;
    const res = DLSearch.dls(inp.start, inp.goal, inp.limit, { skipRepeats: inp.skip });
    S.res = res;
    S.frames = res.events.map((e) => ({ kind: 'search', e: e }));
    if (res.found) res.path.forEach((p, i) => S.frames.push({ kind: 'path', p: p, i: i }));
    S.idx = -1;
    $('st-limit').textContent = inp.limit;
    showMsg(res.truncated
      ? 'Search finished (' + UI.fmtInt(res.totalEvents) + ' node visits). The animation covers the first ' + UI.fmtInt(res.events.length) + ' steps. Use Skip to End for the result.'
      : '', 'info');
    renderBoardsStatic();
    return true;
  }

  function ensure() { return S.res || compute(); }

  /* ---------- playback ---------- */
  function setBtns() {
    const has = !!S.res;
    const last = S.frames.length - 1;
    $('btn-pause').disabled = !S.playing;
    $('btn-resume').disabled = S.playing || !has || S.idx >= last;
    $('btn-prev').disabled = !has || S.idx < 0;
    $('btn-next').disabled = has && S.idx >= last;
    $('btn-end').disabled = has && S.idx >= last;
    $('btn-run').textContent = has ? 'Run again' : 'Run';
  }
  function stopTimer() { clearTimeout(S.timer); S.timer = null; S.playing = false; }
  function tick() {
    if (!S.playing) return;
    if (S.idx >= S.frames.length - 1) { stopTimer(); setBtns(); return; }
    goTo(S.idx + 1);
    if (S.idx >= S.frames.length - 1) { stopTimer(); setBtns(); return; }
    S.timer = setTimeout(tick, delay());
  }
  function play() {
    if (S.playing) return;
    S.playing = true;
    setBtns();
    S.timer = setTimeout(tick, 20);
  }

  /* ---------- rendering ---------- */
  function renderBoardsStatic() {
    $('board-start').innerHTML = UI.mini(S.start, 'lg');
    $('board-goal').innerHTML = UI.mini(S.goal, 'lg');
    $('board-start').firstChild.style.setProperty('--mini', 'min(9.5rem, 38vw)');
    $('board-goal').firstChild.style.setProperty('--mini', 'min(9.5rem, 38vw)');
  }

  function setStat(id, v) { $(id).textContent = v; }
  function setNode(id, s) { $(id).innerHTML = s ? UI.mini(s, 'sm') : '–'; }

  function goTo(i) {
    S.idx = i;
    board.setDuration(Math.min(Math.round(delay() * 0.85), 400));
    const last = S.frames.length - 1;
    const f = i >= 0 ? S.frames[i] : null;
    const res = S.res;

    if (!f) { // before the first step
      board.set(S.start);
      $('phase').className = 'phase'; $('phase').textContent = 'Ready';
      $('caption').textContent = 'Press Next Step or Run';
      $('move-label').textContent = '';
      ['st-gen', 'st-exp', 'st-front', 'st-expl', 'st-max', 'st-depth', 'st-cost'].forEach((id) => setStat(id, 0));
      setStat('st-current', '–'); setNode('st-parent', null);
      $('succ').innerHTML = '<span class="empty">Successors of the node being expanded appear here.</span>';
      $('frontier').innerHTML = '<span class="empty">Empty</span>';
      $('explored').innerHTML = '<span class="empty">Empty</span>';
      $('path-panel').hidden = true; $('summary-panel').hidden = true;
      setBtns();
      return;
    }

    if (f.kind === 'search') {
      const e = f.e;
      board.set(e.s);
      $('phase').className = 'phase search'; $('phase').textContent = 'Searching';
      const kindWord = e.kind === 'goal' ? 'goal reached' : e.kind === 'cutoff' ? 'cut off at limit' : 'expanded';
      $('caption').textContent = 'Step ' + (i + 1) + ' of ' + (res.truncated ? UI.fmtInt(res.totalEvents) + '+' : res.events.length) + ' · ' + kindWord;
      $('move-label').textContent = e.move ? '· blank moved ' + e.move : '· start node';
      setNode('st-current', e.s);
      setNode('st-parent', e.parent);
      setStat('st-depth', e.depth); setStat('st-cost', e.depth);
      setStat('st-gen', UI.fmtInt(e.generated)); setStat('st-exp', UI.fmtInt(e.expanded));
      setStat('st-front', UI.fmtInt(e.frontierSize)); setStat('st-expl', UI.fmtInt(e.exploredCount));
      setStat('st-max', e.maxDepth);
      if (e.kind === 'goal') {
        $('succ').innerHTML = UI.node(e.s, 'goal', 'goal');
      } else if (e.kind === 'cutoff') {
        $('succ').innerHTML = UI.node(e.s, 'cutoff · depth ' + e.depth, 'cutoff') +
          '<span class="empty">Depth limit reached, so this node is not expanded.</span>';
      } else {
        $('succ').innerHTML = e.succ.map((c) => UI.node(c.s, c.status === 'new' ? c.move : c.move + ' · skip', c.status)).join('') ||
          '<span class="empty">No successors.</span>';
      }
      $('frontier').innerHTML = e.frontier.length
        ? e.frontier.map((n) => UI.node(n.s, 'd' + n.depth, '')).join('')
        : '<span class="empty">Empty</span>';
      $('explored').innerHTML = e.exploredTail.length
        ? e.exploredTail.map((s) => UI.node(s, '', '')).join('')
        : '<span class="empty">Empty</span>';
    } else { // solution path frame
      const p = f.p;
      board.set(p.s);
      $('phase').className = 'phase path'; $('phase').textContent = 'Solution path';
      $('caption').textContent = 'Move ' + f.i + ' of ' + res.path[res.path.length - 1].depth;
      $('move-label').textContent = p.move ? '· blank moved ' + p.move : '· start';
      setNode('st-current', p.s);
      setNode('st-parent', f.i > 0 ? res.path[f.i - 1].s : null);
      setStat('st-depth', p.depth); setStat('st-cost', p.depth);
      setStat('st-gen', UI.fmtInt(res.stats.generated)); setStat('st-exp', UI.fmtInt(res.stats.expanded));
      setStat('st-max', res.stats.maxDepth);
      $('succ').innerHTML = '<span class="empty">Replaying the solution found by the search.</span>';
      renderPath(f.i);
    }
    if (f.kind !== 'path') $('path-panel').hidden = true;
    $('summary-panel').hidden = i < last;
    if (i >= last) renderSummary();
    setBtns();
  }

  function renderPath(upto) {
    const path = S.res.path;
    let html = '';
    path.forEach((p, i) => {
      if (i > 0) html += '<span class="arrow"><b>→</b>' + p.move + '</span>';
      html += UI.node(p.s, i === 0 ? 'start' : 'step ' + i, i <= upto ? 'new' : '', 'sm');
    });
    $('path-strip').innerHTML = html;
    $('path-panel').hidden = false;
  }

  function renderSummary() {
    const r = S.res, st = r.stats;
    const heads = {
      solution: ['Solution found', 'DLS reached the goal within the depth limit of ' + st.limit + '.'],
      cutoff: ['Solution not found: cutoff', 'No solution within depth ' + st.limit + ', but branches were cut at the limit. Try a larger limit.'],
      failure: ['Solution not found: failure', 'Every reachable state within the search was explored and none is the goal.'],
      aborted: ['Search stopped', 'The safety cap of 500,000 generated nodes was reached. Lower the limit or keep Skip repeated states on.'],
    };
    $('summary-head').innerHTML = '<span class="pill ' + (r.found ? 'yes' : r.result === 'cutoff' ? 'cut' : 'fail') + '">' + heads[r.result][0] + '</span> <span class="muted ms-2">' + heads[r.result][1] + '</span>';
    const rows = [
      ['Solution', r.found ? 'Found' : 'Not found'],
      ['Total moves', r.found ? st.moves : '–'],
      ['Nodes generated', UI.fmtInt(st.generated)],
      ['Nodes expanded', UI.fmtInt(st.expanded)],
      ['Max search depth', st.maxDepth],
      ['Execution time', UI.fmtMs(st.timeMs)],
      ['Path cost', r.found ? st.pathCost : '–'],
      ['Memory (approx.)', UI.fmtBytes(st.memoryBytes) + ' · ' + UI.memClass(st.memoryBytes)],
    ];
    $('summary').innerHTML = rows.map((x) => '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>').join('');
    $('summary-note').textContent = 'Memory is an estimate from the peak frontier size and the explored table. Time is measured while computing the full search, before the animation.';
  }

  function resetAll(keepMsg) {
    stopTimer();
    S.res = null; S.frames = []; S.idx = -1;
    const inp = UI.readGrid($('start-grid')), g = UI.readGrid($('goal-grid'));
    if (!inp.error && !g.error) { S.start = inp.state; S.goal = g.state; }
    board.setDuration(0);
    goTo(-1);
    board.set(S.start);
    renderBoardsStatic();
    setStat('st-limit', $('limit').value || '–');
    if (!keepMsg) showMsg('');
    else if (inp.error || g.error) showMsg(inp.error || g.error, 'err');
    else if (!Puzzle.isSolvable(S.start, S.goal)) showMsg('This start state cannot reach this goal state (odd inversion parity).', 'err');
    else showMsg('');
    setBtns();
  }

  /* ---------- events ---------- */
  $('btn-run').addEventListener('click', function () {
    stopTimer();
    S.res = null;
    if (!compute()) return;
    board.set(S.start);
    play();
  });
  $('btn-pause').addEventListener('click', function () { stopTimer(); setBtns(); });
  $('btn-resume').addEventListener('click', function () { if (S.res) play(); });
  $('btn-next').addEventListener('click', function () {
    stopTimer();
    if (!ensure()) return;
    if (S.idx < S.frames.length - 1) goTo(S.idx + 1);
  });
  $('btn-prev').addEventListener('click', function () {
    stopTimer();
    if (S.res && S.idx >= 0) goTo(S.idx - 1);
  });
  $('btn-end').addEventListener('click', function () {
    stopTimer();
    if (!ensure()) return;
    goTo(S.frames.length - 1);
  });
  $('btn-reset').addEventListener('click', function () { resetAll(false); });
  $('speed').addEventListener('input', function () { $('speed-label').textContent = delay() + ' ms / step'; });
  $('limit').addEventListener('input', onInput);
  $('skip').addEventListener('change', onInput);
  $('btn-random').addEventListener('click', function () {
    const g = UI.readGrid($('goal-grid'));
    if (g.error) { showMsg('Fix the goal state first, a random puzzle is built from it.', 'err'); return; }
    const n = Math.min(30, Math.max(2, parseInt($('scramble').value, 10) || 8));
    $('scramble').value = n;
    UI.setGrid($('start-grid'), Puzzle.randomFrom(g.state, n));
    resetAll(false);
    const suggested = Math.max(parseInt($('limit').value, 10) || 0, n);
    if (suggested !== parseInt($('limit').value, 10)) {
      $('limit').value = suggested;
      setStat('st-limit', suggested);
      showMsg('Depth limit raised to ' + suggested + ' so the scramble can be undone. Lower it to see a cutoff.', 'info');
    }
  });

  $('speed-label').textContent = delay() + ' ms / step';
  resetAll(true);
})();
