// /js/charts/makeCharts.js
import { shorten } from '../core/formatters.js';

/* ========= Helpers de tema (lee variables desde CSS) ========= */
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v && v.trim()) || fallback;
}
function buildThemeFromCSS() {
  return {
    grid:   cssVar('--chart-grid',   'rgba(2,6,23,0.08)'),
    tick:   cssVar('--chart-tick',   '#475569'),
    legend: cssVar('--chart-legend', '#334155'),
    series: {
      primary:  cssVar('--series-1',      'rgba(139,92,246,0.85)'),
      primaryB: cssVar('--series-1b',     'rgba(139,92,246,1)'),
      alt:      cssVar('--series-1-soft', 'rgba(167,139,250,0.5)'),
    },
    doughnut: [
      cssVar('--series-1', 'rgba(139,92,246,0.85)'),
      cssVar('--series-2', '#fca5a5'),
      cssVar('--series-3', '#fbbf24'),
      cssVar('--series-4', '#22d3ee'),
      cssVar('--series-5', '#86efac'),
    ],
  };
}

/* ========= Defaults globales de Chart.js ========= */
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.resizeDelay = 150;

/* ========= THEME activo (se recalcula al cambiar de modo) ========= */
let THEME = buildThemeFromCSS();

/* ========= Vida de los charts ========= */
let charts = {};

export function destroyCharts() {
  for (const k in charts) {
    try { charts[k].destroy(); } catch {}
  }
  charts = {};
}

/* helper: destruye instancia previa por clave antes de re-crear */
function safeDestroy(key) {
  const c = charts[key];
  if (c && typeof c.destroy === 'function') {
    try { c.destroy(); } catch {}
    charts[key] = undefined;
  }
}

/* ========= Permite refrescar colores sin re-crear charts ========= */
export function refreshChartTheme() {
  THEME = buildThemeFromCSS();
  for (const key in charts) {
    const c = charts[key];
    if (!c) continue;
    try {
      if (c.config.type === 'bar') {
        const ds = c.data.datasets?.[0];
        if (ds) {
          ds.backgroundColor = THEME.series.primary;
          ds.borderColor = THEME.series.primaryB;
        }
        c.options.scales.x.grid.color = THEME.grid;
        c.options.scales.y.grid.color = THEME.grid;
        c.options.scales.x.ticks.color = THEME.tick;
        c.options.scales.y.ticks.color = THEME.tick;
        c.options.plugins.legend.labels.color = THEME.legend;
      } else if (c.config.type === 'line') {
        const ds = c.data.datasets?.[0];
        if (ds) {
          ds.borderColor = THEME.series.primaryB;
          ds.backgroundColor = THEME.series.alt;
        }
        c.options.scales.x.grid.color = THEME.grid;
        c.options.scales.y.grid.color = THEME.grid;
        c.options.scales.x.ticks.color = THEME.tick;
        c.options.scales.y.ticks.color = THEME.tick;
        c.options.plugins.legend.labels.color = THEME.legend;
      } else if (c.config.type === 'doughnut') {
        const ds = c.data.datasets?.[0];
        if (ds) ds.backgroundColor = THEME.doughnut;
        c.options.plugins.legend.labels.color = THEME.legend;
        // si usas font por variables, puedes setear aquí también
      }
      c.update('none');
    } catch {}
  }
}

/* ========= Factories ========= */
export function makeBarChart(ctx, labels, data, {
  label,
  valueFmt,
  maxLabelLen = 16,
  key,
  showLegend = false
}) {
  safeDestroy(key); // <- evita conflicto al re-render
  charts[key] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: THEME.series.primary,
        borderColor: THEME.series.primaryB,
        borderWidth: 1.5,
        borderRadius: 8,
      }]
    },
    options: {
      layout: { padding: { top: 6, right: 10, left: 10, bottom: 4 } },
      scales: {
        x: {
          ticks: {
            color: THEME.tick,
            autoSkip: true,
            maxTicksLimit: 8,
            callback: (_, i) => shorten(labels[i], maxLabelLen)
          },
          grid: { color: THEME.grid },
        },
        y: {
          ticks: { color: THEME.tick, callback: (v) => valueFmt(v) },
          grid: { color: THEME.grid },
          beginAtZero: true,
        },
      },
      plugins: {
        title: { display: false }, // títulos están en la card (.chart-title)
        legend: { display: showLegend, position: 'top', labels: { color: THEME.legend, padding: 12 } },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: { label: (ctx) => `${label}: ${valueFmt(ctx.parsed.y)}` }
        },
      },
      datasets: { bar: { barPercentage: 0.7, categoryPercentage: 0.7 } },
    },
  });
  return charts[key];
}

export function makeLineChart(ctx, labels, data, label, {
  valueFmt,
  maxLabelLen = 7,
  key,
  showLegend = false
}) {
  safeDestroy(key); // <- evita conflicto al re-render
  charts[key] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: THEME.series.primaryB,
        backgroundColor: THEME.series.alt,
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
      }]
    },
    options: {
      layout: { padding: { top: 6, right: 10, left: 10, bottom: 4 } },
      scales: {
        x: {
          ticks: {
            color: THEME.tick,
            autoSkip: true,
            maxTicksLimit: 12,
            callback: (_, i) => shorten(labels[i], maxLabelLen)
          },
          grid: { color: THEME.grid },
        },
        y: {
          ticks: { color: THEME.tick, callback: (v) => valueFmt(v) },
          grid: { color: THEME.grid },
          beginAtZero: true,
        },
      },
      plugins: {
        title: { display: false },
        legend: { display: showLegend, position: 'top', labels: { color: THEME.legend, padding: 12 } },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: { label: (ctx) => `${label}: ${valueFmt(ctx.parsed.y)}` }
        },
      },
    },
  });
  return charts[key];
}

export function makeDoughnutChart(ctx, labels, data, label, {
  key,
  showLegend = true
}) {
  safeDestroy(key); // <- evita conflicto al re-render
  charts[key] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: THEME.doughnut
      }]
    },
    options: {
      cutout: '60%',
      layout: { padding: { top: 6, right: 10, bottom: 8, left: 10 } },
      plugins: {
        title: { display: false },
        legend: {
          display: showLegend,
          position: 'bottom',
          labels: {
            color: THEME.legend,
            padding: 12,
            font: { size: 15, weight: '700' } // leyenda más grande y negrita
          }
        },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed?.toLocaleString?.('es-CL') ?? ctx.parsed}` }
        },
      },
    },
  });
  return charts[key];
}
