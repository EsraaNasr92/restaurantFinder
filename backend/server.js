import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config(); // Load GOOGLE_API_KEY from .env

const app = express();
app.use(express.json());
app.use(cors());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Haversine formula to calculate distance in meters
function distance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
}

// Test route
app.get("/", (req, res) => {
    res.send("Hello world from backend");
});

// Endpoint to get nearby restaurants
app.get("/api/restaurants", async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng are required" });
    }

    try {
        // Call Google Places Nearby Search
        const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
            params: {
            location: `${lat},${lng}`,
            radius: 1000,       // 1K
            type: "restaurant",       // only restaurants
            keyword: "restaurant",    // ensures exact match
            key: GOOGLE_API_KEY,
            },
        }
        );

        // Map results and calculate precise distance
        const resultsWithDistance = response.data.results
        .filter(place => place.geometry && place.geometry.location) // ensure valid location
        .map(place => ({
            place_id: place.place_id,
            name: place.name,
            vicinity: place.vicinity,
            rating: place.rating || null,
            location: place.geometry.location,
            distance: distance(
            parseFloat(lat),
            parseFloat(lng),
            place.geometry.location.lat,
            place.geometry.location.lng
            ),
            photo: place.photos
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
                : null,
            directions: `https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat},${place.geometry.location.lng}`,
        }))
        .sort((a, b) => a.distance - b.distance); // sort by nearest

        res.json(resultsWithDistance);
    } catch (error) {
        console.error("Error fetching restaurants:", error.message);
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
