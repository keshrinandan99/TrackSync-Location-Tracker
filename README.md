# Real-Time Device Tracking App

This project is a real-time device tracking application built with Node.js, Express.js, Socket.IO, and Leaflet.js.

## Features

*   **Real-time Location Tracking:** Track the live location of multiple devices on an interactive map.
*   **WebSocket Communication:** Utilizes Socket.IO for efficient and instant bidirectional communication between the server and clients for location updates.
*   **Map Visualization:** Displays device locations using Leaflet.js with OpenStreetMap tiles.
*   **Individual Device Focus:** Allows users to center the map on a specific connected device.
*   **Overview Map:** Provides an option to view all connected devices on the map simultaneously.
*   **User-Friendly Interface:** Simple web interface to visualize and interact with device locations.

## Technologies Used

*   **Backend:** Node.js, Express.js, Socket.IO
*   **Frontend:** HTML, CSS, JavaScript, EJS (templating engine), Leaflet.js (mapping library), Socket.IO (client-side)

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd real-time-device-track
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Start the server:
    ```bash
    npm start
    ```
2.  Open your web browser and navigate to `http://localhost:3002`.
3.  To simulate multiple devices, open the URL in different browser tabs or on different devices.

## How it Works

*   The `app.js` file sets up an Express server and integrates Socket.IO.
*   When a client connects, it joins a Socket.IO room.
*   Clients with geolocation enabled send their latitude and longitude to the server via WebSockets.
*   The server broadcasts these location updates to all connected clients.
*   The `public/js/script.js` file handles the client-side logic, including obtaining geolocation, sending updates, and rendering markers on the Leaflet map.
*   `views/index.ejs` serves the main HTML page with the map container and necessary script includes.