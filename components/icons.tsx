import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<TextStyle>;
}

const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = "#111827";

type IconComponent = React.ComponentType<{
  name: string;
  size: number;
  color: string;
  style?: StyleProp<TextStyle>;
}>;

const createIcon = (Component: IconComponent, name: string) =>
  ({ size = DEFAULT_SIZE, color = DEFAULT_COLOR, style }: IconProps) => (
    <Component name={name} size={size} color={color} style={style} />
  );

export const Activity = createIcon(Feather as IconComponent, "activity");
export const ArrowLeft = createIcon(Feather as IconComponent, "arrow-left");
export const Award = createIcon(Feather as IconComponent, "award");
export const Bell = createIcon(Feather as IconComponent, "bell");
export const Bot = createIcon(MaterialCommunityIcons as IconComponent, "robot-outline");
export const Brain = createIcon(MaterialCommunityIcons as IconComponent, "brain");
export const Calendar = createIcon(Feather as IconComponent, "calendar");
export const Check = createIcon(Feather as IconComponent, "check");
export const CheckCircle = createIcon(Feather as IconComponent, "check-circle");
export const CheckCircle2 = CheckCircle;
export const Clock = createIcon(Feather as IconComponent, "clock");
export const ChevronRight = createIcon(Feather as IconComponent, "chevron-right");
export const Download = createIcon(Feather as IconComponent, "download");
export const Edit2 = createIcon(Feather as IconComponent, "edit-2");
export const Eye = createIcon(Feather as IconComponent, "eye");
export const Globe = createIcon(Feather as IconComponent, "globe");
export const Headphones = createIcon(Feather as IconComponent, "headphones");
export const Heart = createIcon(Feather as IconComponent, "heart");
export const Home = createIcon(Feather as IconComponent, "home");
export const Loader2 = createIcon(Feather as IconComponent, "loader");
export const LogOut = createIcon(Feather as IconComponent, "log-out");
export const MessageCircle = createIcon(Feather as IconComponent, "message-circle");
export const Minus = createIcon(Feather as IconComponent, "minus");
export const Moon = createIcon(Feather as IconComponent, "moon");
export const Pause = createIcon(Feather as IconComponent, "pause");
export const Play = createIcon(Feather as IconComponent, "play");
export const PlayCircle = createIcon(Feather as IconComponent, "play-circle");
export const Plus = createIcon(Feather as IconComponent, "plus");
export const PlusCircle = createIcon(Feather as IconComponent, "plus-circle");
export const RefreshCw = createIcon(Feather as IconComponent, "refresh-cw");
export const RotateCcw = createIcon(Feather as IconComponent, "rotate-ccw");
export const ScanLine = createIcon(Ionicons as IconComponent, "scan-outline");
export const Search = createIcon(Feather as IconComponent, "search");
export const Send = createIcon(Feather as IconComponent, "send");
export const Share2 = createIcon(Feather as IconComponent, "share-2");
export const Shield = createIcon(Feather as IconComponent, "shield");
export const ShieldCheck = createIcon(Ionicons as IconComponent, "shield-checkmark-outline");
export const SkipBack = createIcon(Feather as IconComponent, "skip-back");
export const SkipForward = createIcon(Feather as IconComponent, "skip-forward");
export const Smartphone = createIcon(Feather as IconComponent, "smartphone");
export const Sparkles = createIcon(Ionicons as IconComponent, "sparkles-outline");
export const Star = createIcon(Feather as IconComponent, "star");
export const Sun = createIcon(Feather as IconComponent, "sun");
export const Target = createIcon(Feather as IconComponent, "target");
export const Trash2 = createIcon(Feather as IconComponent, "trash-2");
export const TrendingUp = createIcon(Feather as IconComponent, "trending-up");
export const User = createIcon(Feather as IconComponent, "user");
export const Volume2 = createIcon(Feather as IconComponent, "volume-2");
export const VolumeX = createIcon(Feather as IconComponent, "volume-x");
export const Waves = createIcon(MaterialCommunityIcons as IconComponent, "waves");
export const Wind = createIcon(Feather as IconComponent, "wind");
export const X = createIcon(Feather as IconComponent, "x");
export const Zap = createIcon(Feather as IconComponent, "zap");
export const AlertTriangle = createIcon(Feather as IconComponent, "alert-triangle");
export const BarChart3 = createIcon(Feather as IconComponent, "bar-chart-2");
export const ShieldCheckIcon = ShieldCheck;

export default {
  Activity,
  ArrowLeft,
  Award,
  Bell,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Eye,
  Globe,
  Headphones,
  Heart,
  Home,
  Loader2,
  LogOut,
  MessageCircle,
  Minus,
  Moon,
  Pause,
  Play,
  PlayCircle,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  Send,
  Share2,
  Shield,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  User,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
  Zap,
  AlertTriangle,
  BarChart3,
};
