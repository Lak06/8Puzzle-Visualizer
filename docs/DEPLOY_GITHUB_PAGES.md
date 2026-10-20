# Deploy on GitHub Pages

1. Edit `js/common.js` (name, registration number, repo URL) and the placeholders in `README.md`.
2. Create an empty public repository named `8Puzzle-Visualizer` on github.com (no README, no .gitignore).
3. Push the code using the commands in `GIT_BRANCHES.md`.
4. Merge all four feature pull requests into `main`.
5. Open the repository, then **Settings > Pages**.
6. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
7. Set **Branch** to `main` and the folder to `/ (root)`, then press **Save**.
8. Wait one to two minutes. Refresh the Pages screen until it shows "Your site is live at https://Lak06.github.io/8Puzzle-Visualizer/".
9. Open that link and test: run the solver with limit 5, then limit 3, then the comparison page.
10. Put the live URL in `README.md`, commit and push to `main`.
