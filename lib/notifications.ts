import * as Notifications from "expo-notifications";

let handlerConfigured = false;

export const configureNotifications = async () => {
  if (handlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  handlerConfigured = true;
};

export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") {
    await configureNotifications();
    return status;
  }

  const { status: updatedStatus } = await Notifications.requestPermissionsAsync();
  if (updatedStatus === "granted") {
    await configureNotifications();
  }
  return updatedStatus;
};
