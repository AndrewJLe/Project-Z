import { forEach } from "lodash";
import Matter, { Bodies, Composite, Vector, Body, Constraint, Common, Engine, Query } from "matter-js";

import { World } from "./World";

export interface WorldConfiguration {
    worldOffset: number;
    worldWidth: number;
    worldHeight: number;
}

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

class Pop {
    id: number;
    position: Vector;
    cachedForces: Vector[];

    stats: PopStats;
    appearance: PopAppearance;

    // Physical bodies
    composite: Composite;
    body: Body;
    // sensor: Body;
    // constraint: Constraint;

    constructor(id: number, position: Vector, velocity: Vector, popConfiguration: PopConfiguration) {
        this.id = id;
        this.position = position;
        this.cachedForces = [];
        this.stats = popConfiguration.stats;
        this.appearance = popConfiguration.appearance;
        this.body = this.createBody();
        // this.sensor = this.createSensor();
        // this.constraint = this.createConstraint();
        this.composite = this.createComposite();

        this.setAppearance(this.appearance);
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

        // const sensorRender = {
        //     fillStyle: "rgba(255, 255, 255, 0)",
        //     strokeStyle: "black",
        //     lineWidth: 0,
        // }
        // Object.assign(this.sensor.render, sensorRender);
    }

    createComposite() {
        const composite = Composite.create({ id: this.id });

        Composite.add(composite, this.body);
        // Composite.add(composite, this.sensor);
        // Composite.add(composite, this.constraint);

        return composite;
    }

    createBody(): Body {
        const body = Bodies.circle(
            this.position.x,
            this.position.y,
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

    // createSensor(): Body {
    //     const sensorBody = Bodies.circle(
    //         this.position.x,
    //         this.position.y,
    //         this.stats.range,
    //         {
    //             isSensor: true,
    //             label: this.id.toString(),
    //             friction: 0,
    //             frictionAir: 0,
    //             frictionStatic: 0,
    //             restitution: 0,
    //         }
    //     );

    //     return sensorBody;
    // }

    // createConstraint(): Constraint {
    //     const constraint: Constraint = Constraint.create({
    //         bodyA: this.body,
    //         bodyB: this.sensor,
    //         stiffness: 1,
    //         render: {
    //             lineWidth: 0,
    //         }
    //     });
    //     return constraint;
    // }

    moveTowards(direction: Vector, deltaT: number): void {
        const desiredVelocity = Vector.mult(Vector.normalise(Vector.clone(direction)), 1.5);

        const steerDirection = Vector.normalise(Vector.sub(desiredVelocity, this.body.velocity));
        const steeringForce = Vector.mult(steerDirection, 20);

        const impulse = Vector.mult(steeringForce, deltaT * 0.001);

        Body.setVelocity(this.body, Vector.add(this.body.velocity, impulse));
    }
}

export default Pop;