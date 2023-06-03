import { cloneDeep } from "lodash";
import Matter, { Bodies, Composite, Vector, Body, Constraint } from "matter-js";

import { PopAppearance, PopConfiguration, PopStats, PopType } from "../@types/Pop";

import { DetectedObjects, DETECTED_OBJECTS } from "../configs/DetectedObjects";
import { Common } from "matter-js";

export interface WorldConfiguration {
    worldOffset: number;
    worldWidth: number;
    worldHeight: number;
}

class Pop {
    id: number;
    terrainDetected: Boolean;
    stats: PopStats;
    appearance: PopAppearance;
    detectedObjects: DetectedObjects;

    // Physical bodies
    composite: Composite;
    body: Body;
    sensor: Body;
    constraint: Constraint;

    constructor(id: number, position: Vector, velocity: Vector, popConfiguration: PopConfiguration) {
        this.id = id;
        this.stats = popConfiguration.stats;
        this.appearance = popConfiguration.appearance;
        this.body = this.createBody(position);
        this.sensor = this.createSensor(position);
        this.constraint = this.createConstraint();
        this.composite = this.createComposite();
        this.setAppearance(this.appearance);
        this.terrainDetected = false;
        this.detectedObjects = cloneDeep(DETECTED_OBJECTS);
    }

    setStats(stats: Partial<PopStats>) {
        Object.assign(this.stats, stats);
    }

    setAppearance(appearance: Partial<PopAppearance>) {
        Object.assign(this.appearance, appearance);
        const bodyRender = {
            fillStyle: this.appearance.bodyColor,
            strokeStyle: this.appearance.bodyBorderColor,
            lineWidth: this.appearance.bodyBorderWidth,
        }

        Object.assign(this.body.render, bodyRender);

        const sensorRender = {
            fillStyle: "rgba(255, 255, 255, 0)",
            strokeStyle: "black",
            lineWidth: 0,
        }

        Object.assign(this.sensor.render, sensorRender);
    }

    createComposite() {
        const composite = Composite.create({ id: this.id });

        Composite.add(composite, this.body);
        Composite.add(composite, this.sensor);
        Composite.add(composite, this.constraint);

        return composite;
    }

    createBody(position: Vector): Body {
        const body = Bodies.circle(
            position.x,
            position.y,
            this.stats.size,
            {
                label: this.id.toString(),
                friction: 0,
                frictionAir: 0.3, // helps prevents bouncing upon collision
                frictionStatic: 0,
                restitution: 0.1,
            }
        );

        Body.setMass(body, 20);

        return body;
    }

    createSensor(position: Vector): Body {
        const sensorBody = Bodies.circle(
            position.x,
            position.y,
            this.stats.range,
            {
                isSensor: true,
                label: this.id.toString(),
                friction: 0,
                frictionAir: 0,
                frictionStatic: 0,
                restitution: 0,
            }

        );

        return sensorBody;
    }

    createConstraint(): Constraint {
        const constraint: Constraint = Constraint.create({
            bodyA: this.body,
            bodyB: this.sensor,
            stiffness: 1,
            render: {
                lineWidth: 0,
            }
        });

        return constraint;
    }

    moveTowards(direction: Vector, deltaT: number): void {
        const desiredVelocity = Vector.mult(Vector.normalise(Vector.clone(direction)), this.stats.speed);
        const steerDirection = Vector.normalise(Vector.sub(desiredVelocity, this.body.velocity));
        const steeringForce = Vector.mult(steerDirection, 20);
        const impulse = Vector.mult(steeringForce, deltaT * 0.001);

        Body.setVelocity(this.body, Vector.add(this.body.velocity, impulse));
    }

    smartPathing(filteredDetectedObjects: DetectedObjects): Vector {
        if (this.id === 0) {
            debugger;
        }
        const angles = calculateAbsoluteAngles(this, filteredDetectedObjects)
        if (angles.length === 0) return Vector.create(0, 0);
        else if (angles.length === 1) angles.push(angles[0] + 0.0001);

        const gap = findLargestGap(angles);
        const bestPath = bisectLargestAngles(gap);
        return bestPath;
    }

    /**
     * Pops will wander in random directions while no one is in their FOV
     */
    wander(pop: Pop, x: number, y: number, duration: number, deltaT: number) {
        if (pop.stats.wanderDuration > 0) {
            pop.stats.wanderDuration -= 1
            this.moveTowards(Vector.create(x, y), deltaT)
        }
        else {
            pop.stats.wanderDuration = duration
            pop.stats.wanderDirection = { x: Common.random(-0.05, 0.05), y: Common.random(-0.05, 0.05) }
        }
    }
}

function calculateAbsoluteAngles(pop: Pop, filteredDetectedObjects: DetectedObjects): number[] {
    function getAngle(object: Pop | Body) {
        if (object instanceof Pop) {
            if (object.stats.popType === PopType.zomboid || object.stats.popType === PopType.infectoid) return getPointAngle(object);
        };

        // Using this to handle line walls for now
        return NaN;
    }

    function getPointAngle(otherPop: Pop): number {
        const vectorToPop = Vector.sub(otherPop.body.position, pop.body.position);
        return Vector.angle(vectorToPop, Vector.create(0, 0));
    }

    const angles = Object.values(filteredDetectedObjects).flat().map(getAngle).filter((angle) => !isNaN(angle));

    return angles;
}

/**
 * Finds the 2 consective angles with the largest gap between them
 */
function findLargestGap(angles: number[]): [number, number] {
    angles.sort((a, b) => a - b)
    let largestGap = -1
    let angleA = 0
    let angleB = 0
    for (let i = 0; i < angles.length - 1; i++) {
        const currentGap = angles[i + 1] - angles[i]
        if (currentGap > largestGap) {
            largestGap = currentGap
            angleA = angles[i]
            angleB = angles[i + 1]
        }
    }
    var wrap = angles[0] - angles[angles.length - 1];
    wrap = (2 * Math.PI) + wrap
    if (wrap > largestGap) {
        angleA = angles[angles.length - 1];
        angleB = angles[0];
    }

    return [angleA, angleB]
}

/**
 * Finds a vector that bisects 2 angles
 */
function bisectLargestAngles(angles: [number, number]): Matter.Vector {
    let diff = angles[1] - angles[0];
    if (diff < 0) diff += 2 * Math.PI;
    diff /= 2;
    const bisectionAngle = angles[0] + diff;
    const bisector = Vector.create(-1, 0)
    const bestVector = Vector.rotate(bisector, bisectionAngle);
    return bestVector;
}

export default Pop;