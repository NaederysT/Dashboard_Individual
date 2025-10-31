// js/theme-toggle.js
const root = document.documentElement;
const btn  = document.getElementById('themeToggle');
const icon = document.getElementById('themeIcon');
const label= document.getElementById('themeLabel');

const THEME_KEY = 'dashboard-theme';

function applyTheme(t){
  root.setAttribute('data-theme', t);
  if(t === 'dark'){ icon.textContent = '☀️'; label.textContent = 'Claro'; }
  else{ icon.textContent = '🌙'; label.textContent = 'Oscuro'; }
  // Si usas una versión de makeCharts que lee CSS vars, aquí podrías refrescar:
  import('./charts/makeCharts.js').then(({ refreshChartTheme }) => refreshChartTheme?.());
}

// Inicial: preferencia guardada o media query
const saved = localStorage.getItem(THEME_KEY);
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(saved || (prefersDark ? 'dark' : 'light'));

btn?.addEventListener('click', ()=>{
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});
