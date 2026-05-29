document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Agent Dashboard loaded.');

  const btnOptimize = document.getElementById('btn-optimize');
  const inputFactor = document.getElementById('input-factor');

  // Corrected ID to reference the real element in index.html
  const resultElement = document.getElementById('result-coefficient');

  if (btnOptimize) {
    btnOptimize.addEventListener('click', () => {
      const val = parseFloat(inputFactor.value) || 1.0;
      console.log(`Calculating weight coefficient for factor: ${val}`);

      // NOTE: This is a demonstration calculation (input * 1.42) used to
      // exercise the DevTools Monitor and E2E test pipeline. It is not
      // a real neural network or ML-based optimization.
      const computed = (Math.round(val * 1.42 * 100) / 100).toFixed(2);
      resultElement.textContent = computed;

      console.log(`Weight coefficient computed: ${computed}`);
    });
  }

  // Dynamically populate metrics from the orchestration pipeline results
  const metricsGrid = document.getElementById('metrics-grid');
  if (metricsGrid) {
    // These metric cards display "N/A" until the pipeline produces real values.
    // In a production deployment, these values come from the quality audit report.
    const metrics = [
      { label: 'Network Status', value: 'N/A', trend: 'Awaiting pipeline data' },
      { label: 'Token Consumption', value: 'N/A', trend: 'Awaiting pipeline data' },
      { label: 'Visual Checks', value: 'N/A', trend: 'Awaiting pipeline data' },
    ];

    metrics.forEach(({ label, value, trend }) => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = `
        <p class="metric-label">${label}</p>
        <p class="metric-value metric-na">${value}</p>
        <span class="metric-trend-na">${trend}</span>
      `;
      metricsGrid.appendChild(card);
    });
  }
});
