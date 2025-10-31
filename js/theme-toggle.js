// js/theme-toggle.js — Alterna tema claro/oscuro y refresca colores de charts

// Referencias a root (para data-theme) y al botón/etiquetas del toggle
const root  = document.documentElement;
const btn   = document.getElementById('themeToggle');
const icon  = document.getElementById('themeIcon');
const label = document.getElementById('themeLabel');

// Clave de almacenamiento local para persistir la preferencia de tema
const THEME_KEY = 'dashboard-theme';

// Aplica un tema ('light' | 'dark'), ajusta icono/texto y refresca charts
function applyTheme(t){
  root.setAttribute('data-theme', t);                               // Setea atributo para CSS variables
  if (t === 'dark') { icon.textContent = '☀️'; label.textContent = 'Claro'; }
  else              { icon.textContent = '🌙'; label.textContent = 'Oscuro'; }

  // Relee variables CSS en los gráficos activos para sincronizar colores
  import('./charts/makeCharts.js').then(({ refreshChartTheme }) => refreshChartTheme?.());
}

// Carga tema inicial desde localStorage o usa preferencia del SO como fallback
const saved = localStorage.getItem(THEME_KEY);
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(saved || (prefersDark ? 'dark' : 'light'));

// Listener: al hacer click alterna el tema, persiste y reaplica
btn?.addEventListener('click', ()=>{
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);                            // Guarda la preferencia del usuario
  applyTheme(next);                                                 // Aplica y refresca charts
});
