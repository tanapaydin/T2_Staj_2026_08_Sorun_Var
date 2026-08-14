import { Colors } from "../theme/colors";

export function getMarkerColor(category: string) {
  switch (category) {
    case "road":
      return Colors.category.road;
    case "trash":
      return Colors.category.trash;
    case "lighting":
      return Colors.category.lighting;
    case "construction":
      return Colors.category.construction;
    case "water":
      return Colors.category.water;
    case "park":
      return Colors.category.park;
    case "traffic":
      return Colors.category.traffic;
    case "noise":
      return Colors.category.noise;
    case "animal":
      return Colors.category.animal;
    default:
      return Colors.category.other;
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
