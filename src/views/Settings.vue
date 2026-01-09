<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Divider from 'primevue/divider'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const success = ref(false)
const error = ref(null)

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Luhya', value: 'luy' }
]

const temperatureUnits = [
  { label: 'Celsius (°C)', value: 'celsius' },
  { label: 'Fahrenheit (°F)', value: 'fahrenheit' }
]

const dateFormats = [
  { label: 'DD/MM/YYYY', value: 'dd/mm/yyyy' },
  { label: 'MM/DD/YYYY', value: 'mm/dd/yyyy' },
  { label: 'YYYY-MM-DD', value: 'yyyy-mm-dd' }
]

const regions = [
  { label: 'Malava', value: 'malava' },
  { label: 'Lugari', value: 'lugari' },
  { label: 'Likuyani', value: 'likuyani' },
  { label: 'Mumias', value: 'mumias' },
  { label: 'Matungu', value: 'matungu' },
  { label: 'Butere', value: 'butere' },
  { label: 'Khwisero', value: 'khwisero' }
]

const roles = [
  { label: 'Extension Officer', value: 'extension_officer' },
  { label: 'Farm Manager', value: 'farm_manager' },
  { label: 'Administrator', value: 'admin' }
]

const profileData = reactive({
  name: 'John Doe',
  email: 'john@kakamega.go.ke',
  phone: '+254 757 054 191',
  role: 'extension_officer',
  region: 'malava',
  organization: 'Kakamega County Agriculture'
})

const notificationSettings = reactive({
  emailCritical: true,
  emailHigh: true,
  emailMedium: false,
  smsUrgent: true,
  smsCritical: true,
  dailySummary: true,
  weeklyDigest: false,
  weatherAlerts: true,
  systemUpdates: false
})

const preferences = reactive({
  language: 'en',
  temperature: 'celsius',
  dateFormat: 'dd/mm/yyyy',
  autoRefresh: true,
  soundNotifications: false,
  darkMode: false
})

const securityData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saveProfile = async () => {
  saving.value = true
  error.value = null

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = 'Failed to save profile changes'
  } finally {
    saving.value = false
  }
}

const saveNotifications = async () => {
  saving.value = true
  error.value = null

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = 'Failed to save notification settings'
  } finally {
    saving.value = false
  }
}

const savePreferences = async () => {
  saving.value = true
  error.value = null

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = 'Failed to save preferences'
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
    error.value = 'Please fill in all password fields'
    return
  }

  if (securityData.newPassword !== securityData.confirmPassword) {
    error.value = 'New passwords do not match'
    return
  }

  if (securityData.newPassword.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    return
  }

  saving.value = true
  error.value = null

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    success.value = true
    securityData.currentPassword = ''
    securityData.newPassword = ''
    securityData.confirmPassword = ''
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = 'Failed to change password'
  } finally {
    saving.value = false
  }
}

const clearCache = () => {
  if (confirm('Are you sure you want to clear the cache? This will reload the application.')) {
    localStorage.clear()
    window.location.reload()
  }
}

const exportData = () => {
  alert('Your data export will be sent to your email within 24 hours.')
}

const deleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    alert('Account deletion request submitted. Please check your email for confirmation.')
  }
}
</script>

<template>
  <div class="settings-page p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <i class="pi pi-cog text-3xl text-purple-600"></i>
        <h1 class="text-3xl font-bold text-gray-800">Settings</h1>
      </div>
      <p class="text-gray-600">Manage your account and application preferences</p>
    </div>

    <!-- Success Message -->
    <Message v-if="success" severity="success" class="mb-4" @close="success = false">
      Changes saved successfully!
    </Message>

    <!-- Error Message -->
    <Message v-if="error" severity="error" class="mb-4" @close="error = null">
      {{ error }}
    </Message>

    <!-- Settings Tabs -->
    <Card>
      <template #content>
        <TabView>
          <!-- Profile Tab -->
          <TabPanel header="Profile">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-user"></i>
                <span>Profile</span>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Personal Information -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="field">
                    <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <InputText
                        id="name"
                        v-model="profileData.name"
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <InputText
                        id="email"
                        v-model="profileData.email"
                        type="email"
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="phone" class="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <InputText
                        id="phone"
                        v-model="profileData.phone"
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="role" class="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <Dropdown
                        id="role"
                        v-model="profileData.role"
                        :options="roles"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Work Information -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Work Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="field">
                    <label for="region" class="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Region
                    </label>
                    <Dropdown
                        id="region"
                        v-model="profileData.region"
                        :options="regions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="organization" class="block text-sm font-semibold text-gray-700 mb-2">
                      Organization
                    </label>
                    <InputText
                        id="organization"
                        v-model="profileData.organization"
                        class="w-full"
                    />
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <Button
                    label="Save Changes"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="saveProfile"
                />
              </div>
            </div>
          </TabPanel>

          <!-- Notifications Tab -->
          <TabPanel header="Notifications">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-bell"></i>
                <span>Notifications</span>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Email Notifications -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Email Notifications</h3>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.emailCritical"
                        :binary="true"
                        inputId="emailCritical"
                    />
                    <label for="emailCritical" class="ml-3">
                      <span class="font-semibold">Critical farm alerts</span>
                      <p class="text-sm text-gray-600">Receive emails for critical farm issues</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.emailHigh"
                        :binary="true"
                        inputId="emailHigh"
                    />
                    <label for="emailHigh" class="ml-3">
                      <span class="font-semibold">High priority alerts</span>
                      <p class="text-sm text-gray-600">Receive emails for high priority issues</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.emailMedium"
                        :binary="true"
                        inputId="emailMedium"
                    />
                    <label for="emailMedium" class="ml-3">
                      <span class="font-semibold">Medium priority alerts</span>
                      <p class="text-sm text-gray-600">Receive emails for medium priority issues</p>
                    </label>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- SMS Notifications -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">SMS Notifications</h3>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.smsUrgent"
                        :binary="true"
                        inputId="smsUrgent"
                    />
                    <label for="smsUrgent" class="ml-3">
                      <span class="font-semibold">Urgent issues (SMS)</span>
                      <p class="text-sm text-gray-600">Receive SMS for urgent farm issues</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.smsCritical"
                        :binary="true"
                        inputId="smsCritical"
                    />
                    <label for="smsCritical" class="ml-3">
                      <span class="font-semibold">Critical alerts (SMS)</span>
                      <p class="text-sm text-gray-600">Receive SMS for critical alerts</p>
                    </label>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Report Notifications -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Reports & Digests</h3>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.dailySummary"
                        :binary="true"
                        inputId="dailySummary"
                    />
                    <label for="dailySummary" class="ml-3">
                      <span class="font-semibold">Daily summary report</span>
                      <p class="text-sm text-gray-600">Receive daily email summary of all farms</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.weeklyDigest"
                        :binary="true"
                        inputId="weeklyDigest"
                    />
                    <label for="weeklyDigest" class="ml-3">
                      <span class="font-semibold">Weekly digest</span>
                      <p class="text-sm text-gray-600">Receive weekly performance digest</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.weatherAlerts"
                        :binary="true"
                        inputId="weatherAlerts"
                    />
                    <label for="weatherAlerts" class="ml-3">
                      <span class="font-semibold">Weather alerts</span>
                      <p class="text-sm text-gray-600">Receive severe weather notifications</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="notificationSettings.systemUpdates"
                        :binary="true"
                        inputId="systemUpdates"
                    />
                    <label for="systemUpdates" class="ml-3">
                      <span class="font-semibold">System updates</span>
                      <p class="text-sm text-gray-600">Receive notifications about new features</p>
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <Button
                    label="Save Changes"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="saveNotifications"
                />
              </div>
            </div>
          </TabPanel>

          <!-- Preferences Tab -->
          <TabPanel header="Preferences">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-sliders-h"></i>
                <span>Preferences</span>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Language & Format -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Language & Format</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="field">
                    <label for="language" class="block text-sm font-semibold text-gray-700 mb-2">
                      Language
                    </label>
                    <Dropdown
                        id="language"
                        v-model="preferences.language"
                        :options="languages"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="temperature" class="block text-sm font-semibold text-gray-700 mb-2">
                      Temperature Unit
                    </label>
                    <Dropdown
                        id="temperature"
                        v-model="preferences.temperature"
                        :options="temperatureUnits"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="dateFormat" class="block text-sm font-semibold text-gray-700 mb-2">
                      Date Format
                    </label>
                    <Dropdown
                        id="dateFormat"
                        v-model="preferences.dateFormat"
                        :options="dateFormats"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Display Options -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Display Options</h3>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox
                        v-model="preferences.autoRefresh"
                        :binary="true"
                        inputId="autoRefresh"
                    />
                    <label for="autoRefresh" class="ml-3">
                      <span class="font-semibold">Auto-refresh data</span>
                      <p class="text-sm text-gray-600">Automatically refresh farm data every 5 minutes</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="preferences.soundNotifications"
                        :binary="true"
                        inputId="soundNotifications"
                    />
                    <label for="soundNotifications" class="ml-3">
                      <span class="font-semibold">Sound notifications</span>
                      <p class="text-sm text-gray-600">Play sound for new alerts</p>
                    </label>
                  </div>

                  <div class="flex items-center">
                    <Checkbox
                        v-model="preferences.darkMode"
                        :binary="true"
                        inputId="darkMode"
                    />
                    <label for="darkMode" class="ml-3">
                      <span class="font-semibold">Dark mode</span>
                      <p class="text-sm text-gray-600">Use dark theme (coming soon)</p>
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <Button
                    label="Save Changes"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="savePreferences"
                />
              </div>
            </div>
          </TabPanel>

          <!-- Security Tab -->
          <TabPanel header="Security">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-shield"></i>
                <span>Security</span>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Change Password -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="field">
                    <label for="currentPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <Password
                        id="currentPassword"
                        v-model="securityData.currentPassword"
                        :feedback="false"
                        toggleMask
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="newPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <Password
                        id="newPassword"
                        v-model="securityData.newPassword"
                        toggleMask
                        class="w-full"
                    />
                  </div>

                  <div class="field">
                    <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <Password
                        id="confirmPassword"
                        v-model="securityData.confirmPassword"
                        :feedback="false"
                        toggleMask
                        class="w-full"
                    />
                  </div>
                </div>
                <div class="flex justify-end mt-4">
                  <Button
                      label="Change Password"
                      icon="pi pi-lock"
                      :loading="saving"
                      @click="changePassword"
                  />
                </div>
              </div>

              <Divider />

              <!-- Data Management -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p class="font-semibold">Clear Cache</p>
                      <p class="text-sm text-gray-600">Remove stored data and reload fresh content</p>
                    </div>
                    <Button
                        label="Clear"
                        icon="pi pi-trash"
                        severity="warning"
                        outlined
                        @click="clearCache"
                    />
                  </div>

                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p class="font-semibold">Export Data</p>
                      <p class="text-sm text-gray-600">Download all your farm data</p>
                    </div>
                    <Button
                        label="Export"
                        icon="pi pi-download"
                        outlined
                        @click="exportData"
                    />
                  </div>

                  <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p class="font-semibold text-red-700">Delete Account</p>
                      <p class="text-sm text-red-600">Permanently delete your account and data</p>
                    </div>
                    <Button
                        label="Delete"
                        icon="pi pi-times"
                        severity="danger"
                        @click="deleteAccount"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 1200px;
  margin: 0 auto;
}

.field {
  margin-bottom: 0;
}

:deep(.p-tabview-panels) {
  padding: 1.5rem 0;
}

:deep(.p-password input) {
  width: 100%;
}
</style>