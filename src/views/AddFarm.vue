<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmsStore } from '@/stores/farms'
import { useLocationsStore } from '@/stores/location'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const farmsStore = useFarmsStore()
const locationsStore = useLocationsStore()

const loading = ref(false)
const error = ref(null)
const success = ref(false)
const validationErrors = ref({})

// Dropdown options
const subCounties = ref([])
const wards = ref([])

const cropTypes = [
  { label: 'Maize', value: 'maize' },
  { label: 'Sugarcane', value: 'sugarcane' },
  { label: 'Beans', value: 'beans' },
  { label: 'Cassava', value: 'cassava' },
  { label: 'Sweet Potato', value: 'sweet_potato' },
  { label: 'Banana', value: 'banana' },
  { label: 'Coffee', value: 'coffee' },
  { label: 'Tea', value: 'tea' },
  { label: 'Vegetables', value: 'vegetables' }
]

const formData = reactive({
  name: '',
  owner: '',
  phone: '',
  subCountyId: null,
  wardId: null,
  location: '',
  cropType: null,
  size: null,
  plantingDate: null,
  latitude: null,
  longitude: null,
  notes: ''
})

// Fetch sub-counties on mount
onMounted(async () => {
  await fetchSubCounties()
})

// Fetch wards when sub-county changes
watch(() => formData.subCountyId, async (newSubCountyId, oldSubCountyId) => {
  console.log('Sub-county changed:', { old: oldSubCountyId, new: newSubCountyId })

  if (newSubCountyId) {
    await fetchWards(newSubCountyId)
  } else {
    wards.value = []
    formData.wardId = null
  }
})

const fetchSubCounties = async () => {
  try {
    const response = await locationsStore.fetchSubCounties()
    console.log('Sub-counties response:', response) // Debug log

    // Handle different response formats
    const data = Array.isArray(response) ? response : response.data || []

    subCounties.value = data.map(sc => ({
      label: sc.name,
      value: sc.id,
      code: sc.code,
      description: sc.description
    }))
  } catch (err) {
    error.value = 'Failed to load sub-counties. Please try again.'
    console.error('Fetch sub-counties error:', err)
  }
}

const fetchWards = async (subCountyId) => {
  formData.wardId = null
  try {
    const response = await locationsStore.fetchWardsBySubCounty(subCountyId)
    console.log('Wards response:', response) // Debug log

    // Handle different response formats
    const data = Array.isArray(response) ? response : response.data || []

    wards.value = data.map(ward => ({
      label: ward.name,
      value: ward.id,
      code: ward.code,
      population: ward.population,
      area_sq_km: ward.area_sq_km
    }))
  } catch (err) {
    error.value = 'Failed to load wards. Please try again.'
    console.error('Fetch wards error:', err)
  }
}

const validateForm = () => {
  validationErrors.value = {}

  if (!formData.name) validationErrors.value.name = true
  if (!formData.owner) validationErrors.value.owner = true
  if (!formData.subCountyId) validationErrors.value.subCountyId = true
  if (!formData.wardId) validationErrors.value.wardId = true
  if (!formData.cropType) validationErrors.value.cropType = true
  if (!formData.size) validationErrors.value.size = true
  if (!formData.plantingDate) validationErrors.value.plantingDate = true

  if (Object.keys(validationErrors.value).length > 0) {
    error.value = 'Please fill in all required fields'
    return false
  }

  if (formData.phone && !/^(\+254|0)[17]\d{8}$/.test(formData.phone)) {
    validationErrors.value.phone = true
    error.value = 'Please enter a valid Kenyan phone number'
    return false
  }

  if (formData.latitude && (formData.latitude < -5 || formData.latitude > 5)) {
    validationErrors.value.latitude = true
    error.value = 'Latitude must be between -5 and 5 for Kakamega region'
    return false
  }

  if (formData.longitude && (formData.longitude < 34 || formData.longitude > 35)) {
    validationErrors.value.longitude = true
    error.value = 'Longitude must be between 34 and 35 for Kakamega region'
    return false
  }

  error.value = null
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  error.value = null

  try {
    await farmsStore.addFarm(formData)
    success.value = true

    setTimeout(() => {
      router.push('/farms')
    }, 1500)
  } catch (err) {
    error.value = err.message || 'Failed to add farm. Please try again.'
    console.error('Error adding farm:', err)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/farms')
}

const getCurrentLocation = () => {
  if ('geolocation' in navigator) {
    loading.value = true
    navigator.geolocation.getCurrentPosition(
        (position) => {
          formData.latitude = position.coords.latitude
          formData.longitude = position.coords.longitude
          loading.value = false
        },
        (err) => {
          error.value = 'Unable to get current location'
          loading.value = false
        }
    )
  } else {
    error.value = 'Geolocation is not supported by your browser'
  }
}
</script>

<template>
  <div class="add-farm-page p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="handleCancel"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Add New Farm</h1>
          <p class="text-gray-600">Register a new farm in the system</p>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <Message v-if="success" severity="success" class="mb-4">
      Farm added successfully! Redirecting...
    </Message>

    <!-- Error Message -->
    <Message v-if="error" severity="error" class="mb-4" @close="error = null">
      {{ error }}
    </Message>

    <!-- Form -->
    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Information -->
        <div class="lg:col-span-2">
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-map-marker text-green-600"></i>
                <span>Farm Information</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Farm Name -->
                <div class="field">
                  <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                    Farm Name <span class="text-red-500">*</span>
                  </label>
                  <InputText
                      id="name"
                      v-model="formData.name"
                      placeholder="e.g., Green Valley Farm"
                      class="w-full"
                      :invalid="validationErrors.name"
                  />
                </div>

                <!-- Owner Name -->
                <div class="field">
                  <label for="owner" class="block text-sm font-semibold text-gray-700 mb-2">
                    Owner Name <span class="text-red-500">*</span>
                  </label>
                  <InputText
                      id="owner"
                      v-model="formData.owner"
                      placeholder="e.g., John Makokha"
                      class="w-full"
                      :invalid="validationErrors.owner"
                  />
                </div>

                <!-- Phone Number -->
                <div class="field">
                  <label for="phone" class="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <InputText
                      id="phone"
                      v-model="formData.phone"
                      placeholder="+254 712 345 678"
                      class="w-full"
                      :invalid="validationErrors.phone"
                  />
                  <small class="text-gray-500">Format: +254 or 07XX</small>
                </div>

                <!-- Sub-County -->
                <div class="field">
                  <label for="subCounty" class="block text-sm font-semibold text-gray-700 mb-2">
                    Sub-County <span class="text-red-500">*</span>
                  </label>
                  <Select
                      id="subCounty"
                      v-model="formData.subCountyId"
                      :options="subCounties"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Sub-County"
                      class="w-full"
                      :loading="locationsStore.loading"
                      :invalid="validationErrors.subCountyId"
                  />
                </div>

                <!-- Ward -->
                <div class="field md:col-span-2">
                  <label for="ward" class="block text-sm font-semibold text-gray-700 mb-2">
                    Ward <span class="text-red-500">*</span>
                  </label>
                  <Select
                      id="ward"
                      v-model="formData.wardId"
                      :options="wards"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Ward"
                      class="w-full"
                      :loading="locationsStore.loading"
                      :disabled="!formData.subCountyId"
                      :invalid="validationErrors.wardId"
                  >
                    <template #option="slotProps">
                      <div class="flex flex-col">
                        <span class="font-semibold">{{ slotProps.option.label }}</span>
                        <small class="text-gray-500">
                          {{ slotProps.option.area_sq_km }} km² • Pop: {{ slotProps.option.population?.toLocaleString() }}
                        </small>
                      </div>
                    </template>
                  </Select>
                  <small v-if="!formData.subCountyId" class="text-gray-500">
                    Please select a sub-county first
                  </small>
                </div>

                <!-- Location Details -->
                <div class="field md:col-span-2">
                  <label for="location" class="block text-sm font-semibold text-gray-700 mb-2">
                    Location Details
                  </label>
                  <InputText
                      id="location"
                      v-model="formData.location"
                      placeholder="e.g., Near Malava Market, Mufutu Village"
                      class="w-full"
                  />
                </div>
              </div>
            </template>
          </Card>

          <!-- Crop Information -->
          <Card class="mt-6">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-sun text-amber-600"></i>
                <span>Crop Information</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Crop Type -->
                <div class="field">
                  <label for="cropType" class="block text-sm font-semibold text-gray-700 mb-2">
                    Crop Type <span class="text-red-500">*</span>
                  </label>
                  <Select
                      id="cropType"
                      v-model="formData.cropType"
                      :options="cropTypes"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Crop"
                      class="w-full"
                      :invalid="validationErrors.cropType"
                  />
                </div>

                <!-- Farm Size -->
                <div class="field">
                  <label for="size" class="block text-sm font-semibold text-gray-700 mb-2">
                    Farm Size (hectares) <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                      id="size"
                      v-model="formData.size"
                      :min="0.1"
                      :max="1000"
                      :minFractionDigits="1"
                      :maxFractionDigits="2"
                      placeholder="e.g., 5.5"
                      class="w-full"
                      :invalid="validationErrors.size"
                  />
                </div>

                <!-- Planting Date -->
                <div class="field">
                  <label for="plantingDate" class="block text-sm font-semibold text-gray-700 mb-2">
                    Planting Date <span class="text-red-500">*</span>
                  </label>
                  <DatePicker
                      id="plantingDate"
                      v-model="formData.plantingDate"
                      dateFormat="dd/mm/yy"
                      placeholder="Select Date"
                      class="w-full"
                      :maxDate="new Date()"
                      :invalid="validationErrors.plantingDate"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Location Coordinates -->
        <div>
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-compass text-blue-600"></i>
                <span>GPS Coordinates</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <Button
                    label="Get Current Location"
                    icon="pi pi-map-marker"
                    class="w-full"
                    outlined
                    :loading="loading"
                    @click="getCurrentLocation"
                />

                <!-- Latitude -->
                <div class="field">
                  <label for="latitude" class="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                  </label>
                  <InputNumber
                      id="latitude"
                      v-model="formData.latitude"
                      :minFractionDigits="6"
                      :maxFractionDigits="6"
                      placeholder="e.g., 0.2833"
                      class="w-full"
                      :invalid="validationErrors.latitude"
                  />
                </div>

                <!-- Longitude -->
                <div class="field">
                  <label for="longitude" class="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                  </label>
                  <InputNumber
                      id="longitude"
                      v-model="formData.longitude"
                      :minFractionDigits="6"
                      :maxFractionDigits="6"
                      placeholder="e.g., 34.7519"
                      class="w-full"
                      :invalid="validationErrors.longitude"
                  />
                </div>

                <small class="text-gray-500 block">
                  GPS coordinates help with precise location tracking and satellite monitoring
                </small>
              </div>
            </template>
          </Card>

          <!-- Additional Notes -->
          <Card class="mt-6">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-file-edit text-purple-600"></i>
                <span>Additional Notes</span>
              </div>
            </template>
            <template #content>
              <Textarea
                  v-model="formData.notes"
                  rows="5"
                  placeholder="Add any additional information about the farm..."
                  class="w-full"
              />
            </template>
          </Card>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end mt-6">
        <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="handleCancel"
            :disabled="loading"
        />
        <Button
            label="Add Farm"
            icon="pi pi-check"
            type="submit"
            :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<style scoped>
.add-farm-page {
  max-width: 1400px;
  margin: 0 auto;
}

.field {
  margin-bottom: 0;
}

:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-datepicker),
:deep(.p-inputnumber-input) {
  width: 100%;
}

:deep(.p-card-title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}
</style>