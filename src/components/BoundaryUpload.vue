<script setup>
import { ref } from 'vue'
import Button  from 'primevue/button'
import Tag     from 'primevue/tag'

const emit = defineEmits(['uploaded'])

const isDragging  = ref(false)
const uploading   = ref(false)
const result      = ref(null)
const error       = ref(null)
const fileInput   = ref(null)

const ACCEPTED = '.geojson,.json,.zip,.kml,.gpx,.csv'

const FORMAT_INFO = [
  { ext: 'GeoJSON',   desc: 'Standard web mapping format',     icon: 'pi-globe'    },
  { ext: 'SHP (ZIP)', desc: 'Zip containing .shp .dbf .prj',   icon: 'pi-database' },
  { ext: 'KML',       desc: 'Google Earth format',             icon: 'pi-map'      },
  { ext: 'GPX',       desc: 'GPS track/route → polygon hull',  icon: 'pi-compass'  },
  { ext: 'CSV+WKT',   desc: 'CSV with a geometry/wkt column',  icon: 'pi-table'    },
]

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) uploadFile(file)
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) uploadFile(file)
}

async function uploadFile(file) {
  error.value  = null
  result.value = null
  uploading.value = true

  try {
    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/boundaries/upload', {
      method: 'POST',
      body:   form,
    })
    const data = await res.json()

    if (!data.success) {
      error.value = data.error
    } else {
      result.value = data
      emit('uploaded', data.summary)
    }
  } catch (e) {
    error.value = 'Upload failed: ' + e.message
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-4">

    <!-- Drop zone -->
    <div
        class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
        :class="isDragging
        ? 'border-blue-400 bg-blue-50'
        : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="fileInput.click()"
    >
      <input
          ref="fileInput"
          type="file"
          :accept="ACCEPTED"
          class="hidden"
          @change="onFileChange"
      />

      <div v-if="uploading" class="flex flex-col items-center gap-3">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
        <p class="text-sm font-medium text-gray-600">Processing file...</p>
      </div>

      <div v-else class="flex flex-col items-center gap-3">
        <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
          <i class="pi pi-upload text-2xl text-blue-600"></i>
        </div>
        <div>
          <p class="font-semibold text-gray-800">
            Drop your boundary file here
          </p>
          <p class="text-sm text-gray-400 mt-1">or click to browse</p>
        </div>
      </div>
    </div>

    <!-- Supported formats -->
    <div class="grid grid-cols-1 gap-2">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Supported Formats
      </p>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div
            v-for="fmt in FORMAT_INFO"
            :key="fmt.ext"
            class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
        >
          <i :class="`pi ${fmt.icon} text-blue-500 text-sm flex-shrink-0`"></i>
          <div class="min-w-0">
            <p class="text-xs font-bold text-gray-700">{{ fmt.ext }}</p>
            <p class="text-xs text-gray-400 truncate">{{ fmt.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Success result -->
    <div v-if="result" class="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-check-circle text-green-600 text-lg"></i>
        <p class="font-semibold text-green-800 text-sm">Upload Successful</p>
      </div>
      <p class="text-sm text-green-700">{{ result.message }}</p>

      <div class="grid grid-cols-3 gap-3">
        <div class="text-center bg-white rounded-lg p-2 border border-green-200">
          <p class="text-xl font-extrabold text-green-700">
            {{ result.summary.updated.length }}
          </p>
          <p class="text-xs text-gray-500">Updated</p>
        </div>
        <div class="text-center bg-white rounded-lg p-2 border border-green-200">
          <p class="text-xl font-extrabold text-blue-600">
            {{ result.summary.created.length }}
          </p>
          <p class="text-xs text-gray-500">Created</p>
        </div>
        <div class="text-center bg-white rounded-lg p-2 border border-green-200">
          <p class="text-xl font-extrabold text-amber-600">
            {{ result.summary.skipped.length }}
          </p>
          <p class="text-xs text-gray-500">Skipped</p>
        </div>
      </div>

      <!-- Skipped details -->
      <div v-if="result.summary.skipped.length" class="space-y-1">
        <p class="text-xs font-semibold text-amber-700">Skipped features:</p>
        <div
            v-for="s in result.summary.skipped"
            :key="s.name"
            class="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1"
        >
          {{ s.name }} — {{ s.reason }}
        </div>
      </div>

      <Button
          label="Upload Another File"
          icon="pi pi-refresh"
          text size="small"
          class="w-full mt-1"
          @click="result = null; fileInput.click()"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4">
      <div class="flex items-start gap-2">
        <i class="pi pi-exclamation-circle text-red-500 mt-0.5 flex-shrink-0"></i>
        <div>
          <p class="text-sm font-semibold text-red-700">Upload Failed</p>
          <p class="text-xs text-red-600 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Matching tip -->
    <div class="rounded-lg bg-blue-50 border border-blue-100 p-3">
      <p class="text-xs font-semibold text-blue-700 mb-1">Matching Strategy</p>
      <ul class="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
        <li>Features with a <strong>farm_id</strong> property match by ID</li>
        <li>Features with a <strong>name</strong> property match by farm name</li>
        <li>Unmatched features create a new farm record automatically</li>
      </ul>
    </div>

  </div>
</template>