import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Application from "expo-application";
import React, { useState, useEffect, useRef } from "react";
import { Text, View, Platform, TextInput, StyleSheet } from "react-native";
import * as Linking from "expo-linking";

// Controls the behavior or incoming push notifications.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [pushToken, setPushToken] = useState("");
  const [idfv, setIdfv] = useState("");

  // We have the ability to react to incoming notifications while the user is in-app.
  // The "notification" state lets us know if a push notification has been received.
  const [notification, setNotification] = useState(false);
  const [notificationContent, setNotificationContent] = useState("");
  const [notificationResponse, setNotificationResponse] = useState("");
  const [deepLinkAddress, setDeepLinkAddress] = useState("");

  const notificationListener = useRef();
  const responseListener = useRef();

  // Handles requesting a push token from the OS.
  registerForPushNotificationsAsync = async () => {
    // Push doesn't work on simulators.
    if (Constants.isDevice) {
      // Check to see if we have permissions to send notifications
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // Request permission if we don't have it.
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If the user says no, do all the sad things.
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }

      // Grab the push token
      const token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log("PUSH TOKEN:");
      console.log(token);
      setPushToken(token);

      // Grab the IDFV and store it in state (In a real app check if iOS b4 using)
      const idfv = await Application.getIosIdForVendorAsync();
      console.log("IDFV:");
      console.log(idfv);
      setIdfv(idfv);
    } else {
      alert("Must use physical device for Push Notifications");
    }

    // Android gives us bonus configuration options, so we can config them here.
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  };

  const getInitialLinkAsync = async () => {
    const initialLink = await Linking.getInitialURL();
    setDeepLinkAddress(initialLink);
  };

  // Upon rendering, register for push.
  useEffect(() => {
    registerForPushNotificationsAsync();

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        setNotificationContent(notification);
      });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setNotification(notification);
        setNotificationResponse(response);
      });

    // Remove the subscriptions and listeners on app close (For testing)
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: 15,
      }}
    >
      <Text>Notification</Text>
      <TextInput
        onChangeText={() => {}}
        value={JSON.stringify(notificationContent)}
        style={styles.input}
      />

      <Text>Notification Response</Text>
      <TextInput
        onChangeText={() => {}}
        value={JSON.stringify(notificationResponse)}
        style={styles.input}
      />

      <Text>Device Push Token:</Text>
      <TextInput
        onChangeText={() => {}}
        value={pushToken}
        style={styles.input}
      />

      <Text>IDFV:</Text>
      <TextInput onChangeText={() => {}} value={idfv} style={styles.input} />

      <Text>Deep Link:</Text>
      <TextInput
        onChangeText={() => {}}
        value={deepLinkAddress}
        style={styles.input}
      />

      <Text>
        {notification ? "notification received" : "no notification received"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
