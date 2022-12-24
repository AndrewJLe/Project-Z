import { cloneDeep } from "lodash";

import Matter, { Bodies, Composite, Vector, Body, Constraint, Common, Events, Engine } from "matter-js";
import { DEFAULT_POP_STATS, DEFAULT_POP_APPEARANCE } from "../configs/PopConfig";
import { DEFAULT_ZOMBOID_STATS, DEFAULT_ZOMBOID_APPEARANCE } from "../configs/ZomboidConfig";
import { DEFAULT_INFECTOID_STATS, DEFAULT_INFECTOID_APPEARANCE } from "../configs/InfectoidConfig";
import Pop, { PopStats, PopConfiguration, PopType } from "./Pop";

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
        this.initPops();
        this.addCollisionEvents();
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

    addCollisionEvents() {
        // Encounter event
        Events.on(this.engine, 'collisionActive', (event) => {
            var pairs = event.pairs;
            // Loop through the pairs of all colliding bodies
            pairs.forEach(({ bodyA, bodyB }) => {
                // Ignore sensors colliding with other sensors
                if (bodyA.isSensor || bodyB.isSensor) return;

                const popA = this.getPopFromBodyLabel(bodyA.label);
                const popB = this.getPopFromBodyLabel(bodyB.label);

                // Ignore non-pop collisions
                if (popA === null || popB === null) return;

                // Begin encounter between the two colliding pops
                this.encounterPop(popA, popB);
            });
        });

        // Detection event
        Events.on(this.engine, 'collisionActive', ({ pairs }) => {
            pairs.forEach(({ bodyA, bodyB }) => {
                // Is detection event if one body is sensor and the other body is not
                if (bodyA.label === bodyB.label) return;
                if (bodyA.isSensor === bodyB.isSensor) return;

                const popA = this.getPopFromBodyLabel(bodyA.label);
                const popB = this.getPopFromBodyLabel(bodyB.label);

                if (popA === null || popB === null) return;

                if (bodyA.isSensor) {
                    this.detectPop(popA, popB);
                } else {
                    this.detectPop(popB, popA);
                }
            });
        });

        // Before Update
        Events.on(this.engine, 'beforeUpdate', (event) => {
            this.pops.forEach((pop) => {
                if (pop.stats.popType === PopType.infectoid) {
                    Body.applyForce(pop.body, pop.position, { x: Common.random(-0.05, 0.05), y: Common.random(-0.05, 0.05) });
                }
            });
        });
    };
};
