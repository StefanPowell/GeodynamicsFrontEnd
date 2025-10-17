import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './App.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic3RlZmFuMzc1IiwiYSI6ImNtNTdvM3dxdDNocjMybXE3NHM5cWljcXoifQ.Trxsip1AGGVhFAMEmbyd8w';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [quakeData, setQuakeData] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  // Initialize Mapbox map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-98.5, 39.5],
      zoom: 3
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const el = document.createElement('div');
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.backgroundColor = 'red';
    el.style.borderRadius = '50%';
    el.style.boxShadow = '0 0 6px red';

    new mapboxgl.Marker(el)
      .setLngLat([-98.5, 39.5])
      .addTo(map.current);
  }, []);

  // Initial fetch of earthquake data
  useEffect(() => {
    const fetchInitialQuakes = async () => {
      try {
        const response = await fetch('https://localhost:44316/api/QuakeData?valuesToShow=19', {
          headers: { 'accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setQuakeData(data);
        setHighlightIndex(0);
      } catch (error) {
        console.error('Error fetching initial quake data:', error);
      }
    };

    fetchInitialQuakes();
  }, []);

  // Highlight rows every 5 seconds
  useEffect(() => {
    if (quakeData.length === 0) return;

    const interval = setInterval(() => {
      setHighlightIndex(prevIndex => prevIndex + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [quakeData]);

  // Fetch new data when reaching the last row
  useEffect(() => {
    if (quakeData.length === 0) return;

    if (highlightIndex >= quakeData.length) {
      const fetchQuakes = async () => {
        try {
          const response = await fetch('https://localhost:44316/api/QuakeData?valuesToShow=19', {
            headers: { 'accept': 'application/json' }
          });
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          setQuakeData(data);
          setHighlightIndex(0);
        } catch (error) {
          console.error('Error fetching quake data:', error);
          setHighlightIndex(0); // reset even if fetch fails
        }
      };

      fetchQuakes();
    }
  }, [highlightIndex, quakeData]);

  return (
    <div className="App">
      <div className="quadrant red">
        <div ref={mapContainer} className="map-container"></div>
      </div>

      <div className="quadrant green">Green</div>
      <div className="quadrant yellow">Yellow</div>
      <div className="quadrant purple">Purple</div>
      <div className="quadrant orange">Orange</div>
      <div className="quadrant blue">
        <div className="table-wrapper">
          <table className="quake-table">
            <thead>
              <tr>
                <th>DateTime</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Depth</th>
                <th>Magnitude</th>
                <th>Place</th>
              </tr>
            </thead>
            <tbody>
              {quakeData.map((quake, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index === highlightIndex ? 'green' : 'transparent',
                    color: index === highlightIndex ? 'white' : 'black'
                  }}
                >
                  <td>{new Date(quake.quakeDateTime).toLocaleString()}</td>
                  <td>{quake.latitude.toFixed(5)}</td>
                  <td>{quake.longitude.toFixed(5)}</td>
                  <td>{quake.depth.toFixed(5)}</td>
                  <td>{quake.magnitude.toFixed(5)}</td>
                  <td>{quake.place}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="quadrant pink">Pink</div>
    </div>
  );
}

export default App;
