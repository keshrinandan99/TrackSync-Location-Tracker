const express=require('express');
const app=express()
const socketio=require('socket.io')
const http=require('http')
const path=require('path')
const server=http.createServer(app)

const io=socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))

// Store connected users and their locations
const connectedUsers = new Map();

io.on("connection",(socket)=>{
    console.log("Client connected:", socket.id);
    
    // Add user to connected users map
    connectedUsers.set(socket.id, {
        id: socket.id,
        latitude: 0,
        longitude: 0,
        connectedAt: new Date()
    });
    
    // Send current connected users to the new client
    socket.emit("connected-users", Array.from(connectedUsers.values()));
    
    socket.on("send-location", (data) => {
        console.log("Received location from", socket.id, ":", data);
        
        // Update user's location in the map
        if (connectedUsers.has(socket.id)) {
            connectedUsers.get(socket.id).latitude = data.latitude;
            connectedUsers.get(socket.id).longitude = data.longitude;
        }
        
        // Broadcast location update to all clients (including sender)
        io.emit("location-update", {
            id: socket.id,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date()
        });
    });
    
    socket.on("disconnect",()=>{
        console.log("Client disconnected:", socket.id);
        
        // Remove user from connected users map
        connectedUsers.delete(socket.id);
        
        // Notify all clients about the disconnection
        io.emit("user-disconnected", socket.id);
    });
})

app.get('/',(req,res)=>{
    res.render("index")
})

server.listen(3002, () => {
    console.log("Server running on port 3002");
});