import { PopAppearance, PopStats, PopType } from "../@types/Pop"
import { DEFAULT_POP_APPEARANCE } from "./PopConfig"

export const DEFAULT_INFECTOID_STATS: PopStats = {
    popType: PopType.infectoid,
    size: 10,
    range: 250,
    speed: 1.1,
}

export const DEFAULT_INFECTOID_APPEARANCE: PopAppearance = {
    bodyColor: DEFAULT_POP_APPEARANCE.bodyColor,
    bodyBorderColor: "black",
    bodyBorderWidth: 5,
    sensorBorderColor: "black",
    sensorFillColor: "rgba(255, 255, 255, 0)",
}