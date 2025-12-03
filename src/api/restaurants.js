import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://resturant-finder-ten.vercel.app/";

export const getRestaurant = async(lat, lng) => {
    try {
        const response = await axios.get(`${API_BASE}/api/restaurants`, {
            params: { lat, lng },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
    
}