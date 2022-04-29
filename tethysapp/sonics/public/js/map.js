const mapObj = L.map("map", {
    zoom: 5,
    minZoom: 2,
    boxZoom: true,
    maxBounds: L.latLngBounds(L.latLng(-21.651818, -83.561734), L.latLng(2.306838, -66.047344)),
    center: [-9.006221, -74.664082],
})
let REACHID
let CURRENTDATE
let mapMarker = null
let controlsObj
let SelectedSegment = L.geoJSON(false, { weight: 5, color: "#00008b" }).addTo(mapObj)

const basemapsJson = {
    "ESRI Topographic": L.esri.basemapLayer("Topographic").addTo(mapObj),
    "ESRI Terrain": L.layerGroup([
        L.esri.basemapLayer("Terrain"),
        L.esri.basemapLayer("TerrainLabels")
    ]),
    "ESRI Grey": L.esri.basemapLayer("Gray")
}