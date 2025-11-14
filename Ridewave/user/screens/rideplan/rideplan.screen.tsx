import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import styles from "./styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { external } from "@/styles/external.style";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { router } from "expo-router";
import { Clock, LeftArrow, PickLocation, PickUpLocation } from "@/utils/icons";
import color from "@/themes/app.colors";
import DownArrow from "@/assets/icons/downArrow";
import PlaceHolder from "@/assets/icons/placeHolder";
import _ from "lodash";
import axios from "axios";
import * as Location from "expo-location";
import { Toast } from "react-native-toast-notifications";
import moment from "moment";
import { parseDuration } from "@/utils/time/parse.duration";
import Button from "@/components/common/button";
import { useGetUserData } from "@/hooks/useGetUserData";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

export default function RidePlanScreen() {
  const { user } = useGetUserData();
  const ws = useRef<any>(null);
  const notificationListener = useRef<any>();
  const [wsConnected, setWsConnected] = useState(false);
  const [places, setPlaces] = useState<any>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<any>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [marker, setMarker] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [distance, setDistance] = useState<any>(null);
  const [locationSelected, setlocationSelected] = useState(false);
  const [selectedVehcile, setselectedVehcile] = useState("Car");
  const [travelTimes, setTravelTimes] = useState({
    driving: null,
    walking: null,
    bicycling: null,
    transit: null,
  });
  const [keyboardAvoidingHeight, setkeyboardAvoidingHeight] = useState(false);
  const [driverLists, setdriverLists] = useState<DriverType[]>([]);
  const [selectedDriver, setselectedDriver] = useState<DriverType>();
  const [driverLoader, setdriverLoader] = useState(false);
  const driverTimeoutRef = useRef<any>(null);

  // Only set up notifications if not in Expo Go
  useEffect(() => {
    const isExpoGo = Constants?.executionEnvironment === "storeClient";
    if (isExpoGo) {
      return; // Skip notification setup in Expo Go
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          const orderData = {
            currentLocation: notification.request.content.data.currentLocation,
            marker: notification.request.content.data.marker,
            distance: notification.request.content.data.distance,
            driver: notification.request.content.data.orderData,
          };
          router.push({
            pathname: "/(routes)/ride-details",
            params: { orderData: JSON.stringify(orderData) },
          });
        });
    } catch (error) {
      console.log("Notification handler setup error:", error);
    }

    return () => {
      if (notificationListener.current) {
        try {
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        } catch (error) {
          console.log("Notification cleanup error:", error);
        }
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show(
          "Please approve your location tracking otherwise you can't use this app!",
          {
            type: "danger",
            placement: "bottom",
          }
        );
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  const initializeWebSocket = () => {
    ws.current = new WebSocket("ws://192.168.1.2:8080");
    ws.current.onopen = () => {
      console.log("Connected to websocket server");
      setWsConnected(true);
    };

    ws.current.onerror = (e: any) => {
      console.log("WebSocket error:", e.message);
    };

    ws.current.onclose = (e: any) => {
      console.log("WebSocket closed:", e.code, e.reason);
      setWsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        initializeWebSocket();
      }, 5000);
    };
  };

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      // Cleanup timeout
      if (driverTimeoutRef.current) {
        clearTimeout(driverTimeoutRef.current);
        driverTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Only register for push notifications if not in Expo Go
    // Expo Go doesn't support push notifications in SDK 53+
    const isExpoGo = Constants?.executionEnvironment === "storeClient";
    if (!isExpoGo) {
      registerForPushNotificationsAsync();
    }
  }, []);

  async function registerForPushNotificationsAsync() {
    try {
      // Skip in Expo Go - push notifications not supported in SDK 53+
      const isExpoGo = Constants?.executionEnvironment === "storeClient";
      if (isExpoGo) {
        return;
      }

      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          Toast.show("Failed to get push token for push notification!", {
            type: "danger",
          });
          return;
        }
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          Toast.show("Failed to get project id for push notification!", {
            type: "danger",
          });
          return;
        }
        try {
          const pushTokenString = (
            await Notifications.getExpoPushTokenAsync({
              projectId,
            })
          ).data;
          console.log(pushTokenString);
          // return pushTokenString;
        } catch (e: unknown) {
          console.log("Push notification error:", e);
          // Silently fail in Expo Go
        }
      } else {
        Toast.show("Must use physical device for Push Notifications", {
          type: "danger",
        });
      }

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    } catch (error) {
      // Silently handle errors in Expo Go
      console.log("Notification setup error:", error);
    }
  }

  const fetchPlaces = async (input: any) => {
    try {
      if (!process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY) {
        console.error("[fetchPlaces] Google API key is not configured");
        Toast.show("Google Maps API key is not configured", {
          type: "danger",
          placement: "bottom",
        });
        return;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input,
            key: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY,
            language: "en",
          },
        }
      );

      if (response.data && response.data.predictions) {
        setPlaces(response.data.predictions);
      } else {
        setPlaces([]);
      }
    } catch (error: any) {
      console.error("[fetchPlaces] Error:", error);
      setPlaces([]);
      Toast.show("Unable to load places. Please try again.", {
        type: "danger",
        placement: "bottom",
      });
    }
  };

  const debouncedFetchPlaces = useCallback(_.debounce(fetchPlaces, 100), []);

  useEffect(() => {
    if (query.length > 2) {
      debouncedFetchPlaces(query);
    } else {
      setPlaces([]);
    }
  }, [query, debouncedFetchPlaces]);

  const handleInputChange = (text: any) => {
    setQuery(text);
  };

  const fetchTravelTimes = async (origin: any, destination: any) => {
    const modes = ["driving", "walking", "bicycling", "transit"];
    let travelTimes = {
      driving: null,
      walking: null,
      bicycling: null,
      transit: null,
    } as any;

    for (const mode of modes) {
      let params = {
        origins: `${origin.latitude},${origin.longitude}`,
        destinations: `${destination.latitude},${destination.longitude}`,
        key: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY!,
        mode: mode,
      } as any;

      if (mode === "driving") {
        params.departure_time = "now";
      }

      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/distancematrix/json`,
          { params }
        );

        const elements = response.data.rows[0].elements[0];
        if (elements.status === "OK") {
          travelTimes[mode] = elements.duration.text;
        }
      } catch (error) {
        console.log(error);
      }
    }

    setTravelTimes(travelTimes);
  };

  const handlePlaceSelect = async (placeId: any) => {
    try {
      console.log("[handlePlaceSelect] Place selected:", placeId);
      
      // Show loading state immediately
      setlocationSelected(true);
      setdriverLoader(true);
      setdriverLists([]);
      setPlaces([]);
      setkeyboardAvoidingHeight(false);

      if (!process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY) {
        throw new Error("Google Maps API key not configured");
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (!response.data || !response.data.result) {
        throw new Error("Invalid response from Google Places API");
      }

      const { lat, lng } = response.data.result.geometry.location;

      const selectedDestination = { latitude: lat, longitude: lng };
      
      // Update map region and marker
      setRegion({
        ...region,
        latitude: lat,
        longitude: lng,
      });
      setMarker({
        latitude: lat,
        longitude: lng,
      });

      // Fetch travel times in parallel with driver request
      if (currentLocation) {
        fetchTravelTimes(currentLocation, selectedDestination).catch((error) => {
          console.error("[handlePlaceSelect] Error fetching travel times:", error);
        });
      }

      // Request nearby drivers
      requestNearbyDrivers();
      
      console.log("[handlePlaceSelect] Destination set, requesting drivers...");
    } catch (error: any) {
      console.error("[handlePlaceSelect] Error:", error);
      setdriverLoader(false);
      setlocationSelected(false);
      Toast.show(
        error?.message || "Failed to select location. Please try again.",
        {
          type: "danger",
          placement: "bottom",
        }
      );
    }
  };

  const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    var p = 0.017453292519943295; // Math.PI / 180
    var c = Math.cos;
    var a =
      0.5 -
      c((lat2 - lat1) * p) / 2 +
      (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  };

  const getEstimatedArrivalTime = (travelTime: any) => {
    const now = moment();
    const travelMinutes = parseDuration(travelTime);
    const arrivalTime = now.add(travelMinutes, "minutes");
    return arrivalTime.format("hh:mm A");
  };

  useEffect(() => {
    if (marker && currentLocation) {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        marker.latitude,
        marker.longitude
      );
      setDistance(dist);
    }
  }, [marker, currentLocation]);

  const getNearbyDrivers = () => {
    if (!ws.current) {
      console.error("[getNearbyDrivers] WebSocket not initialized");
      setdriverLoader(false);
      Toast.show("Connection error. Please try again.", {
        type: "danger",
        placement: "bottom",
      });
      return;
    }

    ws.current.onmessage = async (e: any) => {
      try {
        // Clear timeout since we got a response
        if (driverTimeoutRef.current) {
          clearTimeout(driverTimeoutRef.current);
          driverTimeoutRef.current = null;
        }

        const message = JSON.parse(e.data);
        if (message.type === "nearbyDrivers") {
          if (message.drivers && message.drivers.length > 0) {
            await getDriversData(message.drivers);
          } else {
            // No drivers found
            setdriverLists([]);
            setdriverLoader(false);
            Toast.show("No drivers available in your area.", {
              type: "info",
              placement: "bottom",
            });
          }
        }
      } catch (error) {
        console.error("[getNearbyDrivers] Error parsing websocket:", error);
        setdriverLoader(false);
        Toast.show("Error receiving driver data. Please try again.", {
          type: "danger",
          placement: "bottom",
        });
      }
    };

    ws.current.onerror = (error: any) => {
      console.error("[getNearbyDrivers] WebSocket error:", error);
      if (driverTimeoutRef.current) {
        clearTimeout(driverTimeoutRef.current);
        driverTimeoutRef.current = null;
      }
      setdriverLoader(false);
      Toast.show("Connection error. Please try again.", {
        type: "danger",
        placement: "bottom",
      });
    };
  };

  const getDriversData = async (drivers: any) => {
    try {
      if (!drivers || drivers.length === 0) {
        setdriverLists([]);
        setdriverLoader(false);
        Toast.show("No drivers available.", {
          type: "info",
          placement: "bottom",
        });
        return;
      }

      // Extract driver IDs from the drivers array
      const driverIds = drivers.map((driver: any) => driver.id).join(",");
      
      if (!process.env.EXPO_PUBLIC_SERVER_URI) {
        throw new Error("Server URI not configured");
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/driver/get-drivers-data`,
        {
          params: { ids: driverIds },
          timeout: 10000, // 10 second timeout
        }
      );

      const driverData = response.data;
      setdriverLists(Array.isArray(driverData) ? driverData : []);
      setdriverLoader(false);
    } catch (error: any) {
      console.error("[getDriversData] Error:", error);
      setdriverLists([]);
      setdriverLoader(false);
      Toast.show("Failed to load drivers. Please try again.", {
        type: "danger",
        placement: "bottom",
      });
    }
  };

  const requestNearbyDrivers = () => {
    console.log("[requestNearbyDrivers] wsConnected:", wsConnected);
    
    // Set loading state
    setdriverLoader(true);
    setdriverLists([]);

    // Set a timeout to stop loading after 15 seconds
    if (driverTimeoutRef.current) {
      clearTimeout(driverTimeoutRef.current);
    }
    
    driverTimeoutRef.current = setTimeout(() => {
      console.log("[requestNearbyDrivers] Timeout reached, stopping loader");
      setdriverLoader(false);
      setdriverLists((currentList) => {
        if (currentList.length === 0) {
          Toast.show("No drivers found. Please try again later.", {
            type: "info",
            placement: "bottom",
          });
        }
        return currentList;
      });
      driverTimeoutRef.current = null;
    }, 15000); // 15 second timeout

    if (currentLocation && wsConnected && ws.current) {
      try {
        ws.current.send(
          JSON.stringify({
            type: "requestRide",
            role: "user",
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          })
        );
        getNearbyDrivers();
      } catch (error) {
        console.error("[requestNearbyDrivers] Error sending WebSocket message:", error);
        if (driverTimeoutRef.current) {
          clearTimeout(driverTimeoutRef.current);
          driverTimeoutRef.current = null;
        }
        setdriverLoader(false);
        Toast.show("Failed to request drivers. Please try again.", {
          type: "danger",
          placement: "bottom",
        });
      }
    } else {
      // WebSocket not connected
      if (driverTimeoutRef.current) {
        clearTimeout(driverTimeoutRef.current);
        driverTimeoutRef.current = null;
      }
      setdriverLoader(false);
      Toast.show("Not connected to server. Please check your connection.", {
        type: "danger",
        placement: "bottom",
      });
    }
  };

  const sendPushNotification = async (expoPushToken: string, data: any) => {
    const message = {
      to: expoPushToken,
      sound: "default",
      title: "New Ride Request",
      body: "You have a new ride request.",
      data: { orderData: data },
    };

    await axios.post("https://exp.host/--/api/v2/push/send", message);
  };

  const handleOrder = async () => {
    const currentLocationName = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentLocation?.latitude},${currentLocation?.longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY}`
    );
    const destinationLocationName = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${marker?.latitude},${marker?.longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY}`
    );

    const data = {
      user,
      currentLocation,
      marker,
      distance: distance.toFixed(2),
      currentLocationName:
        currentLocationName.data.results[0].formatted_address,
      destinationLocation:
        destinationLocationName.data.results[0].formatted_address,
    };
    const driverPushToken = "ExponentPushToken[v1e34ML-hnypD7MKQDDwaK]";

    await sendPushNotification(driverPushToken, JSON.stringify(data));
  };

  return (
    <KeyboardAvoidingView
      style={[external.fx_1]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View>
        <View
          style={{ height: windowHeight(!keyboardAvoidingHeight ? 500 : 300) }}
        >
          <MapView
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={(region) => setRegion(region)}
          >
            {marker && <Marker coordinate={marker} />}
            {currentLocation && <Marker coordinate={currentLocation} />}
            {currentLocation && marker && (
              <MapViewDirections
                origin={currentLocation}
                destination={marker}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY!}
                strokeWidth={4}
                strokeColor="blue"
              />
            )}
          </MapView>
        </View>
      </View>
      <View style={styles.contentContainer}>
        <View style={[styles.container]}>
          {locationSelected ? (
            <>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#b5b5b5",
                  paddingBottom: windowHeight(10),
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Pressable onPress={() => {
                  setlocationSelected(false);
                  setdriverLoader(false);
                  setdriverLists([]);
                  if (driverTimeoutRef.current) {
                    clearTimeout(driverTimeoutRef.current);
                    driverTimeoutRef.current = null;
                  }
                }}>
                  <LeftArrow />
                </Pressable>
                <Text
                  style={{
                    margin: "auto",
                    fontSize: 20,
                    fontWeight: "600",
                  }}
                >
                  Gathering options
                </Text>
              </View>
              {driverLoader ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    height: windowHeight(400),
                    paddingVertical: windowHeight(40),
                  }}
                >
                  <ActivityIndicator size={"large"} color="#000" />
                  <Text
                    style={{
                      marginTop: windowHeight(20),
                      fontSize: 16,
                      color: "#666",
                    }}
                  >
                    Finding available drivers...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={{
                    paddingBottom: windowHeight(20),
                    height: windowHeight(280),
                  }}
                >
                  <View style={{ padding: windowWidth(10) }}>
                    {driverLists && driverLists.length > 0 ? (
                      driverLists.map((driver: DriverType) => (
                      <Pressable
                        style={{
                          width: windowWidth(420),
                          borderWidth:
                            selectedVehcile === driver.vehicle_type ? 2 : 0,
                          borderRadius: 10,
                          padding: 10,
                          marginVertical: 5,
                        }}
                        onPress={() => {
                          setselectedVehcile(driver.vehicle_type);
                        }}
                      >
                        <View style={{ margin: "auto" }}>
                          <Image
                            source={
                              driver?.vehicle_type === "Car"
                                ? require("@/assets/images/vehicles/car.png")
                                : driver?.vehicle_type === "Motorcycle"
                                ? require("@/assets/images/vehicles/bike.png")
                                : require("@/assets/images/vehicles/bike.png")
                            }
                            style={{ width: 90, height: 80 }}
                          />
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View>
                            <Text style={{ fontSize: 20, fontWeight: "600" }}>
                              Flashride {driver?.vehicle_type}
                            </Text>
                            <Text style={{ fontSize: 16 }}>
                              {getEstimatedArrivalTime(travelTimes.driving)}{" "}
                              dropoff
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: windowWidth(20),
                              fontWeight: "600",
                            }}
                          >
                            BDT{" "}
                            {(
                              distance.toFixed(2) * parseInt(driver.rate)
                            ).toFixed(2)}
                          </Text>
                        </View>
                      </Pressable>
                      ))
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: windowHeight(40),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "600",
                            color: "#666",
                            textAlign: "center",
                          }}
                        >
                          No drivers available in your area
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#999",
                            textAlign: "center",
                            marginTop: windowHeight(10),
                          }}
                        >
                          Please try again later or select a different location
                        </Text>
                      </View>
                    )}

                    {driverLists && driverLists.length > 0 && (
                      <View
                        style={{
                          paddingHorizontal: windowWidth(10),
                          marginTop: windowHeight(15),
                        }}
                      >
                        <Button
                          backgroundColor={"#000"}
                          textColor="#fff"
                          title={`Confirm Booking`}
                          onPress={() => handleOrder()}
                        />
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => router.back()}>
                  <LeftArrow />
                </TouchableOpacity>
                <Text
                  style={{
                    margin: "auto",
                    fontSize: windowWidth(25),
                    fontWeight: "600",
                  }}
                >
                  Plan your ride
                </Text>
              </View>
              {/* picking up time */}
              <View
                style={{
                  width: windowWidth(200),
                  height: windowHeight(28),
                  borderRadius: 20,
                  backgroundColor: color.lightGray,
                  alignItems: "center",
                  justifyContent: "center",
                  marginVertical: windowHeight(10),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Clock />
                  <Text
                    style={{
                      fontSize: windowHeight(12),
                      fontWeight: "600",
                      paddingHorizontal: 8,
                    }}
                  >
                    Pick-up now
                  </Text>
                  <DownArrow />
                </View>
              </View>
              {/* picking up location */}
              <View
                style={{
                  borderWidth: 2,
                  borderColor: "#000",
                  borderRadius: 15,
                  marginBottom: windowHeight(15),
                  paddingHorizontal: windowWidth(15),
                  paddingVertical: windowHeight(5),
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <PickLocation />
                  <View
                    style={{
                      width: Dimensions.get("window").width * 1 - 110,
                      borderBottomWidth: 1,
                      borderBottomColor: "#999",
                      marginLeft: 5,
                      height: windowHeight(20),
                    }}
                  >
                    <Text
                      style={{
                        color: "#2371F0",
                        fontSize: 18,
                        paddingLeft: 5,
                      }}
                    >
                      Current Location
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: 12,
                  }}
                >
                  <PlaceHolder />
                  <View
                    style={{
                      marginLeft: 5,
                      width: Dimensions.get("window").width * 1 - 110,
                    }}
                  >
                    <TextInput
                      placeholder="Where to?"
                      value={query}
                      onChangeText={handleInputChange}
                      onFocus={() => setkeyboardAvoidingHeight(true)}
                      style={{
                        height: 38,
                        color: "#000",
                        fontSize: 16,
                        flex: 1,
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>
              {/* Last sessions */}
              {Array.isArray(places) && places.length > 0 && places.map((place: any, index: number) => (
                <Pressable
                  key={place.place_id || `place-${index}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: windowHeight(20),
                  }}
                  onPress={() => {
                    if (place.place_id) {
                      handlePlaceSelect(place.place_id);
                    }
                  }}
                >
                  <PickUpLocation />
                  <Text style={{ paddingLeft: 15, fontSize: 18 }}>
                    {place.description || place.structured_formatting?.main_text || "Unknown place"}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
