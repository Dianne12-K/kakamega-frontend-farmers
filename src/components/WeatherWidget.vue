<script setup>
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'

const props = defineProps({
  location: {
    type: String,
    default: 'Kakamega'
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const loading = ref(true)
const error = ref(null)
const weatherData = ref(null)

const currentWeather = computed(() => {
  if (!weatherData.value) return null

  return {
    temp: weatherData.value.current.temp,
    feelsLike: weatherData.value.current.feelsLike,
    condition: weatherData.value.current.condition,
    icon: weatherData.value.current.icon,
    humidity: weatherData.value.current.humidity,
    windSpeed: weatherData.value.current.windSpeed,
    precipitation: weatherData.value.current.precipitation,
    uvIndex: weatherData.value.current.uvIndex
  }
})

const forecast = computed(() => {
  if (!weatherData.value) return []
  return weatherData.value.forecast || []
})

const getWeatherIcon = (condition) => {
  const icons = {
    'Sunny': 'pi-sun',
    'Partly Cloudy': 'pi-cloud',
    'Cloudy': 'pi-cloud',
    'Rainy': 'pi-cloud',
    'Stormy': 'pi-bolt',
    'Clear': 'pi-moon'
  }
  return icons[condition] || 'pi-sun'
}

const getWeatherColor = (condition) => {
  const colors = {
    'Sunny': 'text-yellow-500',
    'Partly Cloudy': 'text-gray-500',
    'Cloudy': 'text-gray-600',
    'Rainy': 'text-blue-500',
    'Stormy': 'text-purple-600',
    'Clear': 'text-indigo-500'
  }
  return colors[condition] || 'text-yellow-500'
}

const getWeatherBg = (condition) => {
  const bgs = {
    'Sunny': 'bg-gradient-to-br from-yellow-50 to-orange-50',
    'Partly Cloudy': 'bg-gradient-to-br from-gray-50 to-blue-50',
    'Cloudy': 'bg-gradient-to-br from-gray-100 to-gray-50',
    'Rainy': 'bg-gradient-to-br from-blue-50 to-cyan-50',
    'Stormy': 'bg-gradient-to-br from-purple-50 to-indigo-50',
    'Clear': 'bg-gradient-to-br from-indigo-50 to-blue-50'
  }
  return bgs[condition] || 'bg-gradient-to-br from-blue-50 to-cyan-50'
}

const getDayName = (dateStr) => {
  const date = new Date(dateStr)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

const fetchWeather = async () => {
  loading.value = true
  error.value = null

  try {
    // Simulate API call - Replace with actual weather API
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock data - Replace with real API response
    weatherData.value = {
      current: {
        temp: 26,
        feelsLike: 28,
        condition: 'Partly Cloudy',
        icon: 'partly-cloudy',
        humidity: 68,
        windSpeed: 12,
        precipitation: 40,
        uvIndex: 7
      },
      forecast: [
        { date: new Date().toISOString(), day: 'Today', temp: 26, condition: 'Partly Cloudy', rain: 40 },
        { date: new Date(Date.now() + 86400000).toISOString(), day: 'Tomorrow', temp: 24, condition: 'Rainy', rain: 80 },
        { date: new Date(Date.now() + 172800000).toISOString(), day: getDayName(new Date(Date.now() + 172800000)), temp: 25, condition: 'Cloudy', rain: 60 },
        { date: new Date(Date.now() + 259200000).toISOString(), day: getDayName(new Date(Date.now() + 259200000)), temp: 27, condition: 'Sunny', rain: 10 },
        { date: new Date(Date.now() + 345600000).toISOString(), day: getDayName(new Date(Date.now() + 345600000)), temp: 28, condition: 'Sunny', rain: 5 },
        { date: new Date(Date.now() + 432000000).toISOString(), day: getDayName(new Date(Date.now() + 432000000)), temp: 26, condition: 'Partly Cloudy', rain: 30 },
        { date: new Date(Date.now() + 518400000).toISOString(), day: getDayName(new Date(Date.now() + 518400000)), temp: 25, condition: 'Rainy', rain: 70 }
      ]
    }
  } catch (err) {
    error.value = 'Failed to load weather data'
    console.error('Weather fetch error:', err)
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  fetchWeather()
}

onMounted(() => {
  fetchWeather()
})
</script>

<template>
  <Card :class="['weather-widget', compact ? 'compact' : '']">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-map-marker text-blue-600"></i>
          <span class="text-lg font-bold">{{ location }} Weather</span>
        </div>
        <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            @click="refresh"
            :loading="loading"
        />
      </div>
    </template>

    <template #content>
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="flex items-center justify-between">
          <Skeleton width="8rem" height="4rem" />
          <Skeleton shape="circle" size="4rem" />
        </div>
        <Skeleton width="100%" height="2rem" class="mb-2" />
        <div class="grid grid-cols-4 gap-2">
          <Skeleton v-for="i in 4" :key="i" height="3rem" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
        <p class="text-gray-600">{{ error }}</p>
        <Button
            label="Try Again"
            icon="pi pi-refresh"
            class="mt-3"
            size="small"
            outlined
            @click="refresh"
        />
      </div>

      <!-- Weather Content -->
      <div v-else class="space-y-4">
        <!-- Current Weather -->
        <div
            :class="[
            'current-weather p-4 rounded-lg',
            getWeatherBg(currentWeather.condition)
          ]"
        >
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm text-gray-700 mb-1">Now</p>
              <p class="text-5xl font-bold text-gray-800">{{ currentWeather.temp }}°C</p>
              <p class="text-sm text-gray-600 mt-1">Feels like {{ currentWeather.feelsLike }}°C</p>
            </div>
            <div class="text-center">
              <i
                  :class="['pi text-6xl', getWeatherIcon(currentWeather.condition), getWeatherColor(currentWeather.condition)]"
              ></i>
              <p class="text-sm font-semibold text-gray-700 mt-2">
                {{ currentWeather.condition }}
              </p>
            </div>
          </div>

          <!-- Weather Details -->
          <div v-if="!compact" class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-300">
            <div class="flex items-center gap-2">
              <i class="pi pi-cloud text-blue-500"></i>
              <div>
                <p class="text-xs text-gray-600">Precipitation</p>
                <p class="text-sm font-semibold text-gray-800">{{ currentWeather.precipitation }}%</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <i class="pi pi-percentage text-cyan-500"></i>
              <div>
                <p class="text-xs text-gray-600">Humidity</p>
                <p class="text-sm font-semibold text-gray-800">{{ currentWeather.humidity }}%</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <i class="pi pi-compass text-green-500"></i>
              <div>
                <p class="text-xs text-gray-600">Wind Speed</p>
                <p class="text-sm font-semibold text-gray-800">{{ currentWeather.windSpeed }} km/h</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <i class="pi pi-sun text-orange-500"></i>
              <div>
                <p class="text-xs text-gray-600">UV Index</p>
                <p class="text-sm font-semibold text-gray-800">{{ currentWeather.uvIndex }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 7-Day Forecast -->
        <div v-if="!compact">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">7-Day Forecast</h3>
          <div class="forecast-grid">
            <div
                v-for="day in forecast"
                :key="day.date"
                class="forecast-item bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition"
            >
              <p class="text-xs font-semibold text-gray-700 mb-2">{{ day.day }}</p>
              <i
                  :class="['pi text-2xl mb-2', getWeatherIcon(day.condition), getWeatherColor(day.condition)]"
              ></i>
              <p class="text-lg font-bold text-gray-800 mb-1">{{ day.temp }}°</p>
              <div class="flex items-center gap-1 justify-center">
                <i class="pi pi-cloud text-blue-500 text-xs"></i>
                <p class="text-xs text-gray-600">{{ day.rain }}%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Compact Forecast (3 days) -->
        <div v-else>
          <div class="flex gap-3">
            <div
                v-for="day in forecast.slice(0, 3)"
                :key="day.date"
                class="flex-1 bg-gray-50 rounded-lg p-2 text-center"
            >
              <p class="text-xs font-semibold text-gray-700 mb-1">{{ day.day }}</p>
              <i
                  :class="['pi text-xl', getWeatherIcon(day.condition), getWeatherColor(day.condition)]"
              ></i>
              <p class="text-sm font-bold text-gray-800 mt-1">{{ day.temp }}°</p>
            </div>
          </div>
        </div>

        <!-- Farming Tip -->
        <div v-if="!compact" class="bg-green-50 border border-green-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <i class="pi pi-lightbulb text-green-600 text-lg mt-0.5"></i>
            <div>
              <p class="text-xs font-semibold text-green-800 mb-1">Farming Tip</p>
              <p class="text-sm text-green-700">
                {{ currentWeather.precipitation > 60
                  ? 'Heavy rain expected. Delay spraying activities and check drainage systems.'
                  : currentWeather.precipitation > 30
                      ? 'Light rain likely. Good time for planting and transplanting.'
                      : 'Dry conditions. Consider irrigation for moisture-sensitive crops.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.weather-widget {
  height: 100%;
}

.current-weather {
  transition: all 0.3s ease;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.2s;
}

.forecast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weather-widget.compact .forecast-grid {
  grid-template-columns: repeat(3, 1fr);
}

:deep(.p-card-title) {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.p-card-content) {
  padding-top: 1rem;
}
</style>