<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps({
  data: { type: Object, required: true },
  color: { type: String, default: '#6366f1' },
  horizontal: { type: Boolean, default: false },
})

const chartData = computed(() => ({
  labels: Object.keys(props.data),
  datasets: [{
    data: Object.values(props.data),
    backgroundColor: props.color,
    borderRadius: 6,
    maxBarThickness: 40,
  }],
}))

const options = computed(() => ({
  indexAxis: props.horizontal ? 'y' : 'x',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { display: !props.horizontal }, ticks: { font: { size: 11 } } },
    y: { grid: { display: props.horizontal }, ticks: { font: { size: 11 }, precision: 0 } },
  },
}))
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
