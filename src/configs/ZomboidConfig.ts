import { PopAppearance, PopStats, PopType } from "../@types/Pop"

export const DEFAULT_ZOMBOID_STATS: PopStats = {
    popType: PopType.zomboid,
    size: 10,
    range: 150,
    speed: 0.5,
}

export const DEFAULT_ZOMBOID_APPEARANCE: PopAppearance = {
    bodyColor: 'rgb(70, 250, 100)',
    bodyBorderColor: "black",
    bodyBorderWidth: 5,
    sensorBorderColor: "black",
    sensorFillColor: "rgba(255, 255, 255, 0)",
}