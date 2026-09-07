import React from "react";
import { Image, StyleSheet } from "react-native";
import type { TableOrientation } from "../layout/tableLayout";

export function TableSurface({ orientation }: { orientation: TableOrientation }) {
  const source =
    orientation === "landscape"
      ? require("../../assets/images/ssun-table-landscape.png")
      : require("../../assets/images/ssun-table-portrait.png");
  return <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />;
}
