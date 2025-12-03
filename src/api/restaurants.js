import axios from "axios";

export const getRestaurant = async(lat, lng) => {
    try {
        const response = await axios.get("http://localhost:5000/api/restaurants", {
            params: { lat, lng },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
    
}