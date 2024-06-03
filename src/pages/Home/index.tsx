import React, { useRef, useState } from "react";
import { TileLayer, MapContainer, useMap, Marker, Popup } from "react-leaflet";
import { styles } from "./style";
import { Box } from "@mui/material";
import L, { LatLngExpression } from "leaflet";
import distributors from "../../assets/distributors.json";
import 'leaflet/dist/leaflet.css';
import './no-leaflet.css';
const CENTER: LatLngExpression = [0, 0];


const ComponentResize = () => {
  const map = useMap()

  setTimeout(() => {
      map.invalidateSize()
  }, 0)

  return null
}



const HomePage: React.FC = () => {

  const [mapCenter, _setMapCenter] = useState(CENTER);
  const [zoom, _setZoom] = useState(2);
  const mapRef = useRef(null);

  const icon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.0.3/dist/images/marker-icon.png",
    iconSize: [25,41],
    iconAnchor: [12, 41]
  })



  return (
    <Box sx={styles.pageContainer}>
      {/* @ts-ignore */}
      <MapContainer center={mapCenter} zoom={zoom} ref={mapRef} style={styles.mapContainer} >
        <ComponentResize />
        <TileLayer
          attribution="OpenStreetMap"
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
        />

        
        {distributors.features.map(element => {
              const coordinates = element.geometry.coordinates;
              let position = [0, 0] as LatLngExpression; // Default position in case extraction fails
          
              if (Array.isArray(coordinates) && coordinates.length >= 2) {
                  // Extracting latitude and longitude from coordinates array
                  const latitude = coordinates[0];
                  const longitude = coordinates[1];
                  position = [latitude, longitude];
              }

          return (
          <Marker key={element.properties.name} position={position} icon={icon}>
                  <Popup>
                    <a href={element.properties.website}>{element.properties.name}</a>
                    <br />
                    {element.properties.address}
                    <br />
                    
                    {element.properties.email!==""?<a href={"mailto:"+element.properties.email}>{element.properties.email}</a>:""}
                    <br />
                    {element.properties.phone!==""?<a href={"tel:"+element.properties.phone}>{element.properties.phone}</a>:""}
                  </Popup>
          </Marker>);
        })}

      </MapContainer>
    </Box>
  );
};

export default HomePage;
