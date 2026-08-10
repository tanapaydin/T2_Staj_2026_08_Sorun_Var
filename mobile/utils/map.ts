import { Colors } from "../theme";

export function getMarkerColor(category: string) {
  switch (category) {
    case "road":
      return Colors.road;
    case "trash":
      return Colors.trash;
    case "lighting":
      return Colors.lighting;
    case "construction":
      return Colors.construction;
    case "water":
      return Colors.water;
    case "park":
      return Colors.park;
    case "traffic":
      return Colors.traffic;
    case "noise":
      return Colors.noise;
    case "animal":
      return Colors.animal;
    default:
      return Colors.other;
  }
}

export function getCategoryLabel(category: string) {
  switch (category) {
    case "road":
      return "Yol";
    case "trash":
      return "Çöp";
    case "lighting":
      return "Aydınlatma";
    case "construction":
      return "İnşaat";
    case "water":
      return "Su";
    case "park":
      return "Park";
    case "traffic":
      return "Trafik";
    case "noise":
      return "Gürültü";
    case "animal":
      return "Hayvan";
    default:
      return "Diğer";
  }
}