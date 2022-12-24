import { PopAppearance, PopStats, PopType } from "../classes/Pop"

export const DEFAULT_POP_STATS: PopStats = {
    popType: PopType.humanoid,
    size: 10,
    range: 200,
    speed: 1,
}

export const DEFAULT_POP_APPEARANCE: PopAppearance = {
    bodyColor: "rgb(255, 255, 255)",
    bodyBorderColor: "black",
    bodyBorderWidth: 5,
    sensorBorderColor: "black",
    sensorFillColor: "rgba(255, 255, 255, 0)",
}
