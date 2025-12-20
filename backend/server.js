// server.js
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config(); // Load GOOGLE_API_KEY from .env

const app = express();

// Allow frontend domains
app.use(
    cors({
        origin: [
        "https://restaurant-finder-pink.vercel.app",
        "http://localhost:5173",
        ],
        methods: ["GET", "POST"],
    })
    );
    app.use(express.json());

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    // Simple in-memory cache
    // Key: `${lat},${lng}`, Value: { timestamp, data }
    const cache = {};
    const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

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

    return R * c;
    }

    // Health check
    app.get("/", (req, res) => {
    res.send("Backend is running!");
    });

    // Nearby restaurants API with caching
    app.get("/api/restaurants", async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng are required" });
    }

    const cacheKey = `${lat},${lng}`;

    // Serve from cache if available
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("Serving cached results for", cacheKey);
        return res.json(cached.data);
    }

    try {
        let allResults = [];
        let nextPageToken = null;

        do {
        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            {
            params: {
                location: `${lat},${lng}`,
                rankby: "distance",
                type: "restaurant",
                key: GOOGLE_API_KEY,
                pagetoken: nextPageToken,
            },
            }
        );

        const mappedResults = response.data.results
            .filter((place) => place.geometry && place.geometry.location)
            .map((place) => {
            const rawDistance = distance(
                parseFloat(lat),
                parseFloat(lng),
                place.geometry.location.lat,
                place.geometry.location.lng
            );
            const roundedDistance = Math.round(rawDistance / 10) * 10; // nearest 10 meters

            return {
                place_id: place.place_id,
                name: place.name,
                vicinity: place.vicinity,
                rating: place.rating || null,
                location: place.geometry.location,
                distance: roundedDistance,
                photo: place.photos
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
                : null,
                directions: `https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat},${place.geometry.location.lng}`,
            };
            });

        allResults.push(...mappedResults);

        nextPageToken = response.data.next_page_token || null;

        if (nextPageToken) {
            // Google requires a short delay before using next_page_token
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        } while (nextPageToken);

        // Sort by distance and then rating
        const sortedResults = allResults.sort((a, b) => {
        if (a.distance === b.distance) {
            return (b.rating || 0) - (a.rating || 0);
        }
        return a.distance - b.distance;
        });

        // Save to cache
        cache[cacheKey] = { timestamp: Date.now(), data: sortedResults };

        res.json(sortedResults);
    } catch (error) {
        console.error("Error fetching restaurants:", error.message);
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
