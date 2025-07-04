console.log("Script.js loaded");
console.log("io available:", typeof io);

if (typeof io === 'undefined') {
    console.error("Socket.IO is not loaded! Please check the CDN.");
    alert("Socket.IO failed to load. Please refresh the page.");
} else {
    const socket = io();
    console.log("Socket connected:", socket);
    
    // Initialize the map
    const map = L.map("map").setView([0, 0], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Store markers for different devices
    const deviceMarkers = new Map();
    let myMarker = null;
    let selectedDeviceId = null;
    
    // Handle geolocation for current device
    if(navigator.geolocation) {
        navigator.geolocation.watchPosition((position)=>{
            const {latitude,longitude}=position.coords;
            console.log("Sending my location:", {latitude, longitude});
            socket.emit("send-location",{latitude,longitude});
            
            // Update my marker
            if (!myMarker) {
                myMarker = L.marker([latitude, longitude], {
                    icon: L.divIcon({
                        className: 'my-location-marker',
                        html: '📍',
                        iconSize: [30, 30]
                    })
                }).addTo(map);
            } else {
                myMarker.setLatLng([latitude, longitude]);
            }
            
            // Center map on my location if it's the first time
            if (deviceMarkers.size === 0) {
                map.setView([latitude, longitude], 16);
            }
        },(error)=>{
            console.error("Geolocation error:", error);
            if (error.code === error.PERMISSION_DENIED) {
                alert("Location access was denied. Please enable it in your browser settings to use this feature.");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                alert("Location information is unavailable. Please check your device's location settings.");
            } else if (error.code === error.TIMEOUT) {
                alert("Could not get location in time. Please try again.");
            }
        },
        {
            enableHighAccuracy:true,
            timeout:5000,
            maximumAge:0
        })
    }

    // Handle location updates from other devices
    socket.on("location-update", (data) => {
        console.log("Received location update:", data);
        
        // Don't update if it's my own location (we handle that separately)
        if (data.id === socket.id) return;
        
        // Create or update marker for this device
        if (!deviceMarkers.has(data.id)) {
            // Create new marker for this device
            const marker = L.marker([data.latitude, data.longitude], {
                icon: L.divIcon({
                    className: 'other-device-marker',
                    html: '📱',
                    iconSize: [25, 25]
                })
            }).addTo(map);
            
            // Add popup with device info
            marker.bindPopup(`Device: ${data.id.substring(0, 8)}...<br>Time: ${new Date(data.timestamp).toLocaleTimeString()}`);
            
            deviceMarkers.set(data.id, marker);
        } else {
            // Update existing marker
            const marker = deviceMarkers.get(data.id);
            marker.setLatLng([data.latitude, data.longitude]);
            marker.getPopup().setContent(`Device: ${data.id.substring(0, 8)}...<br>Time: ${new Date(data.timestamp).toLocaleTimeString()}`);
        }
        
        // Update device list if it exists
        updateDeviceList();
    });
    
    // Handle when devices disconnect
    socket.on("user-disconnected", (deviceId) => {
        console.log("Device disconnected:", deviceId);
        
        // Remove marker for disconnected device
        if (deviceMarkers.has(deviceId)) {
            const marker = deviceMarkers.get(deviceId);
            map.removeLayer(marker);
            deviceMarkers.delete(deviceId);
        }
        
        // Clear selection if the disconnected device was selected
        if (selectedDeviceId === deviceId) {
            selectedDeviceId = null;
        }
        
        // Update device list
        updateDeviceList();
    });
    
    // Handle initial connected users
    socket.on("connected-users", (users) => {
        console.log("Connected users:", users);
        // You can use this to show a list of connected devices
        displayConnectedDevices(users);
    });
    
    // Function to center map on a specific device
    function centerOnDevice(deviceId) {
        if (deviceMarkers.has(deviceId)) {
            const marker = deviceMarkers.get(deviceId);
            const latLng = marker.getLatLng();
            map.setView(latLng, 16);
            
            // Add a bounce animation to the marker
            marker.setIcon(L.divIcon({
                className: 'other-device-marker selected',
                html: '📱',
                iconSize: [35, 35]
            }));
            
            // Reset icon after animation
            setTimeout(() => {
                marker.setIcon(L.divIcon({
                    className: 'other-device-marker',
                    html: '📱',
                    iconSize: [25, 25]
                }));
            }, 1000);
            
            // Open popup
            marker.openPopup();
        }
    }
    
    // Function to display connected devices
    function displayConnectedDevices(users) {
        let deviceList = document.getElementById('device-list');
        if (!deviceList) {
            deviceList = document.createElement('div');
            deviceList.id = 'device-list';
            deviceList.style.cssText = 'position: absolute; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000; min-width: 200px;';
            document.body.appendChild(deviceList);
        }
        
        updateDeviceList();
    }
    
    // Function to update the device list
    function updateDeviceList() {
        const deviceList = document.getElementById('device-list');
        if (!deviceList) return;
        
        deviceList.innerHTML = '<h4>Connected Devices:</h4>';
        
        // Add "My Location" option
        const myLocationDiv = document.createElement('div');
        myLocationDiv.className = 'device-item';
        myLocationDiv.innerHTML = '📍 My Location';
        myLocationDiv.onclick = () => {
            if (myMarker) {
                const latLng = myMarker.getLatLng();
                map.setView(latLng, 16);
                selectedDeviceId = 'my-location';
                updateDeviceList();
            }
        };
        deviceList.appendChild(myLocationDiv);
        
        // Add other devices
        deviceMarkers.forEach((marker, deviceId) => {
            const deviceDiv = document.createElement('div');
            deviceDiv.className = 'device-item';
            deviceDiv.innerHTML = `📱 Device ${deviceId.substring(0, 8)}...`;
            
            // Highlight selected device
            if (selectedDeviceId === deviceId) {
                deviceDiv.classList.add('selected');
            }
            
            deviceDiv.onclick = () => {
                centerOnDevice(deviceId);
                selectedDeviceId = deviceId;
                updateDeviceList();
            };
            
            deviceList.appendChild(deviceDiv);
        });
        
        // Add "Show All" option
        if (deviceMarkers.size > 0) {
            const showAllDiv = document.createElement('div');
            showAllDiv.className = 'device-item show-all';
            showAllDiv.innerHTML = '🗺️ Show All Devices';
            showAllDiv.onclick = () => {
                // Fit map to show all markers
                const group = new L.featureGroup([myMarker, ...deviceMarkers.values()].filter(Boolean));
                map.fitBounds(group.getBounds().pad(0.1));
                selectedDeviceId = null;
                updateDeviceList();
            };
            deviceList.appendChild(showAllDiv);
        }
    }
}