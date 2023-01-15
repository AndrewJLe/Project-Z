import { Body } from "matter-js";
import { PopType } from "../@types/Pop"
import Pop from "../classes/Pop";

export type DetectedObjects = {
    terrain: Body[];
} & DetectedPops;

export type DetectedPops = {
    [popType in PopType]: Pop[];
};

export const DETECTED_OBJECTS: DetectedObjects = {
    [PopType.humanoid]: [],
    [PopType.zomboid]: [],
    [PopType.infectoid]: [],
    terrain: [],
}