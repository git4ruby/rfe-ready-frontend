<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  data: { type: Object, required: true },
  colors: { type: Array, default: () => ['#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#6b7280'] },
})

const chartData = computed(() => ({
  labels: Object.keys(props.data),
  datasets: [{
    data: Object.values(props.data),
    backgroundColor: props.colors.slice(0, Object.keys(props.data).length),
    borderWidth: 0,
    hoverOffset: 6,
  }],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } },
    tooltip: { padding: 10, cornerRadius: 8 },
  },
  cutout: '65%',
}
</script>

<template>
  <div class="h-64">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>
