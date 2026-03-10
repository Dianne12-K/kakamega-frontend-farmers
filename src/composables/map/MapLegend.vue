<script setup>
const LEGEND = [
  { label: 'Excellent (80–100)', color: 'rgba(34,197,94,0.6)' },
  { label: 'Good (60–79)',       color: 'rgba(59,130,246,0.6)' },
  { label: 'Fair (40–59)',       color: 'rgba(245,158,11,0.6)' },
  { label: 'Poor (0–39)',        color: 'rgba(239,68,68,0.6)'  },
]
</script>

<template>
  <div class="legend-box">
    <p class="text-xs font-bold text-gray-700 mb-2">Farm Health</p>
    <div class="space-y-1.5">
      <div v-for="item in LEGEND" :key="item.label" class="flex items-center gap-2">
        <div class="w-3.5 h-3.5 rounded flex-shrink-0" :style="{ background: item.color }"></div>
        <span class="text-xs text-gray-600">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legend-box {
  background: white;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
</style>