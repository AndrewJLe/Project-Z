import Matter, { Bodies, Composite, Vector, Body, Constraint, Common, Events, Engine } from "matter-js";
import { DEFAULT_POP_CONFIGURATION } from "../configs/PopConfig";
import { DEFAULT_ZOMBOID_CONFIGURATION } from "../configs/ZomboidConfig";
import Pop, { PopType, PopConfiguration } from "./Pop";

export class World {
    // // Canvas configurations
    // worldConfiguration: WorldConfiguration;

    // Zomboid configurations
    zomboidConfiguration: PopConfiguration = DEFAULT_ZOMBOID_CONFIGURATION;

    // Humanoid configurations
    humanoidConfiguration: PopConfiguration = DEFAULT_POP_CONFIGURATION;
    pops: Pop[] = [];
    engine: Engine;


    constructor(engine: Engine) {
        this.engine = engine;
        this.initPops();
        this.addCollisionEvents();
    }

    initPops() {
        for (let i = 0; i < 50; i++) {
            const popType = Math.random() < 0.9 ? PopType.humanoid : PopType.zomboid
            const pop = new Pop(
                i,
                Vector.create(Common.random(0, window.innerWidth), Common.random(0, window.innerHeight)),
                Vector.create(Common.random(-0.1, 0.1), Common.random(-0.1, 0.1)),
                popType,
                PopType.humanoid ? DEFAULT_POP_CONFIGURATION : DEFAULT_ZOMBOID_CONFIGURATION,
            );

            Body.applyForce(pop.body, pop.position, { x: Common.random(-0.1, 0.1), y: Common.random(-0.1, 0.1) });

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
        if ((pop.popType === PopType.humanoid && otherPop.popType === PopType.zomboid) || (pop.popType === PopType.zomboid && otherPop.popType === PopType.humanoid)) {
            if (pop.popType === PopType.humanoid) { // Zomboids infect Humanoids during collisions
                this.infectPop(pop);
            }
            if (otherPop.popType === PopType.humanoid) { // Zomboids infect Humanoids during collisions
                this.infectPop(otherPop);
            }
        }
    }

    detectPop(pop: Pop, otherPop: Pop) {
        switch (pop.popType) {
            case PopType.humanoid:
                if (otherPop.popType === PopType.zomboid) {
                    // Run away
                    pop.moveTowards(Vector.sub(pop.body.position, otherPop.body.position));
                }
                break;
            case PopType.zomboid:
                if (otherPop.popType === PopType.humanoid) {
                    // Give chase
                    pop.moveTowards(Vector.sub(otherPop.body.position, pop.body.position));
                }
                break;
        }
    }

    infectPop(pop: Pop) {
        pop.popType = PopType.zomboid;
        pop.body.render.fillStyle = this.zomboidConfiguration.bodyColor;
    }

    addCollisionEvents() {
        // Encounter event
        Events.on(this.engine, 'collisionStart', (event) => {
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
            // Loop through pops and apply cached velocity
            this.pops.forEach((pop) => {
                if (pop.cachedForces.length > 0) {
                    const steerDirection = pop.cachedForces.pop() ?? { x: 0, y: 0 };;
                    Matter.Body.applyForce(pop.body, pop.position, Vector.mult(steerDirection, 0.01));
                }
                // Pops randomly move while "idle"
                else {
                    Body.applyForce(pop.body, pop.position, { x: Common.random(-0.03, 0.03), y: Common.random(-0.03, 0.03) });
                }
                // Janky speed check?
                if (pop.body.speed > 1) {
                    Matter.Body.setVelocity(pop.body, Vector.mult(pop.body.velocity, 0.1))
                }
            });
        });
    };
}