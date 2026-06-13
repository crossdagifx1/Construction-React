// Registry mapping icon names (stored in the DB) to react-icons components.
// The admin picks from these names; sections render the matching component.
import {
  FiPenTool,
  FiGrid,
  FiLayers,
  FiHome,
  FiTool,
  FiHeadphones,
  FiSearch,
  FiCompass,
  FiBox,
  FiCheckCircle,
  FiStar,
  FiDroplet,
  FiSun,
  FiFeather,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";

export const ICONS = {
  FiPenTool,
  FiGrid,
  FiLayers,
  FiHome,
  FiTool,
  FiHeadphones,
  FiSearch,
  FiCompass,
  FiBox,
  FiCheckCircle,
  FiStar,
  FiDroplet,
  FiSun,
  FiFeather,
  FiAward,
  FiTrendingUp,
};

export const ICON_NAMES = Object.keys(ICONS);

// Returns a component, falling back to a sensible default.
export const getIcon = (name) => ICONS[name] || FiStar;
