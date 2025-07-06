<script>
    import InfoBox from './lib/InfoBox.svelte'
    import 'ol/ol.css'
    import Map from 'ol/Map.js'
    import View from 'ol/View.js'
    import TileLayer from 'ol/layer/Tile.js'
    import XYZ from 'ol/source/XYZ.js'
    import Geolocation from 'ol/Geolocation.js'
    import VectorSource from 'ol/source/Vector.js'
    import VectorLayer from 'ol/layer/Vector.js'
    import Feature from 'ol/Feature.js'
    import Point from 'ol/geom/Point.js'
    import Circle from 'ol/geom/Circle.js'
    import { Style, Circle as CircleStyle, Fill, Stroke, Icon } from 'ol/style.js'
    import { toLonLat, fromLonLat } from 'ol/proj.js'
    import { MapPin, Minus, Plus, Rotate3d } from '@lucide/svelte'
    import { onMount, tick } from 'svelte'
    import Loader from './lib/Loader.svelte'

    const MIN_DISTANTE_TO_UPDATE = 2

    const customTileSource = new XYZ({
        url: `${import.meta.env.VITE_MAP_URL}/cycle/{z}/{x}/{y}.png`,
        attributions: 'opencyclemap.org',
        maxZoom: 22 // Set to the max zoom level of your tiles
    })

    let showLoader = $state(true)

    let lastCoordinates = []
    let currentPosition = null
    let currentAccuracy = null
    let zoom = 17
    let enableRotation = true
    let followingUser = true
    let speedKmh = '0.00'

    let map
    let geolocation
    let positionFeature
    let accuracyFeature

    const init = () => {
        // Initialize Map
        map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: customTileSource
                })
            ],
            view: new View({
                center: fromLonLat([0, 0]),
                zoom: 2
            })
        })
    
        geolocation = new Geolocation({
            tracking: true,
            projection: map.getView().getProjection(),
            trackingOptions: {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        })
    
        positionFeature = new Feature()
        positionFeature.setStyle(
            new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({
                        color: '#007bff' // Blue dot
                    }),
                    stroke: new Stroke({
                        color: '#fff', // White border
                        width: 2
                    })
                })
            })
        )
    
        accuracyFeature = new Feature()
        accuracyFeature.setStyle(
            new Style({
                fill: new Fill({
                    color: 'rgba(0, 123, 255, 0.1)' // Light blue transparent fill
                }),
                stroke: new Stroke({
                    color: 'rgba(0, 123, 255, 0.5)', // Blue transparent border
                    width: 1
                })
            })
        )
    
        // Vector layer to display the user's position and accuracy
        const vectorLayer = new VectorLayer({
            source: new VectorSource({
                features: [positionFeature, accuracyFeature]
            })
        })
        map.addLayer(vectorLayer)
    
        // Detect when the user manually moves the map by dragging and stop following
        map.on('pointerdrag', function () {
            followingUser = false
        })
    
        // Initial view when map loads if geolocation is not immediately available
        map.once('rendercomplete', function () {
            if (!geolocation.getPosition()) {
                console.log('Geolocation not yet available, setting default view.')
            }
        })
    }


    function recenterMap(rotation = null) {
        if (!followingUser) {
            return
        }
        let obj = { duration: 100, zoom }

        if (rotation && enableRotation) {
            console.log(rotation)
            obj.rotation = -rotation
        }

        const coordinates = currentPosition
        if (coordinates) {
            const size = map.getSize()
            const viewportHeight = size[1]
            // Offset vector (down the screen by 1/8th of viewport height)
            let offset = [0, -viewportHeight / 8]

            // If rotating, rotate the offset vector by -rotation (screen coordinates)
            // let rot = rotation || map.getView().getRotation() || 0;
            // const cos = Math.cos(rot);
            // const sin = Math.sin(rot);
            // 2D rotation matrix
            // if (rotation && enableRotation) {
            //     offset = [
            //         offset[0] * cos - offset[1] * sin,
            //         offset[0] * sin + offset[1] * cos
            //     ];
            // }

            const offsetCoordinates = map.getPixelFromCoordinate(coordinates)
            if (!offsetCoordinates) {
                return
            }
            const newPixelCoordinates = [offsetCoordinates[0] + offset[0], offsetCoordinates[1] + offset[1]]
            const newCenter = map.getCoordinateFromPixel(newPixelCoordinates)

            obj.center = newCenter
        } else {
            console.warn('Current location not available.')
        }
        map.getView().animate(obj)
    }


    const recenterOnUser = () => {
        followingUser = true
        recenterMap()
    }

    function updateLastCoordinates(coord) {
        lastCoordinates.push(coord)
        if (lastCoordinates.length > 10) {
            lastCoordinates.shift()
        }
    }
    // Calculate average bearing from the last coordinates
    function getAverageBearing(coords) {
        if (coords.length < 2) return null
        let sumSin = 0
        let sumCos = 0
        for (let i = 1; i < coords.length; i++) {
            const bearing = getBearing(coords[i - 1], coords[i])
            const rad = (bearing * Math.PI) / 180
            sumSin += Math.sin(rad)
            sumCos += Math.cos(rad)
        }
        const avgRad = Math.atan2(sumSin, sumCos)
        let avgDeg = (avgRad * 180) / Math.PI
        if (avgDeg < 0) avgDeg += 360
        return avgDeg
    }

    function getBearing(start, end) {
        // start and end are [x, y] in map projection, convert to lon/lat
        const [lon1, lat1] = toLonLat(start)
        const [lon2, lat2] = toLonLat(end)

        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const λ1 = (lon1 * Math.PI) / 180
        const λ2 = (lon2 * Math.PI) / 180

        const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
        let θ = Math.atan2(y, x)
        θ = (θ * 180) / Math.PI // convert to degrees
        return (θ + 360) % 360 // normalize
    }

    function updatePositionFeatures(coords, accuracy) {
        positionFeature.setGeometry(new Point(coords))
        if (accuracy !== undefined && accuracy !== null) {
            accuracyFeature.setGeometry(new Circle(coords, accuracy))
        }
    }

    function handleNewPosition(lon, lat, accuracy) {
        const coords = fromLonLat([lon, lat])

        // Only update if distance from last coordinate is more than MIN_DISTANTE_TO_UPDATE meters
        if (lastCoordinates.length > 0) {
            const prev = lastCoordinates[lastCoordinates.length - 1]
            const [lon1, lat1] = toLonLat(prev)
            const R = 6371000 // Earth radius in meters
            const toRad = (x) => (x * Math.PI) / 180
            const dLat = toRad(lat - lat1)
            const dLon = toRad(lon - lon1)
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c
            if (distance < MIN_DISTANTE_TO_UPDATE) return
        }

        currentPosition = coords
        currentAccuracy = accuracy
        updatePositionFeatures(coords, accuracy) // <-- always update features

        updateLastCoordinates(coords)
        const avgBearing = getAverageBearing(lastCoordinates)
        let rotation = null
        if (avgBearing !== null) {
            rotation = (avgBearing * Math.PI) / 180
        }
        recenterMap(rotation)
    }

    function startGeolocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.')
            return
        }
        navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords
                handleNewPosition(longitude, latitude, accuracy)
                // Optionally, update speed if available
                if (pos.coords.speed !== null) {
                    speedKmh = (pos.coords.speed * 3.6).toFixed(2)
                }
                setTimeout(() => {
                    recenterMap()
                    showLoader = false
                }, 1000)
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        alert('Geolocation permission denied. Please enable location services.')
                        break
                    case err.POSITION_UNAVAILABLE:
                        alert('Location information is unavailable.')
                        break
                    case err.TIMEOUT:
                        alert('Geolocation request timed out. Try again.')
                        break
                    default:
                        alert('An unknown geolocation error occurred.')
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        )
    }

    let wakeLock = null

    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen')
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock was released')
                })
                console.log('Wake Lock is active')
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`)
        }
    }

    // Re-acquire wake lock on visibility change (e.g., after tab switch)
    document.addEventListener('visibilitychange', () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock()
        }
    })
    requestWakeLock()

    const zoomIn = () => {
        zoom++
        recenterMap()
    }

    const zoomOut = () => {
        zoom--
        recenterMap()
    }

    onMount(async () => {
        await tick()
        init()
        startGeolocation()
    })
</script>

<Loader bind:show={showLoader}></Loader>

<div class="relative h-full w-full" id="main">
    <InfoBox></InfoBox>

    <div id="map" class="h-full w-full"></div>

    <div class="absolute bottom-0 z-10 flex h-14 w-full items-center justify-between gap-2 rounded-t-2xl bg-white shadow-2xl">
        <button onclick={recenterOnUser} class="btn ms-4 hover:text-white">
            <MapPin size={16}></MapPin>
        </button>

        <div class="flex items-center gap-1">
            <button onclick={zoomOut} class="btn" title="Top"><Minus size={16}></Minus></button>
            <button onclick={zoomIn} class="btn" title="Left"><Plus size={16}></Plus></button>
            <button class:btn-secondary={enableRotation} onclick={() => (enableRotation = !enableRotation)} class="btn"
                ><Rotate3d size={16}></Rotate3d>
            </button>
        </div>

        <div class="me-4 text-gray-800">
            <span class="font-bold">{speedKmh || 0}</span>
            <span>Km/h</span>
        </div>
    </div>
</div>
