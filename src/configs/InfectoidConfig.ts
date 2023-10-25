import { PopAppearance, PopStats, PopType } from "../@types/Pop"
import { DEFAULT_POP_APPEARANCE } from "./PopConfig"
import { Common } from "matter-js"

export const DEFAULT_INFECTOID_STATS: PopStats = {
    popType: PopType.infectoid,
    size: 10,
    range: 250,
    speed: 1.1,
    wanderDuration: 3,
    wanderDirection: { x: Common.random(-0.05, 0.05), y: Common.random(-0.05, 0.05) },
}

export const DEFAULT_INFECTOID_APPEARANCE: PopAppearance = {
    bodyColor: DEFAULT_POP_APPEARANCE.bodyColor,
    bodyBorderColor: "black",
    bodyBorderWidth: 5,
    sensorBorderColor: "black",
    sensorFillColor: "rgba(255, 255, 255, 0)",
}