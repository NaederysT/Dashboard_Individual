// /js/charts/makeCharts.js — Factories de Chart.js con theming dinámico desde CSS y gestión de instancias
import { shorten } from "../core/formatters.js";

/* Lee variable CSS o usa fallback si no existe */
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v && v.trim()) || fallback;
}

/* Construye paleta de colores leyendo variables CSS (soporta dark/light) */
function buildThemeFromCSS() {
  return {
    grid: cssVar("--chart-grid", "rgba(2,6,23,0.08)"),
    tick: cssVar("--chart-tick", "#475569"),
    legend: cssVar("--chart-legend", "#334155"),
    series: {
      primary: cssVar("--series-1", "rgba(139,92,246,0.85)"),
      primaryB: cssVar("--series-1b", "rgba(139,92,246,1)"),
      alt: cssVar("--series-1-soft", "rgba(167,139,250,0.5)"),
    },
    doughnut: [
      cssVar("--series-1", "rgba(139,92,246,0.85)"),
      cssVar("--series-2", "#fca5a5"),
      cssVar("--series-3", "#fbbf24"),
      cssVar("--series-4", "#22d3ee"),
      cssVar("--series-5", "#86efac"),
    ],
  };
}

/* Define defaults globales de Chart.js responsivo y sin mantener aspect ratio fijo */
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.resizeDelay = 150;

/* THEME activo inicial (se recalcula al cambiar tema) */
let THEME = buildThemeFromCSS();

/* Registro de instancias Chart por clave para destruir/actualizar */
let charts = {};

/* Destruye todas las instancias registradas y limpia el registro */
export function destroyCharts() {
  for (const k in charts) {
    try {
      charts[k].destroy();
    } catch {}
  }
  charts = {};
}

/* Destruye de forma segura una instancia previa asociada a una clave */
function safeDestroy(key) {
  const c = charts[key];
  if (c && typeof c.destroy === "function") {
    try {
      c.destroy();
    } catch {}
    charts[key] = undefined;
  }
}

/* Reconstruye THEME desde CSS y actualiza colores de charts existentes sin recrearlos */
export function refreshChartTheme() {
  THEME = buildThemeFromCSS();
  for (const key in charts) {
    const c = charts[key];
    if (!c) continue;
    try {
      if (c.config.type === "bar") {
        const ds = c.data.datasets?.[0];
        if (ds) {
          ds.backgroundColor = THEME.series.primary; // Actualiza color de barras
          ds.borderColor = THEME.series.primaryB; // Actualiza borde de barras
        }
        c.options.scales.x.grid.color = THEME.grid; // Reaplica color de grilla X
        c.options.scales.y.grid.color = THEME.grid; // Reaplica color de grilla Y
        c.options.scales.x.ticks.color = THEME.tick; // Reaplica color de ticks X
        c.options.scales.y.ticks.color = THEME.tick; // Reaplica color de ticks Y
        c.options.plugins.legend.labels.color = THEME.legend; // Reaplica color de leyenda
      } else if (c.config.type === "line") {
        const ds = c.data.datasets?.[0];
        if (ds) {
          ds.borderColor = THEME.series.primaryB; // Actualiza trazo de línea
          ds.backgroundColor = THEME.series.alt; // Actualiza área bajo la línea
        }
        c.options.scales.x.grid.color = THEME.grid; // Reaplica color de grilla X
        c.options.scales.y.grid.color = THEME.grid; // Reaplica color de grilla Y
        c.options.scales.x.ticks.color = THEME.tick; // Reaplica color de ticks X
        c.options.scales.y.ticks.color = THEME.tick; // Reaplica color de ticks Y
        c.options.plugins.legend.labels.color = THEME.legend; // Reaplica color de leyenda
      } else if (c.config.type === "doughnut") {
        const ds = c.data.datasets?.[0];
        if (ds) ds.backgroundColor = THEME.doughnut; // Actualiza paleta del doughnut
        c.options.plugins.legend.labels.color = THEME.legend; // Reaplica color de leyenda
      }
      c.update("none"); // Actualiza sin animación
    } catch {}
  }
}

/* Crea gráfico de barras y lo registra por clave para futuras actualizaciones */
export function makeBarChart(
  ctx,
  labels,
  data,
  { label, valueFmt, maxLabelLen = 16, key, showLegend = false }
) {
  safeDestroy(key); // Evita fugas destruyendo instancia anterior
  charts[key] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: THEME.series.primary, // Color de relleno de barras
          borderColor: THEME.series.primaryB, // Color de borde de barras
          borderWidth: 1.5, // Grosor de borde de barras
          borderRadius: 8, // Bordes redondeados en barras
        },
      ],
    },
    options: {
      layout: { padding: { top: 6, right: 10, left: 10, bottom: 4 } }, // Margen interno del canvas
      scales: {
        x: {
          ticks: {
            color: THEME.tick, // Color de ticks X
            autoSkip: true, // Salta etiquetas si son muchas
            maxTicksLimit: 8, // Máximo de etiquetas visibles
            callback: (_, i) => shorten(labels[i], maxLabelLen), // Acorta etiquetas largas
          },
          grid: { color: THEME.grid }, // Color de grilla X
        },
        y: {
          ticks: { color: THEME.tick, callback: (v) => valueFmt(v) }, // Formatea valores Y
          grid: { color: THEME.grid }, // Color de grilla Y
          beginAtZero: true, // Inicia eje Y en 0
        },
      },
      plugins: {
        title: { display: false }, // Título se maneja fuera en la card
        legend: {
          display: showLegend,
          position: "top",
          labels: { color: THEME.legend, padding: 12 },
        }, // Leyenda opcional
        tooltip: {
          mode: "index", // Tooltip por categoría
          intersect: false, // No requiere intersección exacta
          callbacks: { label: (ctx) => `${label}: ${valueFmt(ctx.parsed.y)}` }, // Formatea tooltip con valueFmt
        },
      },
      datasets: { bar: { barPercentage: 0.7, categoryPercentage: 0.7 } }, // Ancho relativo de barras
    },
  });
  return charts[key];
}

/* Crea gráfico de línea con área y lo registra por clave para futuras actualizaciones */
export function makeLineChart(
  ctx,
  labels,
  data,
  label,
  { valueFmt, maxLabelLen = 7, key, showLegend = false }
) {
  safeDestroy(key); // Evita fugas destruyendo instancia anterior
  charts[key] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: THEME.series.primaryB, // Color de línea
          backgroundColor: THEME.series.alt, // Color del área bajo la curva
          tension: 0.25, // Suaviza curvas (0 recto)
          borderWidth: 2, // Grosor de línea
          pointRadius: 3, // Radio de puntos
          pointHoverRadius: 4, // Radio de puntos en hover
        },
      ],
    },
    options: {
      layout: { padding: { top: 6, right: 10, left: 10, bottom: 4 } }, // Margen interno del canvas
      scales: {
        x: {
          ticks: {
            color: THEME.tick, // Color de ticks X
            autoSkip: true, // Salta etiquetas si son muchas
            maxTicksLimit: 12, // Máximo de etiquetas visibles
            callback: (_, i) => shorten(labels[i], maxLabelLen), // Acorta etiquetas (YYYY-MM / YYYY-Qn)
          },
          grid: { color: THEME.grid }, // Color de grilla X
        },
        y: {
          ticks: { color: THEME.tick, callback: (v) => valueFmt(v) }, // Formatea valores Y (p.ej., USD)
          grid: { color: THEME.grid }, // Color de grilla Y
          beginAtZero: true, // Inicia eje Y en 0
        },
      },
      plugins: {
        title: { display: false }, // Título se maneja en la card
        legend: {
          display: showLegend,
          position: "top",
          labels: { color: THEME.legend, padding: 12 },
        }, // Leyenda opcional
        tooltip: {
          mode: "index", // Tooltip por categoría
          intersect: false, // No requiere intersección exacta
          callbacks: { label: (ctx) => `${label}: ${valueFmt(ctx.parsed.y)}` }, // Formatea tooltip con valueFmt
        },
      },
    },
  });
  return charts[key];
}

/* Crea gráfico doughnut (torta hueca) y lo registra por clave para futuras actualizaciones */
export function makeDoughnutChart(
  ctx,
  labels,
  data,
  label,
  { key, showLegend = true }
) {
  safeDestroy(key); // Evita fugas destruyendo instancia anterior
  charts[key] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: THEME.doughnut, // Aplica paleta circular
        },
      ],
    },
    options: {
      cutout: "60%", // Grosor del anillo (percent de radio)
      layout: { padding: { top: 6, right: 10, bottom: 8, left: 10 } }, // Margen interno del canvas
      plugins: {
        title: { display: false }, // Título se maneja en la card
        legend: {
          display: showLegend, // Muestra/oculta leyenda
          position: "bottom", // Ubica leyenda debajo
          labels: {
            color: THEME.legend, // Color de texto de la leyenda
            padding: 12, // Espaciado entre ítems
            font: { size: 15, weight: "700" }, // Tamaño/peso de fuente de leyenda
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.label}: ${
                ctx.parsed?.toLocaleString?.("es-CL") ?? ctx.parsed
              }`,
          }, // Tooltip con miles es-CL
        },
      },
    },
  });
  return charts[key];
}
