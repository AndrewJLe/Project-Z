import Matter, { Bodies, Composite, Vector, Body, Constraint, Common } from "matter-js";
import { DEFAULT_ZOMBOID_CONFIGURATION } from "../configs/ZomboidConfig";

import { World } from "./World";

export interface WorldConfiguration {
    worldOffset: number;
    worldWidth: number;
    worldHeight: number;
}

/**
 * 
 */
export interface PopConfiguration {
    // Body
    size: number;
    // Stats
    range: number
    // Colors
    bodyColor: string;
    bodyBorderColor: string;
    bodyBorderWidth: number;
    sensorFillColor: string;
    sensorBorderColor: string;
}

export enum PopType {
    "humanoid" = "Humanoid",
    "zomboid" = "Zomboid"
}

class Pop {
    // Traits
    id: number;
    popType: PopType;
    speed: number;
    position: Vector;
    velocity: Vector;
    cachedForces: Vector[];

    // Physical bodies
    composite: Composite;
    body: Body;
    sensor: Body;
    constraint: Constraint;


    constructor(id: number, position: Vector, velocity: Vector, popType: PopType, popConfiguration: PopConfiguration) {
        this.id = id;
        this.speed = 0.005;
        this.position = position;
        this.velocity = velocity;
        this.cachedForces = [];
        this.popType = popType;
        this.body = this.createBody(popConfiguration);
        this.sensor = this.createSensor(popConfiguration.range);
        this.constraint = this.createConstraint();
        this.composite = this.createComposite();
    }

    createComposite() {
        const composite = Composite.create({ id: this.id });

        Composite.add(composite, this.body);
        Composite.add(composite, this.sensor);
        Composite.add(composite, this.constraint);

        return composite;
    }

    createBody({ size, bodyBorderColor, bodyBorderWidth, bodyColor }: PopConfiguration): Body {
        const body = Bodies.circle(
            this.position.x,
            this.position.y,
            size,
            {
                label: this.id.toString(),
                friction: 0,
                frictionAir: 0.15, // helps prevents bouncing upon collision
                frictionStatic: 0,
                restitution: 0,
                render: {
                    fillStyle: this.popType === PopType.humanoid ? bodyColor : DEFAULT_ZOMBOID_CONFIGURATION.bodyColor,
                    strokeStyle: bodyBorderColor,
                    lineWidth: bodyBorderWidth,
                }
            }
        );
        Body.setMass(body, 20);
        // Body.setDensity(body, 0.001);

        return body;
    }

    createSensor(visionRange: number): Body {
        const sensorBody = Bodies.circle(
            this.position.x,
            this.position.y,
            visionRange,
            {
                isSensor: true,
                label: this.id.toString(),
                friction: 0,
                frictionAir: 0,
                frictionStatic: 0,
                restitution: 0,
                render: {
                    fillStyle: "rgba(255, 255, 255, 0)",
                    strokeStyle: "black",
                    lineWidth: 0,
                }
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

    moveTowards(direction: Vector): void {
        // const desiredDirection = Common.chain(
        //     // @ts-ignore
        //     Vector.clone, Vector.normalise, (vec: Vector) => Vector.mult(vec, 100)
        // )(direction);

        const desiredVelocity = Vector.mult(Vector.normalise(Vector.clone(direction)), 1);

        const steerDirection = Vector.sub(desiredVelocity, this.body.velocity);

        // Cache the force to be applied upon engine update
        if (this.cachedForces.length === 0) {
            this.cachedForces.push(steerDirection);

        }
    }
}

export default Pop;