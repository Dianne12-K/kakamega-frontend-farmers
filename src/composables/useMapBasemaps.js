// src/composables/useMapBasemaps.js
import TileLayer from 'ol/layer/Tile'
import OSM      from 'ol/source/OSM'
import XYZ      from 'ol/source/XYZ'

export const BASEMAPS = [
    { id: 'osm',           label: 'OSM Standard',     icon: '🗺️' },
    { id: 'google-hybrid', label: 'Google Hybrid',    icon: '🌍' },
    { id: 'google-sat',    label: 'Google Satellite', icon: '🛰️' },
    { id: 'google-road',   label: 'Google Roadmap',   icon: '🚗' },
    { id: 'esri-imagery',  label: 'ESRI Imagery',     icon: '🏔️' },
    { id: 'esri-topo',     label: 'ESRI Topo',        icon: '🌲' },
    { id: 'carto-dark',    label: 'CartoDB Dark',     icon: '🌑' },
    { id: 'carto-light',   label: 'CartoDB Light',    icon: '☁️'  },
]

function makeSource(id) {
    switch (id) {
        case 'osm':
            return new OSM()

        case 'google-hybrid':
            return new XYZ({ url: 'https://mt{0-3}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', maxZoom: 20, attributions: '© Google' })

        case 'google-sat':
            return new XYZ({ url: 'https://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', maxZoom: 20, attributions: '© Google' })

        case 'google-road':
            return new XYZ({ url: 'https://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', maxZoom: 20, attributions: '© Google' })

        case 'esri-imagery':
            return new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19, attributions: '© Esri' })

        case 'esri-topo':
            return new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', maxZoom: 19, attributions: '© Esri' })

        case 'carto-dark':
            return new XYZ({ url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', maxZoom: 19, attributions: '© CartoDB' })

        case 'carto-light':
            return new XYZ({ url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', maxZoom: 19, attributions: '© CartoDB' })

        default:
            return new OSM()
    }
}

/**
 * Call AFTER map is created with NO basemap layer in its layers array.
 * This composable owns index 0 — the basemap slot.
 * The vector layer should be at index 1+.
 */
export function useMapBasemaps(map, initialId = 'osm') {
    // Create a single persistent TileLayer — we swap its source, never the layer itself
    const basemapLayer = new TileLayer({
        source: makeSource(initialId),
        zIndex: 0,
    })

    // Insert at position 0 (below everything)
    map.getLayers().insertAt(0, basemapLayer)

    function switchBasemap(id) {
        // Swap source on the SAME layer — no add/remove needed
        basemapLayer.setSource(makeSource(id))
    }

    return { switchBasemap, basemapLayer }
}