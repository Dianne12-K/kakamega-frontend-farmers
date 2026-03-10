<script setup>
import { useMapStyles } from '@/composables/useMapStyles'
const { getHealthClass } = useMapStyles()

defineProps({
  farm: { type: Object, default: null }
})
const emit = defineEmits(['close', 'view'])
</script>

<template>
  <div v-if="farm" class="popup-box">
    <button class="popup-close" @click="emit('close')">
      <i class="pi pi-times text-xs"></i>
    </button>

    <h3 class="font-bold text-base text-gray-900 mb-3 pr-5">{{ farm.name }}</h3>

    <div class="space-y-2 text-sm mb-3">
      <div class="flex justify-between">
        <span class="text-gray-500">Owner</span>
        <span class="font-semibold">{{ farm.owner ?? '—' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Crop</span>
        <span class="font-semibold capitalize">{{ farm.crop_type ?? '—' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Area</span>
        <span class="font-semibold">{{ farm.area_ha?.toFixed(1) ?? '—' }} ha</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-500">Health</span>
        <span
            class="px-2 py-0.5 rounded-full text-xs font-semibold"
            :class="getHealthClass(farm.current_health?.score ?? 0)"
        >
          {{ farm.current_health?.score ?? 0 }}/100
        </span>
      </div>
    </div>

    <button
        class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        @click="emit('view', farm.id)"
    >
      View Details →
    </button>
  </div>
</template>

<style scoped>
.popup-box {
  background: white;
  border-radius: 12px;
  padding: 14px;
  min-width: 240px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  position: relative;
}
.popup-close {
  position: absolute; top: 10px; right: 10px;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: none;
  background: #f3f4f6; cursor: pointer;
  transition: background 0.15s;
}
.popup-close:hover { background: #e5e7eb; }
</style>