import MapboxGL from "@rnmapbox/maps";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

MapboxGL.setAccessToken(
  "pk.eyJ1Ijoic2FtaWphZmZyaSIsImEiOiJjbWg4ajFudHcxNjBkMmtvYXcyNG56dXQyIn0.SqesrHxUhL7tv2Jco_jXUw"
);

export default function MapScreen() {
  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState(MapboxGL.StyleURL.Outdoors); // day style
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Hard-coded spot list from the article (partial sample)
  const photoSpots = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [-123.120975, 49.284342] }, // Coal Harbour approx
        properties: {
          title: "Coal Harbour Waterfront",
          intensity: 10,
          photo: "https://upload.wikimedia.org/wikipedia/commons/…/Canada_Place_panorama.jpg"
        }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [-123.139999, 49.299999] }, // Stanley Park approx
        properties: {
          title: "Stanley Park Seawall / Forests",
          intensity: 15,
          photo: "https://upload.wikimedia.org/wikipedia/commons/…/Stanley_Park_Seawall.jpg"
        }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [-123.108978, 49.284416] }, // Gastown Steam Clock approx
        properties: {
          title: "Gastown Steam Clock & Cobblestone Streets",
          intensity: 8,
          photo: "https://upload.wikimedia.org/wikipedia/commons/…/Gastown-engagement-photography.jpg"
        }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [-123.140000, 49.263000] }, // Kitsilano area approx
        properties: {
          title: "Kitsilano Beach & Park",
          intensity: 12,
          photo: "https://upload.wikimedia.org/wikipedia/commons/…/jericho-beach-wedding-vancouver.jpg"
        }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [-123.120000, 49.262000] }, // Granville Island / False Creek approx
        properties: {
          title: "Granville Island & False Creek Boardwalk",
          intensity: 9,
          photo: "https://upload.wikimedia.org/wikipedia/commons/…/Granville_Island_from_Granville_Bridge.jpg"
        }
      }
      // Add more as needed…
    ]
  };

  const heatmapStyle = {
    heatmapColor: [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0, "rgba(255,255,255,0)",      // transparent white
      0.2, "rgba(173,216,230,0.6)", // light blue
      0.4, "rgba(135,206,235,0.6)", // sky blue
      0.6, "rgba(60,179,113,0.7)",  // medium sea green
      0.8, "rgba(255,165,0,0.8)",   // orange
      1, "rgba(255,0,0,1)"          // red
    ],
    heatmapWeight: ["interpolate", ["linear"], ["get", "intensity"], 0, 0, 15, 1],
    heatmapIntensity: ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 3],
    heatmapRadius: ["interpolate", ["linear"], ["zoom"], 10, 15, 15, 40],
    heatmapOpacity: 0.75
  };

  const markerStyle = {
    iconImage: "camera-15",
    iconSize: 1.2,
    textField: ["get", "title"],
    textOffset: [0, 1.2],
    textSize: 12,
    textColor: "#fff",
    textHaloColor: "#000",
    textHaloWidth: 1,
  };

  const toggle3D = () => setIs3D(prev => !prev);
  const toggleDayNight = () => {
    setMapStyle(prev =>
      prev === MapboxGL.StyleURL.Outdoors
        ? MapboxGL.StyleURL.Dark
        : MapboxGL.StyleURL.Outdoors
    );
  };

  const handleMarkerPress = e => {
    const feature = e.features && e.features[0];
    if (feature) {
      setSelectedSpot(feature.properties);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const closePopup = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedSpot(null));
  };

  useEffect(() => {
    (async () => {
      await MapboxGL.requestAndroidLocationPermissions?.();
    })();
  }, []);

  return (
    <View style={styles.page}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={mapStyle}
        onPress={closePopup}
      >
        <MapboxGL.Camera
          zoomLevel={13}
          centerCoordinate={[-123.1207, 49.2827]}
          pitch={is3D ? 60 : 0}
          heading={is3D ? 20 : 0}
        />

        <MapboxGL.UserLocation visible={true} />

        {is3D && (
          <MapboxGL.RasterDemSource
            id="mapbox-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          >
            <MapboxGL.Terrain sourceID="mapbox-dem" exaggeration={1.3} />
          </MapboxGL.RasterDemSource>
        )}

        {is3D && (
          <MapboxGL.FillExtrusionLayer
            id="3d-buildings"
            sourceID="composite"
            sourceLayerID="building"
            style={{
              fillExtrusionColor: "#aaa",
              fillExtrusionHeight: [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              fillExtrusionBase: [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              fillExtrusionOpacity: 0.9,
            }}
          />
        )}

        <MapboxGL.ShapeSource
          id="photoSpots"
          shape={photoSpots}
          onPress={handleMarkerPress}
        >
          <MapboxGL.HeatmapLayer id="photoHeatmap" style={heatmapStyle} />
          <MapboxGL.SymbolLayer id="photoSpotsLayer" style={markerStyle} />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggle3D}>
          <Text style={styles.buttonText}>{is3D ? "2D View" : "3D View"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { bottom: 100 }]} onPress={toggleDayNight}>
          <Text style={styles.buttonText}>
            {mapStyle === MapboxGL.StyleURL.Outdoors ? "Night Mode" : "Day Mode"}
          </Text>
        </TouchableOpacity>
      </View>

      {selectedSpot && (
        <Animated.View
          style={[
            styles.popupContainer,
            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
          ]}
        >
          <Image source={{ uri: selectedSpot.photo }} style={styles.image} />
          <View style={styles.popupTextContainer}>
            <Text style={styles.popupTitle}>{selectedSpot.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "flex-end",
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    opacity: 0.85,
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  popupContainer: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 160,
  },
  popupTextContainer: {
    padding: 12,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#111",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
