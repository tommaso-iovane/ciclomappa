<script>
    import InfoBox from './InfoBox.svelte'
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
    import { onMount, tick, onDestroy } from 'svelte'
    import Loader from './Loader.svelte'
    import NavigationInfo from './NavigationInfo.svelte'
    import { getDistance } from 'ol/sphere.js'
    import { showToast } from '../lib/toast.js'

    const MIN_DISTANTE_TO_UPDATE = 4
    const MIN_BEARING_DIFFERENCE_TO_ADD_POINT = 10 // degrees
    const MAX_DISTANCE_FOR_STRAIGHT_LINE_METERS = 50 // meters
    const MIN_DISTANCE_FOR_ROTATION = 5 // meters
    const ANIMATION_THROTTLE_MS = 100 // Throttle map animations
    const BEARING_CACHE_SIZE = 20 // Cache for bearing calculations
    const ROUTE_SIMPLIFICATION_TOLERANCE = 2 // meters - tolerance for route simplification
    const SIMPLIFICATION_INTERVAL = 10 // Simplify route every N points

    const customTileSource = new XYZ({
        url: `${import.meta.env.VITE_MAP_URL}/cycle/{z}/{x}/{y}.png`,
        attributions: 'opencyclemap.org',
        maxZoom: 22 // Set to the max zoom level of your tiles
    })

    let showLoader = $state(true)

    // Optimized data structures
    let lastCoordinates = new Array(10) // Pre-allocate fixed size array
    let lastCoordinatesIndex = 0
    let lastCoordinatesCount = 0
    let currentPosition = null
    let lastRotationPosition = null
    let zoom = 17
    let enableRotation = $state(true)
    let followingUser = true
    let speedKmh = $state('0.00')
    let isTracking = $state(false)
    let totalDistance = $state(0)
    let routeCoords = []

    // Performance optimization variables
    let lastAnimationTime = 0
    let bearingCache = {} // Use object instead of Map for broader compatibility
    let isAnimating = false
    let geolocationWatchId = null
    let recenterTimeout = null
    let isAppVisible = true
    let backgroundTrackingCount = 0

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
            // Reset route data
            routeFeature.getGeometry().setCoordinates([])
            routeCoords = []
            totalDistance = 0
            backgroundTrackingCount = 0
            console.log('Route tracking started - route data reset')
            
            // Request wake lock when starting tracking
            requestWakeLock()
        } else {
            // Optional: simplify the final route when stopping tracking
            if (routeCoords.length > 2) {
                const simplifiedCoords = simplifyRoute(routeCoords)
                if (simplifiedCoords.length < routeCoords.length) {
                    routeCoords = simplifiedCoords
                    routeFeature.getGeometry().setCoordinates(simplifiedCoords)
                    console.log(`Final route simplified: ${simplifiedCoords.length} points`)
                }
            }
            console.log(`Route tracking stopped - final route has ${routeCoords.length} points`)
            console.log(`Total background updates: ${backgroundTrackingCount}`)
            
            // Release wake lock when stopping tracking
            releaseWakeLock()
        }
    }

    const init = () => {
        // Initialize Map with performance optimizations
        map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: customTileSource,
                    preload: 3, // Reduced from 5 for better performance
                    cacheSize: 2048, // Reduced cache size for memory efficiency
                    className: 'ol-layer' // Enable GPU acceleration
                })
            ],
            view: new View({
                center: fromLonLat([0, 0]),
                zoom: 2,
                enableRotation: true,
                constrainRotation: false
            }),
            // Performance optimizations
            pixelRatio: Math.min(window.devicePixelRatio || 1, 2) // Limit pixel ratio for performance
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
                    width: 5
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
                    color: '#32a852',
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
        if (!followingUser || isAnimating) {
            return
        }

        // Throttle animations for better performance
        const now = performance.now()
        if (now - lastAnimationTime < ANIMATION_THROTTLE_MS) {
            return
        }
        lastAnimationTime = now
        isAnimating = true

        let obj = { duration: 100, zoom }

        if (rotation && enableRotation) {
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
                isAnimating = false
                return
            }
            const newPixelCoordinates = [offsetCoordinates[0] + offset[0], offsetCoordinates[1] + offset[1]]
            const newCenter = map.getCoordinateFromPixel(newPixelCoordinates)

            obj.center = newCenter
        } else {
            console.warn('Current location not available.')
            isAnimating = false
            return
        }

        const animation = map.getView().animate(obj)
        // Reset animation flag when animation completes
        if (animation) {
            setTimeout(() => {
                isAnimating = false
            }, obj.duration || 100)
        } else {
            isAnimating = false
        }
    }

    const recenterOnUser = () => {
        followingUser = true
        recenterMap()
    }

    function updateLastCoordinates(coord) {
        // Use circular buffer for better performance
        lastCoordinates[lastCoordinatesIndex] = coord
        lastCoordinatesIndex = (lastCoordinatesIndex + 1) % 10
        if (lastCoordinatesCount < 10) {
            lastCoordinatesCount++
        }
    }

    // Get active coordinates from circular buffer
    function getActiveCoordinates() {
        if (lastCoordinatesCount === 0) return []

        const result = new Array(lastCoordinatesCount)
        for (let i = 0; i < lastCoordinatesCount; i++) {
            const index = (lastCoordinatesIndex - lastCoordinatesCount + i + 10) % 10
            result[i] = lastCoordinates[index]
        }
        return result
    }

    // Simplify route using Douglas-Peucker algorithm
    function simplifyRoute(coords, tolerance = ROUTE_SIMPLIFICATION_TOLERANCE) {
        if (coords.length <= 2) return coords

        // Convert tolerance from meters to coordinate units (rough approximation)
        const toleranceCoords = tolerance / 111320 // approximate meters per degree

        function getPerpendicularDistance(point, lineStart, lineEnd) {
            const A = point[0] - lineStart[0]
            const B = point[1] - lineStart[1]
            const C = lineEnd[0] - lineStart[0]
            const D = lineEnd[1] - lineStart[1]

            const dot = A * C + B * D
            const lenSq = C * C + D * D
            if (lenSq === 0) return Math.sqrt(A * A + B * B)

            const param = dot / lenSq
            let xx, yy

            if (param < 0) {
                xx = lineStart[0]
                yy = lineStart[1]
            } else if (param > 1) {
                xx = lineEnd[0]
                yy = lineEnd[1]
            } else {
                xx = lineStart[0] + param * C
                yy = lineStart[1] + param * D
            }

            const dx = point[0] - xx
            const dy = point[1] - yy
            return Math.sqrt(dx * dx + dy * dy)
        }

        function douglasPeucker(coords, tolerance) {
            if (coords.length <= 2) return coords

            let maxDistance = 0
            let maxIndex = 0
            const end = coords.length - 1

            for (let i = 1; i < end; i++) {
                const distance = getPerpendicularDistance(coords[i], coords[0], coords[end])
                if (distance > maxDistance) {
                    maxDistance = distance
                    maxIndex = i
                }
            }

            if (maxDistance > tolerance) {
                const left = douglasPeucker(coords.slice(0, maxIndex + 1), tolerance)
                const right = douglasPeucker(coords.slice(maxIndex), tolerance)
                return left.slice(0, -1).concat(right)
            } else {
                return [coords[0], coords[end]]
            }
        }

        return douglasPeucker(coords, toleranceCoords)
    }

    // Calculate average bearing from the last coordinates with caching
    function getAverageBearing() {
        const coords = getActiveCoordinates()
        if (coords.length < 2) return null

        // Create cache key from coordinates
        const cacheKey = coords.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join('|')

        // Check cache first
        if (bearingCache[cacheKey] !== undefined) {
            return bearingCache[cacheKey]
        }

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

        // Cache the result and limit cache size
        const cacheKeys = Object.keys(bearingCache)
        if (cacheKeys.length >= BEARING_CACHE_SIZE) {
            delete bearingCache[cacheKeys[0]]
        }
        bearingCache[cacheKey] = avgDeg

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
        // Reuse existing geometry instead of creating new one
        const positionGeom = positionFeature.getGeometry()
        if (positionGeom) {
            positionGeom.setCoordinates(coords)
        } else {
            positionFeature.setGeometry(new Point(coords))
        }

        if (accuracy !== undefined && accuracy !== null) {
            const accuracyGeom = accuracyFeature.getGeometry()
            if (accuracyGeom) {
                accuracyGeom.setCenter(coords)
                accuracyGeom.setRadius(accuracy)
            } else {
                accuracyFeature.setGeometry(new Circle(coords, accuracy))
            }
        }
    }

    function handleNewPosition(lon, lat, accuracy) {
        const coords = fromLonLat([lon, lat])

        // Track background updates
        if (!isAppVisible) {
            backgroundTrackingCount++
            console.log(`Background tracking update #${backgroundTrackingCount}`)
        }

        // Only update if distance from last coordinate is more than MIN_DISTANTE_TO_UPDATE meters
        if (lastCoordinatesCount > 0) {
            // Get the most recent coordinate from circular buffer
            const prevIndex = (lastCoordinatesIndex - 1 + 10) % 10
            const prev = lastCoordinates[prevIndex]
            const [lon1, lat1] = toLonLat(prev)
            const distance = getDistance([lon1, lat1], [lon, lat])
            if (distance < MIN_DISTANTE_TO_UPDATE) return
        }

        currentPosition = coords
        updatePositionFeatures(coords, accuracy)

        if (isTracking) {
            const routeGeom = routeFeature.getGeometry()
            let distanceFromLastPoint = 0

            // Calculate distance from last point if route exists
            if (routeGeom.getLastCoordinate()?.length) {
                const lastPoint = routeGeom.getLastCoordinate()
                const [lon1, lat1] = toLonLat(lastPoint)
                distanceFromLastPoint = getDistance([lon1, lat1], [lon, lat])
                totalDistance += distanceFromLastPoint
            }

            if (routeCoords.length === 0) {
                // First point, always add it
                routeGeom.appendCoordinate(coords)
                routeCoords.push(coords)
            } else if (routeCoords.length === 1) {
                // Second point, always add it to establish direction
                routeGeom.appendCoordinate(coords)
                routeCoords.push(coords)
            } else {
                // For subsequent points, optimize by checking if we can simplify
                const lastCoord = routeCoords[routeCoords.length - 1]
                const secondLastCoord = routeCoords[routeCoords.length - 2]

                // Calculate bearings to determine if we're going straight
                const bearing1 = getBearing(secondLastCoord, lastCoord)
                const bearing2 = getBearing(lastCoord, coords)
                const bearingDifference = Math.min(Math.abs(bearing1 - bearing2), 360 - Math.abs(bearing1 - bearing2))

                // Calculate distance from second-to-last point to current point
                const [lon2, lat2] = toLonLat(secondLastCoord)
                const totalSegmentDistance = getDistance([lon2, lat2], [lon, lat])

                // Smooth the route by replacing the last point if:
                // 1. The bearing change is small (going relatively straight)
                // 2. The distance from last point is small (avoiding gaps)
                // 3. The total segment distance is reasonable (avoiding oversimplification)
                const shouldReplaceLastPoint =
                    bearingDifference < MIN_BEARING_DIFFERENCE_TO_ADD_POINT &&
                    distanceFromLastPoint < MAX_DISTANCE_FOR_STRAIGHT_LINE_METERS &&
                    totalSegmentDistance < MAX_DISTANCE_FOR_STRAIGHT_LINE_METERS * 2

                if (shouldReplaceLastPoint) {
                    // Replace the last coordinate to smooth the route
                    routeCoords[routeCoords.length - 1] = coords
                    const currentGeomCoords = routeGeom.getCoordinates()
                    currentGeomCoords[currentGeomCoords.length - 1] = coords
                    routeGeom.setCoordinates(currentGeomCoords)
                } else {
                    // Significant direction change or distance, add a new point
                    routeGeom.appendCoordinate(coords)
                    routeCoords.push(coords)

                    // Periodically simplify the route to keep it smooth and minimal
                    if (routeCoords.length % SIMPLIFICATION_INTERVAL === 0 && routeCoords.length > 10) {
                        const simplifiedCoords = simplifyRoute(routeCoords)
                        if (simplifiedCoords.length < routeCoords.length) {
                            routeCoords = simplifiedCoords
                            routeGeom.setCoordinates(simplifiedCoords)
                            console.log(
                                `Route simplified: ${routeCoords.length} points (${((1 - simplifiedCoords.length / routeCoords.length) * 100).toFixed(1)}% reduction)`
                            )
                        }
                    }
                }
            }
        }

        updateLastCoordinates(coords)

        // Only calculate and apply rotation if user has moved at least MIN_DISTANCE_FOR_ROTATION meters
        // from the last rotation position, or if this is the first position
        let shouldRotate = false
        if (lastRotationPosition === null) {
            // First position, allow rotation
            shouldRotate = true
            lastRotationPosition = coords
        } else {
            // Check distance from last rotation position
            const [lastRotLon, lastRotLat] = toLonLat(lastRotationPosition)
            const distance = getDistance([lastRotLon, lastRotLat], [lon, lat])
            if (distance >= MIN_DISTANCE_FOR_ROTATION) {
                shouldRotate = true
                lastRotationPosition = coords
            }
        }

        let rotation = null
        if (shouldRotate) {
            const avgBearing = getAverageBearing()
            if (avgBearing !== null) {
                rotation = (avgBearing * Math.PI) / 180
            }
        }

        // Debounce recenter calls to reduce animation frequency
        if (recenterTimeout) {
            clearTimeout(recenterTimeout)
        }
        recenterTimeout = setTimeout(() => {
            recenterMap(rotation)
        }, 50) // Small delay to batch rapid position updates
    }

    async function downloadRoute() {
        // Simplify route one final time before downloading for optimal file size
        let finalRoute = routeCoords
        if (routeCoords.length > 2) {
            const simplifiedRoute = simplifyRoute(routeCoords)
            if (simplifiedRoute.length < routeCoords.length) {
                finalRoute = simplifiedRoute
                console.log(
                    `Route simplified for download: ${simplifiedRoute.length} points (${((1 - simplifiedRoute.length / routeCoords.length) * 100).toFixed(1)}% reduction)`
                )
            }
        }

        const route = JSON.stringify(finalRoute)
        const filename = `route-${Date.now()}.json`
        const blob = new Blob([route], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        try {
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a) // Ensure it's in the DOM
            a.click()
            document.body.removeChild(a) // Clean up
            console.log(`Route downloaded: ${finalRoute.length} points, ${(blob.size / 1024).toFixed(2)} KB`)
        } finally {
            // Always clean up the URL object
            URL.revokeObjectURL(url)
        }
    }

    function startGeolocation() {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser.', 'error')
            return
        }

        // Clear existing watch if any
        if (geolocationWatchId !== null) {
            navigator.geolocation.clearWatch(geolocationWatchId)
        }

        console.log('Starting geolocation tracking...')
        geolocationWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords
                handleNewPosition(longitude, latitude, accuracy)
                
                // Optionally, update speed if available
                if (pos.coords.speed !== null) {
                    speedKmh = (pos.coords.speed * 3.6).toFixed(2)
                }
                
                // Only update UI when app is visible to save resources
                if (isAppVisible) {
                    setTimeout(() => {
                        recenterMap()
                        showLoader = false
                    }, 1000)
                } else {
                    showLoader = false
                }
            },
            (err) => {
                console.error('Geolocation error:', err)
                
                // Try to restart geolocation after a delay on certain errors
                if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
                    setTimeout(() => {
                        if (isTracking) {
                            console.log('Attempting to restart geolocation after error...')
                            startGeolocation()
                        }
                    }, 5000)
                }
                
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        showToast('Geolocation permission denied. Please enable location services.', 'error')
                        break
                    case err.POSITION_UNAVAILABLE:
                        showToast('Location temporarily unavailable. Retrying...', 'warning')
                        break
                    case err.TIMEOUT:
                        showToast('Location request timed out. Retrying...', 'warning')
                        break
                    default:
                        showToast('An unknown geolocation error occurred.', 'error')
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000, // Allow cached position up to 10 seconds for better battery life
                timeout: 15000 // Increased timeout for better reliability
            }
        )
        
        console.log(`Geolocation watch started with ID: ${geolocationWatchId}`)
    }

    function loadRouteGuide() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,application/json'
        input.onchange = (e) => {
            // @ts-ignore
            const file = e.target.files[0]
            if (!file) {
                return
            }
            const reader = new FileReader()
            reader.onload = (readerEvent) => {
                const content = readerEvent.target.result
                try {
                    // @ts-ignore
                    const coords = JSON.parse(content)
                    if (isValidCoordinateArray(coords)) {
                        routeGuideFeature.getGeometry().setCoordinates(coords)
                    } else {
                        showToast('Invalid route file. The file should contain an array of coordinates.', 'error')
                    }
                } catch (error) {
                    showToast('Error parsing JSON file.', 'error')
                    console.error(error)
                }
            }
            reader.readAsText(file)
        }
        input.click()
    }

    function isValidCoordinateArray(coords) {
        if (!Array.isArray(coords)) {
            return false
        }
        if (coords.length === 0) {
            return true // Empty route is valid
        }

        // Use for loop for better performance with large arrays
        for (let i = 0; i < coords.length; i++) {
            const c = coords[i]
            if (
                !Array.isArray(c) ||
                c.length < 2 ||
                typeof c[0] !== 'number' ||
                typeof c[1] !== 'number' ||
                !isFinite(c[0]) ||
                !isFinite(c[1])
            ) {
                return false
            }
        }
        return true
    }

    let wakeLock = null

    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator && isTracking) {
                // Only request wake lock when actively tracking
                wakeLock = await navigator.wakeLock.request('screen')
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock was released')
                    // Attempt to re-acquire if still tracking and visible
                    if (isTracking && isAppVisible) {
                        setTimeout(() => requestWakeLock(), 1000)
                    }
                })
                console.log('Wake Lock is active')
            }
        } catch (err) {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`)
            // Wake lock might fail in background, which is fine
        }
    }

    async function releaseWakeLock() {
        if (wakeLock !== null) {
            try {
                await wakeLock.release()
                wakeLock = null
                console.log('Wake Lock released')
            } catch (err) {
                console.error('Error releasing wake lock:', err)
            }
        }
    }

    // Enhanced visibility change handler for better background tracking
    function handleVisibilityChange() {
        const wasVisible = isAppVisible
        isAppVisible = document.visibilityState === 'visible'
        
        if (!wasVisible && isAppVisible) {
            // App became visible again
            console.log(`App became visible. Background tracking updates: ${backgroundTrackingCount}`)
            backgroundTrackingCount = 0
            
            // Re-acquire wake lock
            if (wakeLock !== null) {
                requestWakeLock()
            }
            
            // Restart geolocation if it was stopped
            if (geolocationWatchId === null && isTracking) {
                console.log('Restarting geolocation after returning to foreground')
                startGeolocation()
            }
            
            // Update map view if we have a current position
            if (currentPosition && followingUser) {
                setTimeout(() => recenterMap(), 100)
            }
        } else if (wasVisible && !isAppVisible) {
            // App became hidden
            console.log('App went to background - tracking will continue')
        }
    }

    // Re-acquire wake lock on visibility change (e.g., after tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange)

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

    onDestroy(() => {
        // Clean up timeouts
        if (recenterTimeout) {
            clearTimeout(recenterTimeout)
        }

        // Clean up geolocation watch
        if (geolocationWatchId !== null) {
            navigator.geolocation.clearWatch(geolocationWatchId)
            console.log('Geolocation watch cleared')
        }

        // Clean up wake lock
        releaseWakeLock()

        // Remove event listeners
        document.removeEventListener('visibilitychange', handleVisibilityChange)

        // Clear caches
        bearingCache = {}

        // Remove event listeners if map exists
        if (map) {
            map.setTarget(null) // This cleans up the map
        }
    })
</script>

<Loader bind:show={showLoader}></Loader>

<InfoBox></InfoBox>

<div id="map" class="h-full w-full"></div>

<NavigationInfo
    bind:enableRotation
    {recenterOnUser}
    {isTracking}
    {routeCoords}
    {toggleTracking}
    {speedKmh}
    {totalDistance}
    {loadRouteGuide}
    {downloadRoute}
></NavigationInfo>
