<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import { useFarmsStore } from '@/stores/farms'

import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import OverlayPanel from 'primevue/overlaypanel'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const alertsStore = useAlertsStore()
const farmsStore = useFarmsStore()

const notificationPanel = ref()

const menuItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Farms',
    icon: 'pi pi-map',
    command: () => router.push('/farms')
  },
  {
    label: 'Health',
    icon: 'pi pi-map',
    command: () => router.push('/health')
  },
  {
    label: 'Alerts',
    icon: 'pi pi-exclamation-triangle',
    badge: alertsStore.unreadCount,
    command: () => router.push('/alerts')
  },
  {
    label: 'Reports',
    icon: 'pi pi-chart-bar',
    command: () => router.push('/reports')
  }
])

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleNotifications = (event) => {
  notificationPanel.value.toggle(event)
}

onMounted(async () => {
  await farmsStore.fetchFarms()
  alertsStore.generateAlerts(farmsStore.farms)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Toast />

    <!-- Top Navigation -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Logo and Title -->
          <div class="flex items-center space-x-4">
            <i class="pi pi-chart-line text-3xl text-primary"></i>
            <div>
              <h1 class="text-xl font-bold text-gray-800">Kakamega Smart Farming</h1>
              <p class="text-sm text-gray-500">{{ authStore.user?.region || 'County Dashboard' }}</p>
            </div>
          </div>

          <!-- Right Side Actions -->
          <div class="flex items-center space-x-4">
            <!-- Refresh Button -->
            <Button
                icon="pi pi-refresh"
                rounded
                text
                severity="secondary"
                @click="farmsStore.fetchFarms()"
                :loading="farmsStore.loading"
            />

            <!-- Notifications -->
            <div class="relative">
              <Button
                  icon="pi pi-bell"
                  rounded
                  text
                  severity="secondary"
                  @click="toggleNotifications"
              >
                <Badge
                    v-if="alertsStore.unreadCount > 0"
                    :value="alertsStore.unreadCount"
                    severity="danger"
                    class="absolute -top-1 -right-1"
                />
              </Button>

              <OverlayPanel ref="notificationPanel" style="width: 400px">
                <div class="p-3">
                  <h3 class="text-lg font-semibold mb-3">Notifications</h3>

                  <div v-if="alertsStore.criticalAlerts.length === 0" class="text-center py-4 text-gray-500">
                    No new notifications
                  </div>

                  <div v-else class="space-y-2">
                    <div
                        v-for="alert in alertsStore.criticalAlerts.slice(0, 5)"
                        :key="alert.id"
                        class="p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100"
                        @click="router.push(`/farms/${alert.farmId}`)"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <p class="font-medium text-sm text-red-900">{{ alert.title }}</p>
                          <p class="text-xs text-red-700 mt-1">{{ alert.message }}</p>
                        </div>
                        <i class="pi pi-times text-red-600 cursor-pointer" @click.stop="alertsStore.markAsRead(alert.id)"></i>
                      </div>
                    </div>

                    <Button
                        label="View All Alerts"
                        text
                        class="w-full mt-2"
                        @click="router.push('/alerts')"
                    />
                  </div>
                </div>
              </OverlayPanel>
            </div>

            <!-- User Menu -->
            <div class="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <Avatar
                  :label="authStore.user?.name?.charAt(0) || 'U'"
                  shape="circle"
                  class="bg-primary text-white"
              />
              <div class="hidden md:block">
                <p class="text-sm font-medium text-gray-900">{{ authStore.user?.name }}</p>
                <p class="text-xs text-gray-500">{{ authStore.user?.role }}</p>
              </div>
              <Button
                  icon="pi pi-sign-out"
                  rounded
                  text
                  severity="danger"
                  @click="handleLogout"
                  v-tooltip.bottom="'Logout'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Menu -->
      <Menubar :model="menuItems" class="border-none rounded-none bg-gray-50">
        <template #end>
          <Button
              icon="pi pi-cog"
              rounded
              text
              @click="router.push('/settings')"
              v-tooltip.bottom="'Settings'"
          />
        </template>
      </Menubar>
    </div>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>