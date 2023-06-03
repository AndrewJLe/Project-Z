import { PopAppearance, PopStats, PopType } from "../@types/Pop"
import { Common } from "matter-js"

export const DEFAULT_POP_STATS: PopStats = {
    popType: PopType.humanoid,
    size: 10,
    range: 200,
    speed: 0.9,
    wanderDuration: 3,
    wanderDirection: { x: Common.random(-0.05, 0.05), y: Common.random(-0.05, 0.05) },
}

export const DEFAULT_POP_APPEARANCE: PopAppearance = {
    bodyColor: "rgb(255, 255, 255)",
    bodyBorderColor: "black",
    bodyBorderWidth: 5,
    sensorBorderColor: "black",
    sensorFillColor: "rgba(255, 255, 255, 0)",
}
