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
} from "react-icons/fi";

import client1 from "../src/assets/client1.png";
import client2 from "../src/assets/client2.png";
import client3 from "../src/assets/client3.png";

export const allservices = [
  {
    icon: FiPenTool,
    title: "Interior Design",
    about:
      "Bespoke interiors that balance comfort, elegance and function — tailored to how you live and work.",
  },
  {
    icon: FiGrid,
    title: "Space Planning",
    about:
      "Considered layouts that make every square metre purposeful, with light and flow at the centre.",
  },
  {
    icon: FiBox,
    title: "Custom Furniture",
    about:
      "Made-to-measure joinery and furniture crafted with skilled artisans and refined materials.",
  },
  {
    icon: FiLayers,
    title: "Material Selection",
    about:
      "Curated palettes of finishes, textures and tones sourced from top-tier suppliers.",
  },
  {
    icon: FiTool,
    title: "High-end Finishing",
    about:
      "Meticulous detailing and finishing that elevate a space into something timeless.",
  },
  {
    icon: FiHome,
    title: "Renovation & Fit-out",
    about:
      "Turnkey renovation and fit-out, managed end-to-end for a seamless, on-time delivery.",
  },
];

export const planning = [
  {
    icon: FiSearch,
    step: "01",
    title: "Discover",
    about:
      "We listen, measure and research — establishing goals, requirements and a clear brief.",
  },
  {
    icon: FiCompass,
    step: "02",
    title: "Design",
    about:
      "Concepts, mood boards and 3D visuals that bring a considered, user-centred vision to life.",
  },
  {
    icon: FiTool,
    step: "03",
    title: "Build",
    about:
      "Skilled artisans execute with precision, keeping craft and detail at the forefront.",
  },
  {
    icon: FiCheckCircle,
    step: "04",
    title: "Finish",
    about:
      "Styling, snagging and handover — a flawless space, delivered and ready to enjoy.",
  },
];

export const clients = [
  {
    image: client1,
    name: "Alex Parker",
    post: "Residential Client",
    quote:
      "HAVI'S DESIGN reimagined our home with a calm, timeless palette. Every detail was considered and the finish is impeccable.",
  },
  {
    image: client2,
    name: "Drew James",
    post: "Hospitality Director",
    quote:
      "From planning to handover the process was seamless. The space feels elevated yet effortless — exactly what we wanted.",
  },
  {
    image: client3,
    name: "Sam Peterson",
    post: "Office Owner",
    quote:
      "Craftsmanship you can feel. The team balanced function and beauty and delivered ahead of schedule.",
  },
];
