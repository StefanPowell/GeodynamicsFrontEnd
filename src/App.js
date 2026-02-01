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

    map.current.on('load', () => {
      // Add empty GeoJSON source for quake dots
      map.current.addSource('quakes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add circle layer
      map.current.addLayer({
        id: 'quakes-layer',
        type: 'circle',
        source: 'quakes',
        paint: {
          'circle-radius': 8,
          'circle-color': 'red',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2
        }
      });
    });
  }, []);

  // Update map whenever quakeData changes
  useEffect(() => {
    if (!map.current || !map.current.getSource('quakes')) return;

    const features = quakeData.map(q => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [q.longitude, q.latitude] }
    }));

    const geojson = { type: 'FeatureCollection', features };

    map.current.getSource('quakes').setData(geojson);
  }, [quakeData]);

  // Fetch initial earthquake data
  useEffect(() => {
    const fetchInitialQuakes = async () => {
      try {
        const response = await fetch('https://localhost:44316/api/QuakeData?valuesToShow=25', {
          headers: { accept: 'application/json' }
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

  // Highlight table rows every 8 seconds
  useEffect(() => {
    if (quakeData.length === 0) return;

    const interval = setInterval(() => {
      setHighlightIndex(prevIndex => (prevIndex + 1) % quakeData.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [quakeData]);

  // Fetch new data when reaching last row
  useEffect(() => {
    if (quakeData.length === 0) return;

    if (highlightIndex >= quakeData.length - 1) {
      const fetchQuakes = async () => {
        try {
          const response = await fetch('https://localhost:44316/api/QuakeData?valuesToShow=25', {
            headers: { accept: 'application/json' }
          });
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          setQuakeData(data);
          setHighlightIndex(0);
        } catch (error) {
          console.error('Error fetching quake data:', error);
          setHighlightIndex(0);
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
