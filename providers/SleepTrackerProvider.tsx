import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

interface SleepRecord {
  date: string;
  duration: number;
  quality: "excellent" | "good" | "fair" | "poor";
  startTime: string;
  endTime: string;
}

interface SmartAlarm {
  enabled: boolean;
  time: string;
  window: number;
}

const INITIAL_SLEEP_DATA: SleepRecord[] = [];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [SleepTrackerProvider, useSleepTracker] = createContextHook(() => {
  const [sleepData, setSleepData] = useState<SleepRecord[]>(INITIAL_SLEEP_DATA);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [smartAlarm, setSmartAlarm] = useState<SmartAlarm>({
    enabled: false,
    time: "07:00",
    window: 30,
  });

  const loadData = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem("sleepData");
      const alarmSaved = await AsyncStorage.getItem("smartAlarm");
      
      if (saved) {
        setSleepData(JSON.parse(saved));
      }
      
      if (alarmSaved) {
        setSmartAlarm(JSON.parse(alarmSaved));
      }

      const tracking = await AsyncStorage.getItem("isTrackingSleep");
      const startTime = await AsyncStorage.getItem("sleepStartTime");
      
      if (tracking === "true" && startTime) {
        setIsTracking(true);
        setTrackingStartTime(new Date(startTime));
      }
    } catch (error) {
      console.error("Error loading sleep data:", error);
    }
  }, []);

  useEffect(() => {
    void loadData();
    
    if (Platform.OS !== "web") {
      void Notifications.requestPermissionsAsync();
    }
  }, [loadData]);

  const calculateQuality = (duration: number): "excellent" | "good" | "fair" | "poor" => {
    if (duration >= 420) return "excellent";
    if (duration >= 360) return "good";
    if (duration >= 300) return "fair";
    return "poor";
  };

  const startSleep = useCallback(async () => {
    const now = new Date();
    setIsTracking(true);
    setTrackingStartTime(now);
    
    await AsyncStorage.setItem("isTrackingSleep", "true");
    await AsyncStorage.setItem("sleepStartTime", now.toISOString());
    
    console.log("Sleep tracking started:", now.toISOString());
  }, []);

  const stopSleep = useCallback(async () => {
    if (!trackingStartTime) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - trackingStartTime.getTime()) / 60000);
    const quality = calculateQuality(duration);

    const newRecord: SleepRecord = {
      date: trackingStartTime.toISOString(),
      duration,
      quality,
      startTime: trackingStartTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    const updatedData = [newRecord, ...sleepData].slice(0, 30);
    setSleepData(updatedData);
    setIsTracking(false);
    setTrackingStartTime(null);

    await AsyncStorage.setItem("sleepData", JSON.stringify(updatedData));
    await AsyncStorage.removeItem("isTrackingSleep");
    await AsyncStorage.removeItem("sleepStartTime");

    console.log("Sleep tracking stopped. Duration:", duration, "minutes");
  }, [trackingStartTime, sleepData]);

  const setSmartAlarmConfig = useCallback(async (config: SmartAlarm) => {
    setSmartAlarm(config);
    await AsyncStorage.setItem("smartAlarm", JSON.stringify(config));

    if (Platform.OS !== "web") {
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (config.enabled) {
        const [hours, minutes] = config.time.split(":").map(Number);
        const trigger = new Date();
        trigger.setHours(hours, minutes, 0, 0);

        if (trigger < new Date()) {
          trigger.setDate(trigger.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Good Morning!",
            body: "Time to wake up and start your day with meditation",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        });

        console.log("Smart alarm scheduled for:", trigger.toISOString());
      }
    }
  }, []);

  const getInsights = useCallback(() => {
    if (sleepData.length === 0) return null;

    const last7Days = sleepData.slice(0, 7);
    const avgDuration = last7Days.reduce((sum, d) => sum + d.duration, 0) / last7Days.length;
    const excellentNights = last7Days.filter(d => d.quality === "excellent").length;

    return {
      avgDuration: Math.floor(avgDuration),
      excellentNights,
      trend: sleepData.length >= 14 
        ? avgDuration > (sleepData.slice(7, 14).reduce((sum, d) => sum + d.duration, 0) / 7)
          ? "improving"
          : "declining"
        : "stable",
    };
  }, [sleepData]);

  return useMemo(
    () => ({
      sleepData,
      isTracking,
      trackingStartTime,
      smartAlarm,
      startSleep,
      stopSleep,
      setSmartAlarmConfig,
      getInsights,
    }),
    [sleepData, isTracking, trackingStartTime, smartAlarm, startSleep, stopSleep, setSmartAlarmConfig, getInsights]
  );
});
