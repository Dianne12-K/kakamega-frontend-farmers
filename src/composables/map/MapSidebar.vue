<script setup>
import { useMapStyles } from '@/composables/useMapStyles'
import Button  from 'primevue/button'
import Drawer  from 'primevue/drawer'
import Tag     from 'primevue/tag'

const { getMarkerColor, getHealthSeverity } = useMapStyles()

const props = defineProps({
  visible:       { type: Boolean, default: false },
  farms:         { type: Array,   default: () => [] },
  selectedFarm:  { type: Object,  default: null },
})

const emit = defineEmits([
  'update:visible',
  'update:selectedFarm',
  'center',
  'view',
])
</script>

<template>
  <Drawer
      :visible="visible"
      @update:visible="emit('update:visible', $event)"
      position="right"
      class="w-full md:w-[400px]"
  >
    <template #header>
      <h2 class="text-xl font-bold text-gray-800">
        {{ selectedFarm ? selectedFarm.name : 'All Farms' }}
      </h2>
    </template>

    <!-- Selected farm panel -->
    <div v-if="selectedFarm" class="mb-4">
      <div class="border border-gray-200 rounded-xl p-4 space-y-3">
        <div>
          <h3 class="text-lg font-bold text-gray-800">{{ selectedFarm.name }}</h3>
          <p class="text-gray-500 text-sm">{{ selectedFarm.owner }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-xs text-gray-500">Health</span>
            <div class="mt-1">
              <Tag
                  :value="`${selectedFarm.current_health?.score ?? 0}%`"
                  :severity="getHealthSeverity(selectedFarm.current_health?.score ?? 0)"
              />
            </div>
          </div>
          <div>
            <span class="text-xs text-gray-500">Crop</span>
            <p class="font-medium mt-1">{{ selectedFarm.crop_type ?? 'N/A' }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Area</span>
            <p class="font-medium mt-1">{{ selectedFarm.area_ha?.toFixed(1) }} ha</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Sub-County</span>
            <p class="font-medium mt-1">{{ selectedFarm.subcounty_name ?? '—' }}</p>
          </div>
        </div>
        <div class="flex gap-2 pt-1">
          <Button label="View Details" icon="pi pi-eye"
                  class="flex-1" size="small"
                  @click="emit('view', selectedFarm.id)"
          />
          <Button label="Center" icon="pi pi-map-marker"
                  severity="secondary" outlined size="small"
                  @click="emit('center', selectedFarm)"
          />
        </div>
      </div>
      <Button
          label="Clear Selection" icon="pi pi-times"
          severity="secondary" text class="w-full mt-2" size="small"
          @click="emit('update:selectedFarm', null)"
      />
    </div>

    <!-- Farm list -->
    <div v-else>
      <p class="text-sm font-semibold text-gray-700 mb-3">
        {{ farms.length }} farm{{ farms.length !== 1 ? 's' : '' }}
      </p>

      <div class="space-y-2">
        <div
            v-for="farm in farms"
            :key="farm.id"
            class="flex items-start gap-3 p-3 border border-gray-200 rounded-lg
                 hover:bg-gray-50 cursor-pointer transition-all hover:translate-x-1"
            @click="emit('update:selectedFarm', farm); emit('center', farm)"
        >
          <div
              class="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              :style="{ background: getMarkerColor(farm.current_health?.score ?? 0) }"
          ></div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 truncate text-sm">{{ farm.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ farm.owner }}</p>
            <div class="flex items-center gap-2 mt-1">
              <Tag
                  :value="`${farm.current_health?.score ?? 0}%`"
                  :severity="getHealthSeverity(farm.current_health?.score ?? 0)"
                  size="small"
              />
              <span class="text-xs text-gray-400">{{ farm.crop_type }}</span>
            </div>
          </div>
          <Button icon="pi pi-map-marker" text rounded size="small"
                  @click.stop="emit('center', farm)"
          />
        </div>

        <div v-if="!farms.length" class="text-center py-10 text-gray-400">
          <i class="pi pi-inbox text-4xl mb-3 block"></i>
          <p class="text-sm">No farms found</p>
        </div>
      </div>
    </div>
  </Drawer>
</template>