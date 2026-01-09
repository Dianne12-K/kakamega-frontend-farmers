<script setup>
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

const props = defineProps({
  farm: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const weatherData = ref([])
const loading = ref(false)

// Mock weather data (replace with actual API call)
const fetchWeather = async () => {
  loading.value = true
  // Simulate API call
  setTimeout(() => {
    weatherData.value = [
      { date: 'Today', temp: 24, humidity: 65, rain_prob: 20, rain_mm: 0, conditions: 'Partly Cloudy', icon: 'pi-cloud' },
      { date: 'Tomorrow', temp: 26, humidity: 70, rain_prob: 40, rain_mm: 2, conditions: 'Light Rain', icon: 'pi-cloud' },
      { date: 'Wed', temp: 23, humidity: 75, rain_prob: 60, rain_mm: 8, conditions: 'Rain', icon: 'pi-cloud' },
      { date: 'Thu', temp: 25, humidity: 68, rain_prob: 30, rain_mm: 1, conditions: 'Partly Cloudy', icon: 'pi-cloud' },
      { date: 'Fri', temp: 27, humidity: 60, rain_prob: 10, rain_mm: 0, conditions: 'Sunny', icon: 'pi-sun' },
      { date: 'Sat', temp: 28, humidity: 55, rain_prob: 5, rain_mm: 0, conditions: 'Sunny', icon: 'pi-sun' },
      { date: 'Sun', temp: 26, humidity: 62, rain_prob: 15, rain_mm: 0, conditions: 'Partly Cloudy', icon: 'pi-cloud' }
    ]
    loading.value = false
  }, 500)
}

const getRainProbColor = (prob) => {
  if (prob >= 60) return 'text-blue-600'
  if (prob >= 30) return 'text-orange-600'
  return 'text-gray-600'
}

const getWeatherIcon = (conditions) => {
  if (conditions.includes('Rain')) return 'pi-cloud text-blue-500'
  if (conditions.includes('Sunny')) return 'pi-sun text-yellow-500'
  return 'pi-cloud text-gray-500'
}

const totalRainExpected = computed(() => {
  return weatherData.value.reduce((sum, day) => sum + day.rain_mm, 0).toFixed(1)
})

const avgTemp = computed(() => {
  if (weatherData.value.length === 0) return 0
  const total = weatherData.value.reduce((sum, day) => sum + day.temp, 0)
  return (total / weatherData.value.length).toFixed(1)
})

const avgHumidity = computed(() => {
  if (weatherData.value.length === 0) return 0
  const total = weatherData.value.reduce((sum, day) => sum + day.humidity, 0)
  return Math.round(total / weatherData.value.length)
})

onMounted(() => {
  fetchWeather()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Weather Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card class="bg-gradient-to-br from-yellow-50 to-yellow-100">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Avg Temperature</p>
              <p class="text-3xl font-bold text-orange-600">{{ avgTemp }}°C</p>
            </div>
            <i class="pi pi-sun text-4xl text-yellow-400"></i>
          </div>
        </template>
      </Card>

      <Card class="bg-gradient-to-br from-blue-50 to-blue-100">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Rain Expected</p>
              <p class="text-3xl font-bold text-blue-600">{{ totalRainExpected }}mm</p>
            </div>
            <i class="pi pi-cloud text-4xl text-blue-400"></i>
          </div>
        </template>
      </Card>

      <Card class="bg-gradient-to-br from-green-50 to-green-100">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Avg Humidity</p>
              <p class="text-3xl font-bold text-green-600">{{ avgHumidity }}%</p>
            </div>
            <i class="pi pi-percentage text-4xl text-green-400"></i>
          </div>
        </template>
      </Card>
    </div>

    <!-- 7-Day Forecast -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800">7-Day Forecast</h3>
          <Button
              icon="pi pi-refresh"
              rounded
              text
              @click="fetchWeather"
              :loading="loading"
          />
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-7 gap-3">
          <div
              v-for="day in weatherData"
              :key="day.date"
              class="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <p class="text-sm font-semibold text-gray-800 text-center mb-3">
              {{ day.date }}
            </p>

            <div class="flex justify-center mb-3">
              <i :class="['pi text-4xl', getWeatherIcon(day.conditions)]"></i>
            </div>

            <p class="text-2xl font-bold text-gray-800 text-center mb-2">
              {{ day.temp }}°C
            </p>

            <div class="space-y-2 text-xs text-gray-600">
              <div class="flex items-center justify-between">
                <span>Humidity</span>
                <span class="font-semibold">{{ day.humidity }}%</span>
              </div>

              <div class="flex items-center justify-between">
                <span>Rain</span>
                <span :class="['font-semibold', getRainProbColor(day.rain_prob)]">
                  {{ day.rain_prob }}%
                </span>
              </div>

              <div v-if="day.rain_mm > 0" class="flex items-center justify-between">
                <span>Amount</span>
                <span class="font-semibold text-blue-600">{{ day.rain_mm }}mm</span>
              </div>
            </div>

            <p class="text-xs text-gray-500 text-center mt-3">
              {{ day.conditions }}
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Weather Alerts -->
    <Card class="border-l-4 border-yellow-500 bg-yellow-50">
      <template #content>
        <div class="flex items-start gap-4">
          <i class="pi pi-info-circle text-3xl text-yellow-600"></i>
          <div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Weather Advisory</h3>
            <p class="text-gray-700 mb-2">
              Moderate rain expected on Wednesday (8mm). Consider:
            </p>
            <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Postpone fertilizer application until after the rain</li>
              <li>Delay irrigation until soil moisture levels are assessed</li>
              <li>Check drainage systems are clear</li>
            </ul>
          </div>
        </div>
      </template>
    </Card>

    <!-- Location Info -->
    <Card>
      <template #title>
        <h3 class="text-lg font-bold text-gray-800">Location Details</h3>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Coordinates</p>
            <p class="font-semibold text-gray-800">
              {{ farm.latitude?.toFixed(4) }}, {{ farm.longitude?.toFixed(4) }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Elevation</p>
            <p class="font-semibold text-gray-800">~1,500m above sea level</p>
          </div>
        </div>

        <p class="text-xs text-gray-500 mt-4">
          Weather data provided by meteorological services for the Kakamega region
        </p>
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-card) {
  height: 100%;
}
</style>