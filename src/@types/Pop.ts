export interface PopConfiguration {
    stats: PopStats;
    appearance: PopAppearance;
}

export interface PopAppearance {
    bodyColor: string;
    bodyBorderColor: string;
    bodyBorderWidth: number;
    sensorFillColor: string;
    sensorBorderColor: string;
}

export enum PopType {
    "humanoid" = "Humanoid",
    "zomboid" = "Zomboid",
    "infectoid" = "Infectoid",
}

export interface PopStats {
    popType: PopType;
    size: number;
    range: number;
    speed: number;
}