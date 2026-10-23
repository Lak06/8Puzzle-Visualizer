/* Depth Limited Search (DLS) for the 8-puzzle, written from scratch.
 *
 * DLS is depth first search that refuses to expand any node whose depth equals
 * the limit. It returns one of three outcomes:
 *   solution : the goal was reached within the limit
 *   cutoff   : no solution found, but some branch was cut off at the limit
 *   failure  : the whole space within reach was searched, no solution exists
 *   aborted  : the safety cap on generated nodes was hit before finishing
 *
 * The frontier is an explicit stack, so the search is iterative and cannot
 * overflow the call stack. Every expansion is recorded as an "event" so the
 * UI can replay, pause and step through the search.
 */
(function (root) {
  'use strict';

  const P = typeof require !== 'undefined' ? require('./puzzle.js') : root.Puzzle;
  const BYTES_PER_NODE = 72; // rough size of one node object, used for the memory estimate

  function onPath(node, state) {
    for (let p = node; p; p = p.parent) if (p.s === state) return true;
    return false;
  }

  /**
   * @param {string} start  start state
   * @param {string} goal   goal state
   * @param {number} limit  depth limit l
   * @param {{skipRepeats?:boolean, recordCap?:number, nodeCap?:number}} opts
   *   skipRepeats : do not push a state already on the current path, or already
   *                 expanded at an equal or shallower depth. Keeps DLS complete
   *                 for its limit but avoids exponential repeat work.
   *   recordCap   : how many events to keep for the animation
   *   nodeCap     : stop after this many generated nodes
   */
  function dls(start, goal, limit, opts) {
    opts = opts || {};
    const skipRepeats = opts.skipRepeats !== false;
    const recordCap = opts.recordCap || 4000;
    const nodeCap = opts.nodeCap || 500000;

    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const events = [];
    const exploredAll = [];
    const bestDepth = new Map(); // state -> shallowest depth it was popped at
    const stack = [{ s: start, depth: 0, parent: null, move: null }];

    let generated = 1;
    let expanded = 0;
    let maxDepth = 0;
    let cutoffs = 0;
    let peakFrontier = 1;
    let totalEvents = 0;
    let goalNode = null;
    let aborted = false;

    function record(kind, node, succ) {
      totalEvents++;
      if (events.length >= recordCap) return;
      events.push({
        kind: kind,
        s: node.s,
        depth: node.depth,
        parent: node.parent ? node.parent.s : null,
        move: node.move,
        succ: succ,
        frontier: stack.slice(-8).reverse().map((n) => ({ s: n.s, depth: n.depth })),
        frontierSize: stack.length,
        exploredTail: exploredAll.slice(-8),
        exploredCount: exploredAll.length,
        generated: generated,
        expanded: expanded,
        maxDepth: maxDepth,
        cutoffs: cutoffs,
      });
    }

    while (stack.length) {
      if (generated > nodeCap) { aborted = true; break; }
      const node = stack.pop();

      if (skipRepeats) {
        const seen = bestDepth.get(node.s);
        if (seen !== undefined && seen <= node.depth) continue;
        bestDepth.set(node.s, node.depth);
      }

      exploredAll.push(node.s);
      if (node.depth > maxDepth) maxDepth = node.depth;

      if (node.s === goal) {
        goalNode = node;
        record('goal', node, []);
        break;
      }

      if (node.depth >= limit) {
        cutoffs++;
        record('cutoff', node, []);
        continue;
      }

      expanded++;
      const kids = P.neighbors(node.s);
      generated += kids.length;
      const succ = [];
      const toPush = [];
      for (const k of kids) {
        let status = 'new';
        if (onPath(node, k.state)) status = 'repeat';
        else if (skipRepeats) {
          const seen = bestDepth.get(k.state);
          if (seen !== undefined && seen <= node.depth + 1) status = 'repeat';
        }
        succ.push({ s: k.state, move: k.move, status: status });
        if (status === 'new') toPush.push({ s: k.state, depth: node.depth + 1, parent: node, move: k.move });
      }
      // push in reverse so the first move (Up) is explored first
      for (let i = toPush.length - 1; i >= 0; i--) stack.push(toPush[i]);
      if (stack.length > peakFrontier) peakFrontier = stack.length;
      record('expand', node, succ);
    }

    const time = (typeof performance !== 'undefined' ? performance : Date).now() - t0;

    let path = [];
    let result;
    if (goalNode) {
      result = 'solution';
      for (let n = goalNode; n; n = n.parent) path.push({ s: n.s, move: n.move, depth: n.depth });
      path.reverse();
    } else if (aborted) result = 'aborted';
    else if (cutoffs > 0) result = 'cutoff';
    else result = 'failure';

    const memNodes = peakFrontier + (skipRepeats ? bestDepth.size : 0);
    return {
      result: result,
      found: result === 'solution',
      path: path,
      events: events,
      truncated: totalEvents > events.length,
      totalEvents: totalEvents,
      stats: {
        limit: limit,
        generated: generated,
        expanded: expanded,
        maxDepth: maxDepth,
        cutoffs: cutoffs,
        peakFrontier: peakFrontier,
        moves: goalNode ? goalNode.depth : null,
        pathCost: goalNode ? goalNode.depth : null,
        timeMs: time,
        memoryBytes: memNodes * BYTES_PER_NODE,
      },
    };
  }

  const api = { dls: dls };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DLSearch = api;
})(typeof self !== 'undefined' ? self : this);
