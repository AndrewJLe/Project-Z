import { PopAppearance, PopStats, PopType } from "../@types/Pop"
import { Common } from "matter-js"

export const DEFAULT_ZOMBOID_STATS: PopStats = {
    popType: PopType.zomboid,
    size: 10,
    range: 250,
    speed: 1,
    wanderDuration: 3,
    wanderDirection: { x: Common.random(-0.05, 0.05), y: Common.random(-0.05, 0.05) },
}

export const DEFAULT_ZOMBOID_APPEARANCE: PopAppearance = {
    bodyColor: 'rgb(70, 250, 100)',
    bodyBorderColor: "black",
    bodyBorderWidth: 5,
    sensorBorderColor: "black",
    sensorFillColor: "rgba(255, 255, 255, 0)",
}