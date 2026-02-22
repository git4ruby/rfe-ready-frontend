<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps({
  data: { type: Object, required: true },
  color: { type: String, default: '#6366f1' },
})

const chartData = computed(() => {
  const sorted = Object.entries(props.data).sort(([a], [b]) => a.localeCompare(b))
  return {
    labels: sorted.map(([date]) => {
      const d = new Date(date + 'T00:00:00')
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [{
      data: sorted.map(([, count]) => count),
      borderColor: props.color,
      backgroundColor: props.color + '20',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  }
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, maxTicksLimit: 8 } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, precision: 0 }, beginAtZero: true },
  },
}
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="options" />
  </div>
</template>
