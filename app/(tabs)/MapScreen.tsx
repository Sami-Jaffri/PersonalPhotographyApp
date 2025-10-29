import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

MapboxGL.setAccessToken(
  "pk.eyJ1Ijoic2FtaWphZmZyaSIsImEiOiJjbWg4ajFudHcxNjBkMmtvYXcyNG56dXQyIn0.SqesrHxUhL7tv2Jco_jXUw"
);

const { width } = Dimensions.get("window");

interface PhotoMarker {
  id: string;
  title: string;
  coordinates: [number, number];
  image: any;
}

const photoData: PhotoMarker[] = [
  {
    id: "1",
    title: "Sunset by the Lake",
    coordinates: [-123.116226, 49.246292],
    image: require("/Users/samijaffri/PersonalPhotographyApp/assets/images/sunset.jpg"),
  },
  {
    id: "2",
    title: "Mountain View",
    coordinates: [-123.1207, 49.2827],
    image: require("/Users/samijaffri/PersonalPhotographyApp/assets/images/mountain.jpg"),
  },
  {
    id: "3",
    title: "City Lights",
    coordinates: [-123.1, 49.27],
    image: require("/Users/samijaffri/PersonalPhotographyApp/assets/images/city.jpg"),
  },
];

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMarker | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Request and set user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation([location.coords.longitude, location.coords.latitude]);
    })();
  }, []);

  // Fade animation for popup
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: selectedPhoto ? 1 : 0,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [selectedPhoto]);

  const onRegionDidChange = async () => {
    const zoom = await cameraRef.current?.getZoom();
    if (zoom) setZoomLevel(zoom);
  };

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.MapboxStreets}
        onRegionDidChange={onRegionDidChange}
        logoEnabled={false}
        compassEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={zoomLevel}
          centerCoordinate={userLocation}
          animationMode="flyTo"
          animationDuration={1000}
          pitch={60} // tilt map for 3D perspective
        />

        {/* User location */}
        <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {/* 3D Buildings Layer */}
        <MapboxGL.VectorSource id="composite" url="mapbox://mapbox.mapbox-streets-v8">
          <MapboxGL.FillExtrusionLayer
            id="3d-buildings"
            sourceLayerID="building"
            style={{
              fillExtrusionColor: "#aaa",
              fillExtrusionHeight: ["get", "height"],
              fillExtrusionBase: ["get", "min_height"],
              fillExtrusionOpacity: 0.8,
            }}
            minZoomLevel={15} // starts extruding at closer zoom
          />
        </MapboxGL.VectorSource>

        {/* Dynamic photo markers */}
        {photoData.map((photo) => {
          const scale = Math.min(Math.max(zoomLevel / 10, 0.8), 1.8);
          return (
            <MapboxGL.PointAnnotation
              key={photo.id}
              id={photo.id}
              coordinate={photo.coordinates}
              onSelected={() => setSelectedPhoto(photo)}
            >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View
                  style={[styles.markerContainer, { transform: [{ scale }] }]}
                >
                  <Image source={photo.image} style={styles.markerImage} />
                </View>
              </View>
            </MapboxGL.PointAnnotation>
          );
        })}
      </MapboxGL.MapView>

      {/* Popup overlay */}
      {selectedPhoto && (
        <Animated.View
          style={[
            styles.popupContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Image source={selectedPhoto.image} style={styles.popupImage} />
          <Text style={styles.popupTitle}>{selectedPhoto.title}</Text>
          <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.popupClose}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  map: { flex: 1 },
  markerContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  markerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  popupContainer: {
    position: "absolute",
    bottom: 60,
    left: width * 0.1,
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    alignItems: "center",
    paddingVertical: 10,
  },
  popupImage: {
    width: "95%",
    height: 160,
    borderRadius: 12,
    resizeMode: "cover",
  },
  popupTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },
  popupClose: {
    marginTop: 8,
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "500",
  },
});
