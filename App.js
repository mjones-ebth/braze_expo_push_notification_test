import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useState, useEffect, useRef } from "react";
import { Text, View, Platform } from "react-native";

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
  // We have the ability to react to incoming notifications while the user is in-app. 
  // The "notification" state lets us know if a push notification has been received. 
  const [notification, setNotification] = useState(false);

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

      // Grab the push token and store it in state
      const token = (await Notifications.getDevicePushTokenAsync()).data;

      console.log(token);

      setPushToken(token);
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

  // Upon rendering, register for push. 
  useEffect(() => {
    registerForPushNotificationsAsync();

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
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
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
      }}
    >
      <Text>Device Push Token:</Text>
      <Text>{pushToken}</Text>
    </View>
  );
}
