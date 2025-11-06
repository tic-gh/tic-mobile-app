addEventListener('saveGeofence', async (resolve, reject, args) => {
  try {
    // Extract geofence data from args
    const { geofence } = args;
    
    if (!geofence) {
      reject(new Error('No geofence data provided'));
      return;
    }

    // Validate required fields
    if (!geofence.name || !geofence.latitude || !geofence.longitude || !geofence.radius) {
      reject(new Error('Missing required geofence fields: name, latitude, longitude, radius'));
      return;
    }

    // Load existing geofences
    let geofences = [];
    if (typeof CapacitorKV !== 'undefined') {
      const stored = await CapacitorKV.get('geofences');
      if (stored && stored.value) {
        geofences = JSON.parse(stored.value);
      }
    }

    // Check if geofence with same name already exists
    const existingIndex = geofences.findIndex(g => g.name === geofence.name);
    
    if (existingIndex !== -1) {
      // Update existing geofence
      geofences[existingIndex] = geofence;
    } else {
      // Add new geofence
      geofences.push(geofence);
    }

    // Save updated geofences to storage
    if (typeof CapacitorKV !== 'undefined') {
      await CapacitorKV.set('geofences', JSON.stringify(geofences));
    }

    resolve({
      success: true,
      message: existingIndex !== -1 ? 'Geofence updated successfully' : 'Geofence saved successfully',
      geofence: geofence
    });
  } catch (err) {
    reject(err);
  }
})

addEventListener('removeAllGeofences', async (resolve, reject) => {
  try {
    // Remove all geofences from storage
    if (typeof CapacitorKV !== 'undefined') {
      await CapacitorKV.remove('geofences');
    }

    resolve({
      success: true,
      message: 'All geofences removed successfully'
    });
  } catch (err) {
    reject(err);
  }
})

addEventListener('loadGeofences', async (resolve, reject) => {
  try {
    let geofences = [];
    if (typeof CapacitorKV !== 'undefined') {
      const stored = await CapacitorKV.get('geofences');
      if (stored && stored.value) {
        geofences = JSON.parse(stored.value);
      }
    }

    resolve({
      success: true,
      message: 'Geofences loaded successfully',
      geofences: geofences
    });
  } catch (err) {
    reject(err);
  }
})

addEventListener('getPushLocationKey', async (resolve, reject) => {
  try {
    const locationKey = await CapacitorKV.get('locationPushToken');
    resolve({
      success: true,
      message: 'Location key retrieved successfully',
      token: locationKey
    });
  } catch (err) {
    reject(err);
  }
})

// Helper: Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // Radius of the Earth in meters
  const dLat = toRad(lat1 - lat2);
  const dLon = toRad(lon1 - lon2);
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat2)) * Math.cos(toRad(lat1)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

addEventListener('geoFence', async (resolve, reject) => {
  try {
    let scheduleDate = new Date();
    scheduleDate.setSeconds(scheduleDate.getSeconds() + 5);

    // 1. Load geofences from storage
    let geofences = [];
    if (typeof CapacitorKV !== 'undefined') {
      const stored = await CapacitorKV.get('geofences');
      if (stored && stored.value) {
        geofences = JSON.parse(stored.value);
      }
    }

    if (!Array.isArray(geofences) || geofences.length === 0) {
      resolve({"message": "NO GEOFENCES"});
      return;
    }

    // 2. Get current position
    let position;
    if (typeof CapacitorGeolocation !== 'undefined') {
      position = await CapacitorGeolocation.getCurrentPosition();
    }

    if (!position || !position.latitude || !position.longitude) {
      resolve({"message": "NO POSITION"});
      return;
    }

    // 3. Check geofence status
    let entered = [];
    let exited = [];
    for (const geofence of geofences) {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        geofence.latitude,
        geofence.longitude
      );
      if (distance <= geofence.radius) {
        entered.push(geofence);
      } else {
        exited.push(geofence);
      }
    }

    if (typeof CapacitorNotifications !== 'undefined') {
      for (const g of entered) {
        if (g.enterMessage) {
          await CapacitorNotifications.schedule([
            {
              id: 101,
              title: g.name,
              body: g.enterMessage,
              smallIcon: "ic_launcher",
              scheduleAt: scheduleDate,
            },
          ]);
        }
      }
      for (const g of exited) {
        if (g.exitMessage) {
          await CapacitorNotifications.schedule([
            {
              id: 102,
              title: g.name,
              body: g.exitMessage,
              smallIcon: "ic_launcher",
              scheduleAt: scheduleDate,
            },
          ]);
        }
      }
    }
    resolve({"message": "FINISHED"});
  } catch (err) {
    reject(err);
  }
});
