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
    import LineString from 'ol/geom/LineString.js'
    import Circle from 'ol/geom/Circle.js'
    import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style.js'
    import { toLonLat, fromLonLat } from 'ol/proj.js'
    import { onMount, tick } from 'svelte'
    import Loader from './lib/Loader.svelte'
    import NavigationInfo from './lib/NavigationInfo.svelte'
    import { getDistance } from 'ol/sphere.js' 

    const MIN_DISTANTE_TO_UPDATE = 2

    const customTileSource = new XYZ({
        url: `${import.meta.env.VITE_MAP_URL}/cycle/{z}/{x}/{y}.png`,
        attributions: 'opencyclemap.org',
        maxZoom: 22 // Set to the max zoom level of your tiles
    })

    let showLoader = $state(true)

    let lastCoordinates = []
    let currentPosition = null
    let zoom            = 17
    let enableRotation  = $state(true)
    let followingUser   = true
    let speedKmh        = $state('0.00')
    let isTracking      = $state(false)
    let totalDistance   = $state(0)
    let routeCoords = []

    let map
    let geolocation
    let positionFeature
    let accuracyFeature
    let routeFeature
    let routeLayer
    let routeGuideFeature
    let routeGuideLayer

    const toggleTracking = () => {
        isTracking = !isTracking
        if (isTracking) {
            routeFeature.getGeometry().setCoordinates([])
            routeCoords = []
            totalDistance = 0
        }
    }

    const init = () => {
        // Initialize Map
        map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: customTileSource,
                    preload: 5,
                    cacheSize: 4096
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
        const positionLayer = new VectorLayer({
            source: new VectorSource({
                features: [positionFeature, accuracyFeature]
            })
        })
        map.addLayer(positionLayer)

        // Route tracking layer
        routeFeature = new Feature({
            geometry: new LineString([])
        })
        routeFeature.setStyle(
            new Style({
                stroke: new Stroke({
                    color: '#0f6eb6',
                    width: 3
                })
            })
        )
        routeLayer = new VectorLayer({
            source: new VectorSource({
                features: [routeFeature]
            })
        })
        map.addLayer(routeLayer)

        // Route guide  layer
        routeGuideFeature = new Feature({
            geometry: new LineString([])
        })
        routeGuideFeature.setStyle(
            new Style({
                stroke: new Stroke({
                    color: 'rgba(15, 110, 182, .7)',
                    width: 3
                })
            })
        )
        routeGuideLayer = new VectorLayer({
            source: new VectorSource({
                features: [routeGuideFeature]
            })
        })
        map.addLayer(routeGuideLayer)

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
            // console.log(rotation)
            obj.rotation = -rotation
        }

        const coordinates = currentPosition
        if (coordinates) {
            const size = map.getSize()
            const viewportHeight = size[1]
            // Offset vector (down the screen by 1/8th of viewport height)
            let offset = [0, -viewportHeight / 8]

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
            const distance = getDistance([lon1, lat1], [lon, lat])
            if (distance < MIN_DISTANTE_TO_UPDATE) return
        }

        currentPosition = coords
        updatePositionFeatures(coords, accuracy)

        if (isTracking) {
            const routeGeom = routeFeature.getGeometry()
            let distanceFromLastPoint = 0
            if (routeGeom.getLastCoordinate()?.length) {
                const lastPoint = routeGeom.getLastCoordinate()
                const [lon1, lat1] = toLonLat(lastPoint)
                distanceFromLastPoint = getDistance([lon1, lat1], [lon, lat])
                totalDistance += distanceFromLastPoint
            }

            const MIN_BEARING_DIFFERENCE_TO_ADD_POINT = 10 // degrees
            const MAX_DISTANCE_FOR_STRAIGHT_LINE_METERS = 50 // meters

            if (routeCoords.length >= 2) {
                const lastCoord = routeCoords[routeCoords.length - 1]
                const secondLastCoord = routeCoords[routeCoords.length - 2]

                const bearing1 = getBearing(secondLastCoord, lastCoord)
                const bearing2 = getBearing(lastCoord, coords)
                const bearingDifference = Math.min(Math.abs(bearing1 - bearing2), 360 - Math.abs(bearing1 - bearing2))

                if (
                    bearingDifference < MIN_BEARING_DIFFERENCE_TO_ADD_POINT &&
                    distanceFromLastPoint < MAX_DISTANCE_FOR_STRAIGHT_LINE_METERS
                ) {
                    // User is going straight, replace the last coordinate
                    routeCoords[routeCoords.length - 1] = coords
                    const currentGeomCoords = routeGeom.getCoordinates()
                    currentGeomCoords[currentGeomCoords.length - 1] = coords
                    routeGeom.setCoordinates(currentGeomCoords)
                } else {
                    // User changed direction, add a new coordinate
                    routeGeom.appendCoordinate(coords)
                    routeCoords.push(coords)
                }
            } else {
                // Not enough points to determine direction, just add the coordinate
                routeGeom.appendCoordinate(coords)
                routeCoords.push(coords)
            }
        }

        updateLastCoordinates(coords)
        const avgBearing = getAverageBearing(lastCoordinates)
        let rotation = null
        if (avgBearing !== null) {
            rotation = (avgBearing * Math.PI) / 180
        }
        recenterMap(rotation)
    }

    function downloadRoute() {
        const route = JSON.stringify(routeCoords)
        const blob = new Blob([route], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'route.json'
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
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

    function loadRouteGuide() {

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

    // const zoomIn = () => {
    //     zoom++
    //     recenterMap()
    // }

    // const zoomOut = () => {
    //     zoom--
    //     recenterMap()
    // }

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

    <NavigationInfo
        bind:enableRotation
        {recenterOnUser}
        {isTracking}
        {toggleTracking}
        {speedKmh}
        {totalDistance}
        {loadRouteGuide}
        {downloadRoute}
    ></NavigationInfo>
</div>
