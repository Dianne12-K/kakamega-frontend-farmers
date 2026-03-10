<script setup>
import { ref } from 'vue'
import { BASEMAPS } from '@/composables/useMapBasemaps'

const props  = defineProps({ modelValue: { type: String, default: 'osm' } })
const emit   = defineEmits(['update:modelValue'])
const open   = ref(false)

const current = () => BASEMAPS.find(b => b.id === props.modelValue) ?? BASEMAPS[0]

function select(id) {
  emit('update:modelValue', id)
  open.value = false
}
</script>

<template>
  <div class="basemap-switcher">
    <!-- Toggle button -->
    <button
        class="basemap-btn"
        @click="open = !open"
        title="Switch basemap"
    >
      <span class="text-lg">{{ current().icon }}</span>
      <span class="text-xs font-semibold hidden sm:inline">{{ current().label }}</span>
      <i class="pi pi-chevron-up text-xs" :class="{ 'rotate-180': open }"></i>
    </button>

    <!-- Panel -->
    <transition name="slide-up">
      <div v-if="open" class="basemap-panel">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">Basemap</p>
        <button
            v-for="b in BASEMAPS"
            :key="b.id"
            class="basemap-option"
            :class="{ 'basemap-option--active': modelValue === b.id }"
            @click="select(b.id)"
        >
          <span class="text-lg">{{ b.icon }}</span>
          <span class="text-xs font-medium">{{ b.label }}</span>
          <i v-if="modelValue === b.id" class="pi pi-check text-primary ml-auto text-xs"></i>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.basemap-switcher { position: relative; }

.basemap-btn {
  display: flex; align-items: center; gap: 6px;
  background: white; border: 1px solid #e5e7eb;
  border-radius: 8px; padding: 6px 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  cursor: pointer; transition: box-shadow 0.2s;
}
.basemap-btn:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.18); }

.basemap-panel {
  position: absolute; bottom: calc(100% + 8px); left: 0;
  background: white; border: 1px solid #e5e7eb;
  border-radius: 12px; padding: 10px 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 180px; z-index: 2000;
}

.basemap-option {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 8px; border-radius: 8px;
  border: none; background: transparent;
  cursor: pointer; transition: background 0.15s;
  text-align: left;
}
.basemap-option:hover           { background: #f3f4f6; }
.basemap-option--active         { background: #eff6ff; }

.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from,
.slide-up-leave-to    { opacity: 0; transform: translateY(6px); }
</style>