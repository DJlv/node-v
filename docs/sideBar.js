import {
  generateAllSidebars,
  generateHomeFeaturesMap,
  generateNavbar,
} from "../utils/auto-gen-sidebar.mjs";

export const navbar = generateNavbar();
export const sidebar = generateAllSidebars();
export const homeFeaturesMap = generateHomeFeaturesMap();
