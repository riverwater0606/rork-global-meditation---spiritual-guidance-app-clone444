import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { configureNotifications } from "@/lib/notifications";

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

interface SleepInsights {
  avgDuration: number;
  excellentNights: number;
  trend: "improving" | "declining" | "stable";
}

interface AdvancedSleepInsights extends SleepInsights {
  recommendedBedtime: string;
  consistencyScore: number;
  averageBedtime: string;
}

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
      void configureNotifications();
      void Notifications.requestPermissionsAsync();
    }
  }, [loadData]);

  const updateStoredData = useCallback(async (data: SleepRecord[]) => {
    setSleepData(data);
    await AsyncStorage.setItem("sleepData", JSON.stringify(data));
  }, []);

  const calculateQuality = (duration: number): "excellent" | "good" | "fair" | "poor" => {
    if (duration >= 420) return "excellent";
    if (duration >= 360) return "good";
    if (duration >= 300) return "fair";
    return "poor";
  };

  const deleteSleepRecord = useCallback(
    async (date: string) => {
      const updated = sleepData.filter((record) => record.date !== date);
      await updateStoredData(updated);
    },
    [sleepData, updateStoredData]
  );

  const updateSleepRecord = useCallback(
    async (date: string, updates: Partial<SleepRecord>) => {
      const updated = sleepData.map((record) =>
        record.date === date ? { ...record, ...updates } : record
      );
      await updateStoredData(updated);
    },
    [sleepData, updateStoredData]
  );

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
    await updateStoredData(updatedData);
    setIsTracking(false);
    setTrackingStartTime(null);

    await AsyncStorage.removeItem("isTrackingSleep");
    await AsyncStorage.removeItem("sleepStartTime");

    console.log("Sleep tracking stopped. Duration:", duration, "minutes");
  }, [sleepData, trackingStartTime, updateStoredData]);

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

  const getInsights = useCallback((): SleepInsights | null => {
    if (sleepData.length === 0) return null;

    const last7Days = sleepData.slice(0, 7);
    const avgDuration = last7Days.reduce((sum, d) => sum + d.duration, 0) / last7Days.length;
    const excellentNights = last7Days.filter((d) => d.quality === "excellent").length;
    const previousWeek = sleepData.slice(7, 14);
    const previousAverage =
      previousWeek.length > 0
        ? previousWeek.reduce((sum, d) => sum + d.duration, 0) / previousWeek.length
        : avgDuration;

    return {
      avgDuration: Math.floor(avgDuration),
      excellentNights,
      trend:
        sleepData.length >= 14
          ? avgDuration > previousAverage
            ? "improving"
            : "declining"
          : "stable",
    };
  }, [sleepData]);

  const getAdvancedInsights = useCallback((): AdvancedSleepInsights | null => {
    if (sleepData.length === 0) return null;

    const window = sleepData.slice(0, 14);
    if (window.length === 0) return null;

    const totals = window.reduce(
      (acc, record) => {
        const start = new Date(record.startTime);
        const bedtimeMinutes = start.getHours() * 60 + start.getMinutes();
        acc.duration += record.duration;
        acc.bedtimeTotal += bedtimeMinutes;
        acc.bedtimeValues.push(bedtimeMinutes);
        return acc;
      },
      { duration: 0, bedtimeTotal: 0, bedtimeValues: [] as number[] }
    );

    const avgDuration = totals.duration / window.length;
    const averageBedtimeMinutes = Math.round(totals.bedtimeTotal / window.length);
    const meanBedtime = averageBedtimeMinutes;
    const variance =
      totals.bedtimeValues.reduce((sum, value) => sum + Math.pow(value - meanBedtime, 2), 0) /
      totals.bedtimeValues.length;
    const standardDeviation = Math.sqrt(variance || 0);
    const consistencyScore = Math.max(0, Math.min(100, 100 - standardDeviation));

    const formatMinutesToTime = (minutes: number) => {
      const normalized = ((minutes % 1440) + 1440) % 1440;
      const hours = Math.floor(normalized / 60);
      const mins = normalized % 60;
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };

    const baseInsights = getInsights();

    return {
      avgDuration: Math.floor(avgDuration),
      excellentNights: baseInsights?.excellentNights ?? 0,
      trend: baseInsights?.trend ?? "stable",
      recommendedBedtime: formatMinutesToTime(averageBedtimeMinutes - 30),
      averageBedtime: formatMinutesToTime(averageBedtimeMinutes),
      consistencyScore: Math.round(consistencyScore),
    };
  }, [getInsights, sleepData]);

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
      getAdvancedInsights,
      deleteSleepRecord,
      updateSleepRecord,
    }),
    [
      sleepData,
      isTracking,
      trackingStartTime,
      smartAlarm,
      startSleep,
      stopSleep,
      setSmartAlarmConfig,
      getInsights,
      getAdvancedInsights,
      deleteSleepRecord,
      updateSleepRecord,
    ]
  );
});
