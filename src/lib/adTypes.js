// Ad / marketplace posting types. 10+ categories used across the public listings
// page and the admin Ads editor. Keep labels stable — they're stored on each ad.
import {
  FiLayers,
  FiTruck,
  FiPenTool,
  FiTool,
  FiCompass,
  FiCpu,
  FiSun,
  FiDroplet,
  FiZap,
  FiBox,
  FiGrid,
  FiHome,
  FiBriefcase,
  FiPackage,
} from "react-icons/fi";

export const AD_TYPES = [
  { label: "Material Supply", icon: FiLayers },
  { label: "Machinery Rental", icon: FiTruck },
  { label: "Interior Styling", icon: FiPenTool },
  { label: "Construction Contracting", icon: FiTool },
  { label: "Architectural Services", icon: FiCompass },
  { label: "Smart Home Installation", icon: FiCpu },
  { label: "Landscaping & Gardens", icon: FiSun },
  { label: "Plumbing & Piping", icon: FiDroplet },
  { label: "Electrical Installations", icon: FiZap },
  { label: "Custom Woodwork", icon: FiBox },
  { label: "Metal Fabrication", icon: FiGrid },
  { label: "Painting & Finishing", icon: FiPackage },
  { label: "Property for Rent", icon: FiHome },
  { label: "Jobs & Vacancies", icon: FiBriefcase },
];

export const AD_TYPE_LABELS = AD_TYPES.map((t) => t.label);

const ICON_MAP = Object.fromEntries(AD_TYPES.map((t) => [t.label, t.icon]));
export const getAdIcon = (label) => ICON_MAP[label] || FiPackage;
