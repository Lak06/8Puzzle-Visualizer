# Which code goes to which branch

| Branch | Files | What it adds |
|---|---|---|
| `main` (first commit) | `README.md`, `package.json`, `.gitignore`, `.nojekyll`, `assets/`, `images/`, `docs/` | Repository skeleton, Bootstrap, screenshots, documentation |
| `feature/core-dls-algorithm` | `js/puzzle.js`, `js/dls.js` | Puzzle state helpers and the Depth Limited Search |
| `feature/ui-theme-home` | `css/style.css`, `js/common.js`, `js/ui.js`, `index.html` | Colour theme, shared UI helpers, Home page |
| `feature/solver-visualization` | `solver.html`, `js/solver.js` | Input, animated board, search panels, controls, summary |
| `feature/comparison-and-info` | `comparison.html`, `js/comparison.js`, `algorithm.html` | Comparison page and algorithm information page |

Merge in this order, because each branch uses files from the one before it:
core-dls-algorithm, ui-theme-home, solver-visualization, comparison-and-info.
GitHub Pages is served from `main`.

## Commands

```bash
cd 8Puzzle-Visualizer
git init -b main
git add README.md package.json .gitignore .nojekyll assets images docs
git commit -m "Add repository skeleton, Bootstrap, docs and screenshots"
git remote add origin https://github.com/Lak06/8Puzzle-Visualizer.git
git push -u origin main

# 1
git checkout -b feature/core-dls-algorithm
git add js/puzzle.js js/dls.js
git commit -m "Add puzzle helpers and Depth Limited Search"
git push -u origin feature/core-dls-algorithm

# 2 (branch from the previous one so the files it needs are present)
git checkout -b feature/ui-theme-home
git add css/style.css js/common.js js/ui.js index.html
git commit -m "Add theme, UI helpers and home page"
git push -u origin feature/ui-theme-home

# 3
git checkout -b feature/solver-visualization
git add solver.html js/solver.js
git commit -m "Add solver page with animated DLS visualisation"
git push -u origin feature/solver-visualization

# 4
git checkout -b feature/comparison-and-info
git add comparison.html js/comparison.js algorithm.html
git commit -m "Add comparison and algorithm information pages"
git push -u origin feature/comparison-and-info
```

Then on GitHub open a pull request for each branch into `main`, in the order above, and merge them. After the last merge, `main` has the complete site.
