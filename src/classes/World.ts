import { cloneDeep } from "lodash";

import Matter, { Bodies, Composite, Vector, Body, Constraint, Common, Events, Engine, IBodyDefinition, Pairs, Query, IEventCollision } from "matter-js";
import { DEFAULT_POP_STATS, DEFAULT_POP_APPEARANCE } from "../configs/PopConfig";
import { DEFAULT_ZOMBOID_STATS, DEFAULT_ZOMBOID_APPEARANCE } from "../configs/ZomboidConfig";
import { DEFAULT_INFECTOID_STATS, DEFAULT_INFECTOID_APPEARANCE } from "../configs/InfectoidConfig";
import { PopConfiguration, PopType } from "../@types/Pop";
import Pop from "./Pop";
import { DetectedObjects, DETECTED_OBJECTS } from "../configs/DetectedObjects";

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
        this.handlePairCollisionStart = this.handlePairCollisionStart.bind(this);
        this.engine = engine;
        this.initTerrain();
        this.initPops();
        this.addCollisionEvents();
    }

    initTerrain() {
        // Create Border Walls
        const width_screen = window.innerWidth;
        const height_screen = window.innerHeight;
        const wall_thickness = 10;
        const wall_options: IBodyDefinition = {
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
        var walls = [
            // x pos (center of shape), y pos, width, height, options
            Bodies.rectangle(width_screen / 2, height_screen, width_screen, wall_thickness, wall_options), // Bottom wall
            Bodies.rectangle(width_screen / 2, 0, width_screen, wall_thickness, wall_options), // Top wall
            Bodies.rectangle(width_screen, height_screen / 2, wall_thickness, height_screen, wall_options), // Right wall
            Bodies.rectangle(0, height_screen / 2, wall_thickness, height_screen, wall_options), // Left wall
            Bodies.rectangle(width_screen / 2, height_screen / 2, 20, 250, wall_options),// Middle wall
            Bodies.rectangle(width_screen / 4, height_screen / 4, 30, 250, wall_options), // Middle wall
            Bodies.rectangle(width_screen / 1.2, height_screen / 1.3, 100, 100, wall_options), // Middle wall
        ];

        Composite.add(this.engine.world, walls)
    }

    initPops() {
        for (let i = 0; i < 50; i++) {
            const pop = new Pop(
                i,
                Vector.create(Math.random() * window.innerWidth, Math.random() * window.innerHeight), // position
                Vector.create(Common.random(-0.1, 0.1), Common.random(-0.1, 0.1)), // velocity
                Math.random() < 0.9 ? cloneDeep(this.humanoidConfiguration) : cloneDeep(this.zomboidConfiguration), // type
            );

            // Body.applyForce(pop.body, pop.body.position, { x: Common.random(-pop.stats.speed, pop.stats.speed), y: Common.random(-pop.stats.speed, pop.stats.speed) });

            if (i === 0) {
                pop.body.render.fillStyle = 'black'
                pop.sensor.render.lineWidth = 1
            }
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
            /**  OLD HUMANOID EVASION BEHAVIOR */
            // case PopType.humanoid:
            //     if (otherPop.stats.popType === PopType.zomboid) {
            //         // Run away
            //         pop.moveTowards(Vector.sub(pop.body.position, otherPop.body.position), this.engine.timing.lastDelta);
            //     }
            //     break;
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

    // Terrain Detection
    checkTerrain(pop: Pop) {
        // Check if terrain is detected within the sensor
        const detectedObjects = Matter.Query.collides(pop.sensor, Composite.allBodies(this.engine.world));
        for (let i = 0; i < detectedObjects.length; i++) {
            if (detectedObjects[i].bodyA.label === 'terrain') {
                pop.terrainDetected = true;
            }
        }
        pop.terrainDetected = false;
    }


    filterVisible(pop: Pop, detectedObjects: DetectedObjects): DetectedObjects {
        var visibleObjects = cloneDeep(DETECTED_OBJECTS);

        const { terrain, ...nonTerrainObjects } = detectedObjects;

        const rayStart = pop.body.position
        for (const list of Object.values(nonTerrainObjects)) {
            for (const item of list) {
                // Is this item visible?
                const rayEnd = item.body.position
                const collisions = Query.ray(terrain, rayStart, rayEnd)
                if (collisions.length > 0) {
                    break;
                }
                // pop is visible, add to respective list
                else {
                    visibleObjects[item.stats.popType].push(item);
                }
            }
        }

        visibleObjects.terrain = terrain;

        return visibleObjects
    }

    handlePairCollisionStart({ pairs }: IEventCollision<Engine>) {
        function addDetectedObject(popA: Pop, objectB: Body | Pop) {
            let bucket: any[];
            if (objectB instanceof Pop) {
                bucket = popA.detectedObjects[objectB.stats.popType];
            } else {
                bucket = popA.detectedObjects.terrain;
            }
            const alreadyDetected = bucket.find(({ id }) => objectB.id === id);
            if (!alreadyDetected) bucket.push(objectB);
        }

        for (const { bodyA, bodyB } of pairs) {
            if (bodyA.label === bodyB.label) continue;
            if (bodyA.isSensor === bodyB.isSensor) continue;

            const popA = this.getPopFromBodyLabel(bodyA.label);
            const popB = this.getPopFromBodyLabel(bodyB.label);

            if (popA) addDetectedObject(popA, popB || bodyB);
            if (popB) addDetectedObject(popB, popA || bodyA);
        }
    }

    addCollisionEvents() {
        Events.on(this.engine, 'collisionStart', this.handlePairCollisionStart)

        Events.on(this.engine, 'collisionEnd', ({ pairs }) => {

            function removeDetectedObject(popA: Pop, objectB: Body | Pop) {
                for (let bucket of Object.values(popA.detectedObjects)) {
                    const index = bucket.indexOf(objectB as any);
                    if (index !== -1) {
                        bucket.splice(index, 1);
                        break;
                    }
                }
            }

            pairs.forEach(({ bodyA, bodyB }) => {
                if (bodyA.label === bodyB.label) return;
                if (bodyA.isSensor === bodyB.isSensor) return;

                const popA = this.getPopFromBodyLabel(bodyA.label);
                const popB = this.getPopFromBodyLabel(bodyB.label);

                if (popA) removeDetectedObject(popA, popB || bodyB);
                if (popB) removeDetectedObject(popB, popA || bodyA);
            })
        })

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
                // Humans smartly run away
                if (pop.stats.popType === PopType.humanoid) {
                    const bestPath = pop.smartPathing(this.filterVisible(pop, pop.detectedObjects));
                    pop.moveTowards(bestPath, this.engine.timing.lastDelta);
                }

                // Infectoids spaz out
                if (pop.stats.popType === PopType.infectoid) {
                    Body.applyForce(pop.body, pop.body.position, { x: Common.random(-0.05, 0.05), y: Common.random(-0.05, 0.05) });
                }
            });
        });
    };
};
