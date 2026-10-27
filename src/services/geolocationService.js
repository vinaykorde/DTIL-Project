/**
 * ============================================================================
 * Geolocation & Geofence Service
 * ============================================================================
 * Handles browser Geolocation API interaction, location error categorization,
 * coordinate validation, and Haversine geofence calculations.
 * ============================================================================
 */

/**
 * Calculate geographic distance in meters between two lat/lon coordinates
 * using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters (rounded to nearest integer)
 */
export function calculateHaversineDistanceM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Validate that hostel configuration contains valid coordinates and geofence parameters.
 * @param {Object} hostelSettings
 * @returns {{ valid: boolean, error?: string, message?: string }}
 */
export function validateHostelSettings(hostelSettings) {
  if (!hostelSettings) {
    return {
      valid: false,
      error: 'INVALID_HOSTEL_CONFIGURATION',
      message: 'Hostel geofence settings are missing. Please configure hostel location in System Settings.'
    };
  }

  const lat = Number(hostelSettings.latitude);
  const lon = Number(hostelSettings.longitude);
  const radius = Number(hostelSettings.radius);
  const maxAccuracy = Number(hostelSettings.maxAccuracy);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return {
      valid: false,
      error: 'INVALID_HOSTEL_CONFIGURATION',
      message: 'Hostel latitude must be a valid number between -90 and 90 degrees.'
    };
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    return {
      valid: false,
      error: 'INVALID_HOSTEL_CONFIGURATION',
      message: 'Hostel longitude must be a valid number between -180 and 180 degrees.'
    };
  }

  if (isNaN(radius) || radius <= 0) {
    return {
      valid: false,
      error: 'INVALID_HOSTEL_CONFIGURATION',
      message: 'Hostel allowed radius must be a positive number in meters.'
    };
  }

  if (isNaN(maxAccuracy) || maxAccuracy <= 0) {
    return {
      valid: false,
      error: 'INVALID_HOSTEL_CONFIGURATION',
      message: 'Maximum location accuracy threshold must be a positive number in meters.'
    };
  }

  return { valid: true };
}

/**
 * Obtain current device coordinates from browser Geolocation API with robust error handling.
 * @param {PositionOptions} [options]
 * @returns {Promise<{
 *   success: boolean,
 *   coords?: { latitude: number, longitude: number, accuracy: number },
 *   timestamp?: number,
 *   error?: string,
 *   message: string
 * }>}
 */
export function getCurrentDeviceLocation(options = {}) {
  return new Promise((resolve) => {
    // 1. Check browser support
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return resolve({
        success: false,
        error: 'GEOLOCATION_NOT_SUPPORTED',
        message: 'Your browser or device does not support geolocation.'
      });
    }

    // 2. Check secure context (HTTPS / localhost)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return resolve({
        success: false,
        error: 'INSECURE_CONTEXT',
        message: 'Geolocation requires a secure HTTPS connection. Please access the portal using HTTPS.'
      });
    }

    // 3. Set balanced geolocation options
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds to allow GPS hardware lock
      maximumAge: 0, // Always request fresh reading
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          success: true,
          coords: {
            latitude,
            longitude,
            accuracy: Math.round(accuracy)
          },
          timestamp: position.timestamp || Date.now(),
          message: 'Location acquired successfully.'
        });
      },
      (geoError) => {
        let errorType = 'POSITION_UNAVAILABLE';
        let userMessage = 'Could not retrieve your current location. Please check device location settings.';

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED';
            userMessage = 'Location permission was denied. Please allow location access in your browser or device settings to verify your hostel presence.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE';
            userMessage = 'Location signal is unavailable. Please ensure location services / GPS are enabled on your device and try again.';
            break;
          case geoError.TIMEOUT:
            errorType = 'TIMEOUT';
            userMessage = 'Location request timed out. Please check your network or GPS signal and click Try Again.';
            break;
          default:
            errorType = 'UNKNOWN_LOCATION_ERROR';
            userMessage = geoError.message || 'An unexpected error occurred while reading device location.';
            break;
        }

        resolve({
          success: false,
          error: errorType,
          message: userMessage
        });
      },
      geoOptions
    );
  });
}

/**
 * Acquire device location with progressive accuracy refinement.
 * Instead of immediately failing on an initial coarse cellular/Wi-Fi fix,
 * this function watches position updates for up to timeoutMs (default 8s),
 * reporting progress via onProgress callback. If a fix with accuracy <= maxAccuracy
 * is received, it resolves immediately. If the refinement window expires,
 * it returns the best reading obtained so far for evaluation.
 *
 * @param {Object} [options]
 * @param {number} [options.maxAccuracy=50] - Desired accuracy threshold in meters
 * @param {number} [options.timeoutMs=8000] - Refinement window in milliseconds
 * @param {Function} [options.onProgress] - Progress callback receiving status updates
 * @returns {Promise<{
 *   success: boolean,
 *   coords?: { latitude: number, longitude: number, accuracy: number },
 *   timestamp?: number,
 *   error?: string,
 *   message: string
 * }>}
 */
export function getRefinedDeviceLocation(options = {}) {
  const {
    maxAccuracy = 50,
    timeoutMs = 8000,
    onProgress = null
  } = options;

  return new Promise((resolve) => {
    // 1. Check browser support
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return resolve({
        success: false,
        error: 'GEOLOCATION_NOT_SUPPORTED',
        message: 'Your browser or device does not support geolocation.'
      });
    }

    // 2. Check secure context (HTTPS / localhost)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return resolve({
        success: false,
        error: 'INSECURE_CONTEXT',
        message: 'Geolocation requires a secure HTTPS connection. Please access the portal using HTTPS.'
      });
    }

    let bestCoords = null;
    let bestAccuracy = Infinity;
    let bestTimestamp = null;
    let isResolved = false;
    let watchId = null;
    let timerId = null;

    const cleanup = () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const finish = (result) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      resolve(result);
    };

    // Timer expires after refinement window
    timerId = setTimeout(() => {
      if (bestCoords) {
        finish({
          success: true,
          coords: bestCoords,
          timestamp: bestTimestamp || Date.now(),
          message: bestAccuracy <= maxAccuracy
            ? 'High-accuracy location acquired.'
            : `Location acquired with accuracy ±${Math.round(bestAccuracy)} m.`
        });
      } else {
        finish({
          success: false,
          error: 'TIMEOUT',
          message: 'Location request timed out. Please check your network or GPS signal and click Try Again.'
        });
      }
    }, timeoutMs);

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: timeoutMs
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const roundedAccuracy = Math.round(accuracy);

          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            bestCoords = {
              latitude,
              longitude,
              accuracy: roundedAccuracy
            };
            bestTimestamp = position.timestamp || Date.now();
          }

          // If acceptable accuracy reached, resolve immediately
          if (roundedAccuracy <= maxAccuracy) {
            finish({
              success: true,
              coords: {
                latitude,
                longitude,
                accuracy: roundedAccuracy
              },
              timestamp: position.timestamp || Date.now(),
              message: 'Location acquired with acceptable accuracy.'
            });
            return;
          }

          // Accuracy still insufficient, notify listener of progressive refinement
          if (onProgress && typeof onProgress === 'function') {
            onProgress({
              status: 'REFINING',
              accuracy: roundedAccuracy,
              maxAccuracy,
              coords: { latitude, longitude, accuracy: roundedAccuracy },
              message: `Getting a more accurate location (currently ±${roundedAccuracy} m, max allowed ${maxAccuracy} m)...`
            });
          }
        },
        (geoError) => {
          // If we already have a reading, don't abort immediately on temporary glitch
          if (bestCoords) return;

          let errorType = 'POSITION_UNAVAILABLE';
          let userMessage = 'Could not retrieve your current location. Please check device location settings.';

          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorType = 'PERMISSION_DENIED';
              userMessage = 'Location permission was denied. Please allow location access in your browser or device settings to verify your hostel presence.';
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorType = 'POSITION_UNAVAILABLE';
              userMessage = 'Location signal is unavailable. Please ensure location services / GPS are enabled on your device and try again.';
              break;
            case geoError.TIMEOUT:
              errorType = 'TIMEOUT';
              userMessage = 'Location request timed out. Please check your network or GPS signal and click Try Again.';
              break;
            default:
              errorType = 'UNKNOWN_LOCATION_ERROR';
              userMessage = geoError.message || 'An unexpected error occurred while reading device location.';
              break;
          }

          finish({
            success: false,
            error: errorType,
            message: userMessage
          });
        },
        geoOptions
      );
    } catch (e) {
      finish({
        success: false,
        error: 'UNKNOWN_LOCATION_ERROR',
        message: e?.message || 'Error initializing geolocation.'
      });
    }
  });
}

/**
 * Validate coordinates, accuracy, freshness, and geofence distance against hostel configuration.
 * @param {Object} locationData - { latitude, longitude, accuracy, timestamp }
 * @param {Object} hostelSettings - { latitude, longitude, radius, maxAccuracy }
 * @returns {{
 *   valid: boolean,
 *   insideGeofence: boolean,
 *   distance: number,
 *   accuracy: number,
 *   maxAccuracy: number,
 *   radius: number,
 *   error?: string,
 *   message: string
 * }}
 */
export function evaluateLocationVerification(locationData, hostelSettings) {
  // Validate hostel configuration
  const configCheck = validateHostelSettings(hostelSettings);
  if (!configCheck.valid) {
    return {
      valid: false,
      insideGeofence: false,
      distance: 0,
      accuracy: 0,
      maxAccuracy: 50,
      radius: 100,
      error: configCheck.error,
      message: configCheck.message
    };
  }

  // Validate locationData existence
  if (!locationData || typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number') {
    return {
      valid: false,
      insideGeofence: false,
      distance: 0,
      accuracy: 0,
      maxAccuracy: Number(hostelSettings.maxAccuracy),
      radius: Number(hostelSettings.radius),
      error: locationData?.error || 'INVALID_COORDINATES',
      message: locationData?.message || 'Invalid or missing device coordinates.'
    };
  }

  const { latitude, longitude, accuracy, timestamp } = locationData;

  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      valid: false,
      insideGeofence: false,
      distance: 0,
      accuracy: 0,
      maxAccuracy: Number(hostelSettings.maxAccuracy),
      radius: Number(hostelSettings.radius),
      error: 'COORDINATES_OUT_OF_BOUNDS',
      message: 'Coordinates are out of physical Earth boundaries.'
    };
  }

  // Validate accuracy is positive
  if (typeof accuracy !== 'number' || accuracy <= 0) {
    return {
      valid: false,
      insideGeofence: false,
      distance: 0,
      accuracy: 0,
      maxAccuracy: Number(hostelSettings.maxAccuracy),
      radius: Number(hostelSettings.radius),
      error: 'INVALID_ACCURACY',
      message: 'Location accuracy value is invalid.'
    };
  }

  // Validate freshness (must be within last 60 seconds)
  if (timestamp && Date.now() - timestamp > 60000) {
    return {
      valid: false,
      insideGeofence: false,
      distance: 0,
      accuracy: Math.round(accuracy),
      maxAccuracy: Number(hostelSettings.maxAccuracy),
      radius: Number(hostelSettings.radius),
      error: 'STALE_LOCATION',
      message: 'Location reading is stale or expired. A fresh device reading is required.'
    };
  }

  const hLat = Number(hostelSettings.latitude);
  const hLon = Number(hostelSettings.longitude);
  const radius = Number(hostelSettings.radius);
  const maxAccuracy = Number(hostelSettings.maxAccuracy);

  const roundedAccuracy = Math.round(accuracy);
  const distance = calculateHaversineDistanceM(latitude, longitude, hLat, hLon);

  // Check location accuracy against maximum accepted threshold
  if (roundedAccuracy > maxAccuracy) {
    return {
      valid: false,
      insideGeofence: distance <= radius,
      distance,
      accuracy: roundedAccuracy,
      maxAccuracy,
      radius,
      error: 'POOR_ACCURACY',
      message: `Location accuracy is currently ±${roundedAccuracy} m; the configured maximum is ${maxAccuracy} m. Please move near a window or outdoors and retry.`
    };
  }

  // Check geofence
  const insideGeofence = distance <= radius;
  if (!insideGeofence) {
    const formattedDistance = distance > 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`;
    return {
      valid: false,
      insideGeofence: false,
      distance,
      accuracy: roundedAccuracy,
      maxAccuracy,
      radius,
      error: 'OUTSIDE_GEOFENCE',
      message: `You are currently ${formattedDistance} away from the hostel. Allowed boundary radius is ${radius} m.`
    };
  }

  return {
    valid: true,
    insideGeofence: true,
    distance,
    accuracy: roundedAccuracy,
    maxAccuracy,
    radius,
    message: `Location verified inside hostel perimeter (${distance} m from center, accuracy ±${roundedAccuracy} m).`
  };
}
