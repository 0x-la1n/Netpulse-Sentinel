import { absoluteTime } from '../../lib/time';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function exportReportCsv({ preset, timeFilter, reportRows, reportTitle }) {
  const lines = [];
  lines.push(['Reporte', reportTitle].map(csvEscape).join(','));
  lines.push(['Generado', new Date().toISOString()].map(csvEscape).join(','));
  lines.push('');

  if (preset === 'critical') {
    lines.push(['Fecha', 'Servicio', 'Target ID', 'Tipo', 'Estado', 'Latencia', 'Mensaje'].map(csvEscape).join(','));
    reportRows.forEach((row) => {
      lines.push([
        row.timestamp,
        row.name,
        row.target,
        row.type,
        row.status,
        row.latency,
        row.message,
      ].map(csvEscape).join(','));
    });
  } else {
    lines.push(['Servicio', 'Objetivo', 'Tipo', 'Estado', 'Prioridad', 'Uptime', 'Latencia'].map(csvEscape).join(','));
    reportRows.forEach((row) => {
      lines.push([
        row.name,
        row.target,
        row.type,
        row.status,
        row.priority,
        row.uptime,
        row.latency,
      ].map(csvEscape).join(','));
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-${preset}-${timeFilter.toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printReportPdf({ preset, reportRows, reportTitle, summary, formatPercent }) {
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) return;

  const rowsHtml = preset === 'critical'
    ? reportRows.map((row) => `
        <tr>
          <td>${escapeHtml(absoluteTime(row.timestamp, false))}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.latency)}</td>
          <td>${escapeHtml(row.message)}</td>
        </tr>
      `).join('')
    : reportRows.map((row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.target)}</td>
          <td>${escapeHtml(row.type)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.priority)}</td>
          <td>${escapeHtml(row.uptime)}</td>
          <td>${escapeHtml(row.latency)}</td>
        </tr>
      `).join('');

  const columnsHtml = preset === 'critical'
    ? '<th>Fecha</th><th>Servicio</th><th>Estado</th><th>Latencia</th><th>Mensaje</th>'
    : '<th>Servicio</th><th>Objetivo</th><th>Tipo</th><th>Estado</th><th>Prioridad</th><th>Uptime</th><th>Latencia</th>';

  const metricsHtml = `
    <div class="grid">
      <div class="metric"><span>Total servicios</span><strong>${summary.totalServices}</strong></div>
      <div class="metric"><span>Servicios UP</span><strong>${summary.upServices}</strong></div>
      <div class="metric"><span>Servicios DOWN</span><strong>${summary.downServices}</strong></div>
      <div class="metric"><span>Uptime medio</span><strong>${formatPercent(summary.avgUptime)}</strong></div>
      <div class="metric"><span>Latencia media</span><strong>${summary.avgLatency ? `${Math.round(summary.avgLatency)} ms` : 'N/A'}</strong></div>
      <div class="metric"><span>Alertas criticas</span><strong>${summary.criticalEvents}</strong></div>
    </div>
  `;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(reportTitle)}</title>
        <style>
          :root { color-scheme: dark; }
          body { margin: 0; padding: 32px; background: #0f172a; color: #e2e8f0; font-family: Inter, Arial, sans-serif; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          p { margin: 0; color: #94a3b8; }
          .panel { margin-top: 20px; padding: 20px; border: 1px solid #334155; border-radius: 16px; background: #111827; }
          .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
          .metric { padding: 14px; border-radius: 12px; border: 1px solid #334155; background: #0f172a; }
          .metric span { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: #94a3b8; }
          .metric strong { display: block; margin-top: 8px; font-size: 20px; color: #f8fafc; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border-bottom: 1px solid #334155; padding: 10px 8px; text-align: left; font-size: 12px; vertical-align: top; }
          th { color: #cbd5e1; text-transform: uppercase; letter-spacing: .08em; font-size: 10px; }
          tr:nth-child(even) td { background: rgba(15, 23, 42, 0.6); }
          .footer { margin-top: 18px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reportTitle)}</h1>
        <p>Generado el ${escapeHtml(new Date().toLocaleString('es-ES'))}</p>
        <div class="panel">
          ${metricsHtml}
          <table>
            <thead><tr>${columnsHtml}</tr></thead>
            <tbody>${rowsHtml || '<tr><td colspan="7">Sin datos disponibles</td></tr>'}</tbody>
          </table>
          <div class="footer">Usa la opcion de impresion del navegador para guardar este reporte como PDF.</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
}
