import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAlertsStore = defineStore('alerts', () => {
    const alerts = ref([])

    const criticalAlerts = computed(() =>
        alerts.value.filter(a => a.priority === 'critical' && !a.resolved)
    )

    const highAlerts = computed(() =>
        alerts.value.filter(a => a.priority === 'high' && !a.resolved)
    )

    const mediumAlerts = computed(() =>
        alerts.value.filter(a => a.priority === 'medium' && !a.resolved)
    )

    const unreadCount = computed(() =>
        alerts.value.filter(a => !a.read && !a.resolved).length
    )

    const generateAlerts = (farms) => {
        alerts.value = []

        farms.forEach(farm => {
            const health = farm.current_health
            const moisture = farm.current_moisture

            // Critical health alerts
            if (health && health.score < 40) {
                alerts.value.push({
                    id: `alert-${farm.id}-health`,
                    farmId: farm.id,
                    farmName: farm.name,
                    priority: 'critical',
                    title: 'Critical crop health',
                    message: `${farm.name} requires immediate attention`,
                    timestamp: new Date(),
                    read: false,
                    resolved: false
                })
            }

            // Low moisture alerts
            if (moisture && moisture.status === 'dry') {
                alerts.value.push({
                    id: `alert-${farm.id}-moisture`,
                    farmId: farm.id,
                    farmName: farm.name,
                    priority: 'high',
                    title: 'Urgent irrigation needed',
                    message: `${farm.name} has critically low soil moisture`,
                    timestamp: new Date(),
                    read: false,
                    resolved: false
                })
            }

            // Declining health alerts
            if (health && health.score < 60 && health.score >= 40) {
                alerts.value.push({
                    id: `alert-${farm.id}-watch`,
                    farmId: farm.id,
                    farmName: farm.name,
                    priority: 'medium',
                    title: 'Monitor crop health',
                    message: `${farm.name} showing signs of stress`,
                    timestamp: new Date(),
                    read: false,
                    resolved: false
                })
            }
        })
    }

    const markAsRead = (alertId) => {
        const alert = alerts.value.find(a => a.id === alertId)
        if (alert) alert.read = true
    }

    const markAsResolved = (alertId) => {
        const alert = alerts.value.find(a => a.id === alertId)
        if (alert) alert.resolved = true
    }

    return {
        alerts,
        criticalAlerts,
        highAlerts,
        mediumAlerts,
        unreadCount,
        generateAlerts,
        markAsRead,
        markAsResolved
    }
})