// src/composables/useMapStyles.js
import { Style, Fill, Stroke, Circle as CircleStyle, Text as TextStyle } from 'ol/style'

export function useMapStyles() {

    function healthColor(score, alpha = 1) {
        if (score >= 80) return `rgba(34,197,94,${alpha})`
        if (score >= 60) return `rgba(59,130,246,${alpha})`
        if (score >= 40) return `rgba(245,158,11,${alpha})`
        return                  `rgba(239,68,68,${alpha})`
    }

    // ── Polygon style (farms WITH a boundary uploaded) ────────────────────────
    // Default  : barely-there fill + thin health-colored outline → basemap shows through
    // Hovered  : slightly stronger fill + thicker stroke
    // Selected : indigo fill + bold indigo stroke + label
    function getFarmStyle(farm, { selected = false, hovered = false } = {}) {
        const score = farm.current_health?.score || farm.health || 50

        let fillColor, strokeColor, strokeWidth

        if (selected) {
            fillColor   = 'rgba(99,102,241,0.35)'
            strokeColor = 'rgba(99,102,241,1)'
            strokeWidth = 3
        } else if (hovered) {
            fillColor   = healthColor(score, 0.30)
            strokeColor = healthColor(score, 1)
            strokeWidth = 2.5
        } else {
            fillColor   = healthColor(score, 0.10)   // almost transparent — just a tint
            strokeColor = healthColor(score, 0.85)
            strokeWidth = 1.8
        }

        return new Style({
            fill:   new Fill({ color: fillColor }),
            stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
            // Label only when selected or hovered — avoids clutter at low zoom
            text: (selected || hovered)
                ? new TextStyle({
                    text:   farm.name,
                    font:   'bold 12px sans-serif',
                    fill:   new Fill({ color: '#1f2937' }),
                    stroke: new Stroke({ color: '#fff', width: 3 }),
                })
                : undefined,
        })
    }

    // ── Point style (farms WITHOUT a boundary — lat/lon only) ────────────────
    // Default  : health-colored dot, NO label (too noisy at county scale)
    // Selected : larger dot + label appears
    function getPointStyle(farm, { selected = false } = {}) {
        const score = farm.current_health?.score || farm.health || 50
        return new Style({
            image: new CircleStyle({
                radius: selected ? 10 : 7,
                fill:   new Fill({ color: healthColor(score) }),
                stroke: new Stroke({ color: '#fff', width: 2 }),
            }),
            text: selected
                ? new TextStyle({
                    text:    farm.name,
                    font:    'bold 11px sans-serif',
                    fill:    new Fill({ color: '#1f2937' }),
                    stroke:  new Stroke({ color: '#fff', width: 3 }),
                    offsetY: -15,
                })
                : undefined,
        })
    }

    // ── Unified selector — use this in FarmMap.farmStyleFn ───────────────────
    // Automatically picks polygon vs point style based on OL geometry type.
    function getFeatureStyle(feature, { selected = false, hovered = false } = {}) {
        const farm = feature.get('farm')
        if (!farm) return null
        const type = feature.getGeometry()?.getType()
        return (type === 'Polygon' || type === 'MultiPolygon')
            ? getFarmStyle(farm, { selected, hovered })
            : getPointStyle(farm, { selected })
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
        getFarmStyle,
        getPointStyle,
        getFeatureStyle,
        getMarkerColor,
        getHealthSeverity,
        getHealthClass,
    }
}