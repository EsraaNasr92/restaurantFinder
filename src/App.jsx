import { useState } from 'react';
import './App.css';
import { getRestaurant } from './api/restaurants';

function App() {
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  
  // Get location dynamically
  const handleFindLocation = () => {
    // Reset previous errors
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCenter({ lat: latitude, lng: longitude });

        setLoading(true);
        try {
          const data = await getRestaurant(latitude, longitude);
          setRestaurants(data);
        } catch (err) {
          setError("Failed to fetch restaurants.");
          console.error(err);
        }
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Permission denied. Please enable location access in your browser."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Position unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000 , maximumAge: 0}
    );
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div className="header mb-6">
        <button
          onClick={handleFindLocation}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
        >
          Use My Location
        </button>
      </div>

      <div className="container w-full max-w-8xl">
        <h2 className="text-xl font-semibold mb-4">Nearby Places:</h2>

        {loading && <p>Loading nearby restaurants...</p>}

        {!loading && restaurants.length === 0 && (
          <p>No restaurants found. Click the button to detect location.</p>
        )}

        <div className="flex flex-wrap -m-2">
          {restaurants.map((place) => (
            <div
              key={place.place_id}
              className="m-2 flex-1 min-w-[250px] max-w-[300px] p-4 bg-gray-100 rounded shadow flex flex-col"
            >
              {place.photo && (
                <img
                  src={place.photo}
                  alt={place.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />
              )}
              <strong className="mb-2">{place.name}</strong>
              <p className="mb-2">{place.vicinity}</p>
              {place.rating && <p>⭐ {place.rating}</p>}
              <a
                href={place.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-blue-600 hover:underline"
              >
                Get Directions
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App
