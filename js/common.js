/* Student details and shared page bits. Edit SITE and refresh: every page reads from here. */
window.SITE = {
  course: 'Artificial Intelligence',
  title: 'Interactive 8-Puzzle Problem Solver using AI Search Algorithms',
  studentName: 'Lakshana R',
  regNo: '24BCE0324',
  algorithm: 'Depth Limited Search (DLS)',
  repoUrl: 'https://github.com/Lak06/8Puzzle-Visualizer',
};

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-site]').forEach(function (el) {
    const key = el.getAttribute('data-site');
    if (window.SITE[key]) el.textContent = window.SITE[key];
  });
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.site-nav .nav-link').forEach(function (a) {
    if ((a.getAttribute('href') || '').toLowerCase() === here) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
});
