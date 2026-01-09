<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true

  try {
    const result = await authStore.login({
      email: email.value,
      password: password.value
    })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Welcome back!',
        life: 3000
      })
      router.push('/')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: result.error || 'Invalid credentials',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred during login',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center p-4">
    <Toast />

    <Card class="w-full max-w-md">
      <template #header>
        <div class="text-center pt-6">
          <i class="pi pi-chart-line text-6xl text-primary"></i>
          <h1 class="text-2xl font-bold text-gray-800 mt-4">Kakamega Smart Farming</h1>
          <p class="text-gray-600 mt-2">Sign in to your account</p>
        </div>
      </template>

      <template #content>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <InputText
                id="email"
                v-model="email"
                type="email"
                placeholder="your.email@example.com"
                class="w-full"
                required
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Password
                id="password"
                v-model="password"
                placeholder="Enter your password"
                :feedback="false"
                toggleMask
                class="w-full"
                inputClass="w-full"
                required
            />
          </div>

          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center">
              <input type="checkbox" class="mr-2">
              <span class="text-gray-600">Remember me</span>
            </label>
            <a href="#" class="text-primary hover:underline">Forgot password?</a>
          </div>

          <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              class="w-full"
              :loading="loading"
          />
        </form>

        <div class="mt-6 text-center text-sm text-gray-600">
          <p>Demo credentials: any email and password</p>
        </div>
      </template>
    </Card>
  </div>
</template>