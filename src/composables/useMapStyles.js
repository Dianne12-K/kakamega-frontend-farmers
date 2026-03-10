// src/composables/useMapStyles.js
import { Style, Fill, Stroke, Circle as CircleStyle, Text as TextStyle } from 'ol/style'

export function useMapStyles() {

    function healthColor(score, alpha = 1) {
        if (score >= 80) return `rgba(34,197,94,${alpha})`
        if (score >= 60) return `rgba(59,130,246,${alpha})`
        if (score >= 40) return `rgba(245,158,11,${alpha})`
        return                `rgba(239,68,68,${alpha})`
    }

    function getFarmStyle(farm, { selected = false, hovered = false } = {}) {
        const score = farm.current_health?.score || farm.health || 50
        const fill  = selected
            ? 'rgba(99,102,241,0.5)'
            : healthColor(score, hovered ? 0.6 : 0.4)
        const stroke = selected ? 'rgba(99,102,241,1)' : healthColor(score)
        const width  = selected ? 3 : hovered ? 2.5 : 2

        return new Style({
            fill:   new Fill({ color: fill }),
            stroke: new Stroke({ color: stroke, width }),
            text:   new TextStyle({
                text:   farm.name,
                font:   'bold 12px sans-serif',
                fill:   new Fill({ color: '#1f2937' }),
                stroke: new Stroke({ color: '#fff', width: 3 }),
            })
        })
    }

    function getPointStyle(farm, { selected = false } = {}) {
        const score = farm.current_health?.score || farm.health || 50
        return new Style({
            image: new CircleStyle({
                radius: selected ? 10 : 7,
                fill:   new Fill({ color: healthColor(score) }),
                stroke: new Stroke({ color: '#fff', width: 2 }),
            }),
            text: new TextStyle({
                text:    farm.name,
                font:    'bold 11px sans-serif',
                fill:    new Fill({ color: '#1f2937' }),
                stroke:  new Stroke({ color: '#fff', width: 3 }),
                offsetY: -15,
            })
        })
    }

    function getMarkerColor(score) {
        if (score >= 80) return '#22c55e'
        if (score >= 60) return '#3b82f6'
        if (score >= 40) return '#f59e0b'
        return '#ef4444'
    }

    function getHealthSeverity(score) {
        if (score >= 80) return 'success'
        if (score >= 60) return 'info'
        if (score >= 40) return 'warn'
        return 'danger'
    }

    function getHealthClass(score) {
        if (score >= 80) return 'bg-green-100 text-green-800'
        if (score >= 60) return 'bg-blue-100 text-blue-800'
        if (score >= 40) return 'bg-orange-100 text-orange-800'
        return 'bg-red-100 text-red-800'
    }

    return {
        getFarmStyle, getPointStyle,
        getMarkerColor, getHealthSeverity, getHealthClass,
    }
}