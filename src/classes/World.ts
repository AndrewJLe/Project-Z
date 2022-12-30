import { cloneDeep, forEach } from "lodash";

import Matter, { Bodies, Composite, Vector, Body, Constraint, Common, Events, Engine, Query, IBodyDefinition } from "matter-js";
import { DEFAULT_POP_STATS, DEFAULT_POP_APPEARANCE } from "../configs/PopConfig";
import { DEFAULT_ZOMBOID_STATS, DEFAULT_ZOMBOID_APPEARANCE } from "../configs/ZomboidConfig";
import { DEFAULT_INFECTOID_STATS, DEFAULT_INFECTOID_APPEARANCE } from "../configs/InfectoidConfig";
import Pop, { PopStats, PopConfiguration, PopType } from "./Pop";
import { isThisTypeNode } from "typescript";
import { render } from "@testing-library/react";

export class World {
    // // Canvas configurations
    // worldConfiguration: WorldConfiguration;

    // Zomboid configurations
    zomboidConfiguration: PopConfiguration = { stats: DEFAULT_ZOMBOID_STATS, appearance: DEFAULT_ZOMBOID_APPEARANCE };

    // Humanoid configurations
    humanoidConfiguration: PopConfiguration = { stats: DEFAULT_POP_STATS, appearance: DEFAULT_POP_APPEARANCE };
    pops: Pop[] = [];
    engine: Engine;


    constructor(engine: Engine) {
        this.engine = engine;
        this.initTerrain();
        this.initPops();
        this.addCollisionEvents();
    }

    initTerrain() {
        // Create Walls
        var width_screen = window.innerWidth;
        var height_screen = window.innerHeight;
        const wall_options: IBodyDefinition = {
            label: 'terrain',
            isStatic: true,
            restitution: 1,
            friction: 0,
            slop: 0.5,
            render: {
                fillStyle: 'black',
                strokeStyle: 'black',
                lineWidth: 1
            }
        }
        var wall_thickness = 10;
        var walls = [
            // x pos (center of shape), y pos, width, height, options
            Bodies.rectangle(width_screen / 2, height_screen, width_screen, wall_thickness, wall_options), // Bottom wall
            Bodies.rectangle(width_screen / 2, 0, width_screen, wall_thickness, wall_options), // Top wall
            Bodies.rectangle(width_screen, height_screen / 2, wall_thickness, height_screen, wall_options), // Right wall
            Bodies.rectangle(0, height_screen / 2, wall_thickness, height_screen, wall_options), // Left wall
            // Bodies.rectangle(width_screen / 2, height_screen / 2, wall_thickness, height_screen, wall_options), // Middle wall
        ];

        Composite.add(this.engine.world, walls)
    }

    initPops() {
        for (let i = 0; i < 50; i++) {
            const pop = new Pop(
                i,
                Vector.create(Common.random(0, window.innerWidth), Common.random(0, window.innerHeight)), // position
                Vector.create(Common.random(-0.1, 0.1), Common.random(-0.1, 0.1)), // velocity
                Math.random() < 0.9 ? cloneDeep(this.humanoidConfiguration) : cloneDeep(this.zomboidConfiguration), // type
            );

            Body.applyForce(pop.body, pop.position, { x: Common.random(-pop.stats.speed, pop.stats.speed), y: Common.random(-pop.stats.speed, pop.stats.speed) });

            Composite.add(this.engine.world, pop.composite);

            this.pops.push(pop);
        }


        // for (let i = 0; i < 10; i++) {
        //     const pop = new Pop(
        //         i,
        //         Vector.create(Common.random(0, window.innerWidth / 2), Common.random(0, window.innerHeight)), // position
        //         Vector.create(Common.random(-0.1, 0.1), Common.random(-0.1, 0.1)), // velocity
        //         this.zomboidConfiguration
        //     );

        //     Composite.add(this.engine.world, pop.composite);
        //     this.pops.push(pop);
        // }

        // for (let i = 0; i < 10; i++) {
        //     const pop = new Pop(
        //         i,
        //         Vector.create(Common.random(window.innerWidth / 2, window.innerWidth), Common.random(0, window.innerHeight)), // position
        //         Vector.create(Common.random(-0.1, 0.1), Common.random(-0.1, 0.1)), // velocity
        //         this.humanoidConfiguration
        //     );

        //     Composite.add(this.engine.world, pop.composite);
        //     this.pops.push(pop);
        // }
    }

    initMatter() {

    }

    getPopFromBodyLabel(bodyLabel: string): Pop | null {
        return this.pops[parseInt(bodyLabel)] ?? null;
    }

    encounterPop(pop: Pop, otherPop: Pop) {
        if ((pop.stats.popType === PopType.humanoid && otherPop.stats.popType === PopType.zomboid) || (pop.stats.popType === PopType.zomboid && otherPop.stats.popType === PopType.humanoid)) {
            if (pop.stats.popType === PopType.humanoid) { // Zomboids infect Humanoids during collisions
                this.infectPop(pop);
            }
            if (otherPop.stats.popType === PopType.humanoid) { // Zomboids infect Humanoids during collisions
                this.infectPop(otherPop);
            }
        }
    }

    detectPop(pop: Pop, otherPop: Pop) {
        switch (pop.stats.popType) {
            case PopType.humanoid:
                if (otherPop.stats.popType === PopType.zomboid) {
                    // Run away
                    pop.moveTowards(Vector.sub(pop.body.position, otherPop.body.position), this.engine.timing.lastDelta);
                }
                break;
            case PopType.zomboid:
                if (otherPop.stats.popType === PopType.humanoid) {
                    // Give chase
                    pop.moveTowards(Vector.sub(otherPop.body.position, pop.body.position), this.engine.timing.lastDelta);
                }
                break;
        }
    }

    infectPop(pop: Pop) {
        // Infection period
        pop.setStats(cloneDeep(DEFAULT_INFECTOID_STATS));
        pop.setAppearance(cloneDeep(DEFAULT_INFECTOID_APPEARANCE));
        this.transitionToZomboid(pop, DEFAULT_INFECTOID_APPEARANCE.bodyColor, DEFAULT_ZOMBOID_APPEARANCE.bodyColor, 5000);
    }

    transitionToZomboid(pop: Pop, inputRGB: string, targetRGB: string, timeToInfect: number) {
        const bittenTime = this.engine.timing.timestamp;
        const inputValues = (inputRGB.match(/\d+/g) ?? []).map(Number);
        const targetValues = (targetRGB.match(/\d+/g) ?? []).map(Number);
        const difference = inputValues.map((input, index) => targetValues[index] - input);

        const interval = setInterval(() => {
            const timeSinceBitten = this.engine.timing.timestamp - bittenTime;
            const percentageInfected = timeSinceBitten / timeToInfect;

            const currentColor = inputValues.map((value, index) => {
                const step = difference[index] * percentageInfected;
                return value + step;
            });

            if (timeSinceBitten >= timeToInfect) {
                clearInterval(interval);
                // Turns into zomboid
                pop.setStats(cloneDeep(DEFAULT_ZOMBOID_STATS));
                pop.setAppearance(cloneDeep(DEFAULT_ZOMBOID_APPEARANCE));
            }

            pop.setAppearance({ bodyColor: `rgb(${currentColor.join(',')})` });
        }, 10);
    }

    // Returns the closest Pop from this pop
    castRays(pop: Pop) {
        // More rays --> better scan at the cost of performance
        var closestPop = pop;
        var closestDistance = Infinity;
        for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 16) {
            var scaledDirection = Vector.mult(Vector.create(Math.cos(angle), Math.sin(angle)), pop.stats.range)
            var endRayPosition = Vector.add(pop.body.position, scaledDirection);
            var detectedObjects = Query.ray(Composite.allBodies(this.engine.world), pop.position, endRayPosition, 10);
            // note: the pop casting the rays will always be detected by the rays
            // we can offset this by checking the id number of the pop casting the ray or by ignoring the 0th index (?)
            for (let i = 1; i < detectedObjects.length; i++) {
                // Any pop behind a wall will not be considered/detected
                if (detectedObjects[i].bodyA.label === 'terrain') break;
                const otherPop = this.getPopFromBodyLabel(detectedObjects[i].bodyA.label);
                if (otherPop === null) break;
                // Keep track of the closest pop
                var currentDistance = Math.hypot(Math.abs(pop.body.position.x - otherPop.body.position.x), Math.abs(pop.body.position.y - otherPop.body.position.y));
                if (currentDistance <= closestDistance) {
                    closestPop = otherPop;
                }
            }
            this.detectPop(pop, closestPop);
        }
    }

    addCollisionEvents() {
        // Encounter event
        Events.on(this.engine, 'collisionActive', (event) => {
            var pairs = event.pairs;
            // Loop through the pairs of all colliding bodies
            pairs.forEach(({ bodyA, bodyB }) => {
                // Ignore terrain
                if (bodyA.label === "terrain" || bodyB.label === "terrain") return;

                const popA = this.getPopFromBodyLabel(bodyA.label);
                const popB = this.getPopFromBodyLabel(bodyB.label);

                // Ignore non-pop collisions
                if (popA === null || popB === null) return;

                // Begin encounter between the two colliding pops
                this.encounterPop(popA, popB);
            });
        });

        // Before Update
        Events.on(this.engine, 'beforeUpdate', (event) => {
            this.pops.forEach((pop) => {
                this.castRays(pop);
                if (pop.stats.popType === PopType.infectoid) {
                    Body.applyForce(pop.body, pop.position, { x: Common.random(-0.03, 0.03), y: Common.random(-0.03, 0.03) });
                }
            });
        });
    };
};
