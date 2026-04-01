<script setup>
import { ref, onMounted } from 'vue'
import { useLayersStore } from '@/stores/layers'

import Button     from 'primevue/button'
import InputText  from 'primevue/inputtext'
import Drawer     from 'primevue/drawer'
import Divider    from 'primevue/divider'
import Tag        from 'primevue/tag'
import Skeleton   from 'primevue/skeleton'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'layers-changed'])

const layersStore = useLayersStore()

const showUpload    = ref(false)
const uploading     = ref(false)
const uploadError   = ref(null)
const uploadResult  = ref(null)
const fileInput     = ref(null)
const selectedFile  = ref(null)

const form = ref({
  name:        '',
  color:       '#3b82f6',
  description: '',
})

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

function onFileChange(e) {
  selectedFile.value = e.target.files[0] || null
  if (selectedFile.value && !form.value.name) {
    form.value.name = selectedFile.value.name.replace(/\.[^.]+$/, '')
  }
}

async function submitUpload() {
  if (!selectedFile.value || !form.value.name.trim()) return
  uploadError.value  = null
  uploadResult.value = null
  uploading.value    = true
  try {
    const fd = new FormData()
    fd.append('file',        selectedFile.value)
    fd.append('name',        form.value.name.trim())
    fd.append('color',       form.value.color)
    fd.append('description', form.value.description.trim())
    const res = await layersStore.uploadLayer(fd)
    uploadResult.value = res
    emit('layers-changed')
    form.value  = { name: '', color: '#3b82f6', description: '' }
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    uploadError.value = e.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

async function handleDelete(layer) {
  if (!confirm(`Delete layer "${layer.name}" and all ${layer.farm_count} farm(s) in it?`)) return
  await layersStore.deleteLayer(layer.id)
  emit('layers-changed')
}

onMounted(() => layersStore.fetchLayers())
</script>

<template>
  <Drawer
      :visible="visible"
      @update:visible="emit('update:visible', $event)"
      position="left"
      :style="{ width: '320px' }"
      :modal="false"
      :dismissable="true"
      header="Map Layers"
  >
    <div class="flex flex-col h-full gap-4 pt-1">

      <!-- Layer list -->
      <div class="flex-1 overflow-y-auto space-y-2 min-h-0">

        <div v-if="layersStore.loading" class="space-y-3">
          <Skeleton v-for="i in 3" :key="i" height="64px" border-radius="10px" />
        </div>

        <div
            v-else-if="!layersStore.layers.length"
            class="text-center py-12 text-gray-400"
        >
          <i class="pi pi-layers text-4xl block mb-3"></i>
          <p class="text-sm">No layers yet.</p>
          <p class="text-xs mt-1">Upload a boundary file to create your first layer.</p>
        </div>

        <div
            v-for="layer in layersStore.layers"
            :key="layer.id"
            class="rounded-xl border p-3 transition-all"
            :class="layer.visible
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50 opacity-60'"
        >
          <div class="flex items-center gap-3">
            <!-- Color swatch + visibility toggle -->
            <button
                class="w-10 h-10 rounded-lg flex-shrink-0 border-2 transition-all"
                :style="{ backgroundColor: layer.color,
                                      borderColor: layer.visible ? layer.color : '#d1d5db' }"
                :title="layer.visible ? 'Click to hide layer' : 'Click to show layer'"
                @click="layersStore.toggleVisible(layer.id); emit('layers-changed')"
            >
              <i
                  class="pi text-white text-sm"
                  :class="layer.visible ? 'pi-eye' : 'pi-eye-slash'"
              ></i>
            </button>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-800 truncate">
                {{ layer.name }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ layer.farm_count }} parcel{{ layer.farm_count !== 1 ? 's' : '' }}
              </p>
            </div>

            <button
                class="w-7 h-7 rounded-lg flex items-center justify-center
                                   text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete layer"
                @click="handleDelete(layer)"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>

          <p
              v-if="layer.description"
              class="text-xs text-gray-400 mt-2 leading-relaxed pl-1"
          >
            {{ layer.description }}
          </p>
        </div>
      </div>

      <Divider />

      <!-- Upload section -->
      <div class="flex-shrink-0">
        <button
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl
                           border border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100
                           text-blue-700 text-sm font-semibold transition-colors"
            @click="showUpload = !showUpload"
        >
                    <span class="flex items-center gap-2">
                        <i class="pi pi-plus-circle"></i>
                        Add Layer
                    </span>
          <i class="pi text-xs" :class="showUpload ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
        </button>

        <div v-if="showUpload" class="mt-3 space-y-3">

          <!-- File drop -->
          <div
              class="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center
                               cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
              @click="fileInput.click()"
          >
            <input
                ref="fileInput"
                type="file"
                accept=".geojson,.json,.zip,.kml,.gpx,.csv"
                class="hidden"
                @change="onFileChange"
            />
            <i class="pi pi-upload text-2xl text-gray-300 block mb-2"></i>
            <p v-if="selectedFile" class="text-sm font-semibold text-blue-700">
              {{ selectedFile.name }}
            </p>
            <p v-else class="text-xs text-gray-400">
              GeoJSON, Shapefile ZIP, KML, GPX, CSV
            </p>
          </div>

          <!-- Layer name -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 font-medium">Layer Name</label>
            <InputText
                v-model="form.name"
                placeholder="e.g. Lugari Ward Farms"
                size="small"
                class="w-full"
            />
          </div>

          <!-- Description -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 font-medium">Description (optional)</label>
            <InputText
                v-model="form.description"
                placeholder="Brief description"
                size="small"
                class="w-full"
            />
          </div>

          <!-- Color picker -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 font-medium">Layer Color</label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                  v-for="c in PRESET_COLORS"
                  :key="c"
                  class="w-6 h-6 rounded-full border-2 transition-all"
                  :style="{ backgroundColor: c,
                                          borderColor: form.color === c ? '#1e40af' : 'transparent' }"
                  @click="form.color = c"
              />
              <input
                  type="color"
                  v-model="form.color"
                  class="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  title="Custom color"
              />
            </div>
          </div>

          <!-- Submit -->
          <Button
              label="Upload Layer"
              icon="pi pi-upload"
              class="w-full"
              size="small"
              :loading="uploading"
              :disabled="!selectedFile || !form.name.trim()"
              @click="submitUpload"
          />

          <!-- Result -->
          <div v-if="uploadResult" class="rounded-xl bg-green-50 border border-green-200 p-3">
            <p class="text-xs font-semibold text-green-700">
              <i class="pi pi-check-circle mr-1"></i>
              {{ uploadResult.message }}
            </p>
          </div>

          <div v-if="uploadError" class="rounded-xl bg-red-50 border border-red-200 p-3">
            <p class="text-xs text-red-600">{{ uploadError }}</p>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>