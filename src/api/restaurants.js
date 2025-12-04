import axios from "axios";
const API = axios.create({
    baseURL: import.meta.env.PROD
        ? "https://restaurant-backend.onrender.com"
        : "http://localhost:5000",
    headers: { "Content-Type": "application/json" },
});
export const getRestaurant = async (lat, lng) => {
    try {
        // Call the /api/restaurants endpoint
        const response = await API.get("/api/restaurants", {
            params: { lat, lng },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
};