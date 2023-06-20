import { Composite, Engine, Events, Render, Runner } from "matter-js";
import { World } from "../classes/World";

type MatPack = {
    render: Render;
    runner: Runner;
    engine: Engine;
}

class SimController {
    public simRunning = false;

    private rootEl: HTMLElement;
    private matPack: MatPack | null;

    constructor(rootEl: HTMLElement) {
        this.rootEl = rootEl;
        this.matPack = null;
        this.startSim = this.startSim.bind(this);
        this.stopSim = this.stopSim.bind(this);
        this.restartSim = this.restartSim.bind(this);
    }

    startSim() {
        if (this.simRunning) {
            console.warn("Start Sim was called but instance is already running");
            return false;
        }
        this.bootSequence();
        this.simRunning = true;

        return true;
    }

    stopSim() {
        if (!this.simRunning) {
            console.warn("Stop Sim was called but no instance is running");
            return false;
        }

        this.offSequence();
        this.simRunning = false;
    
        return true;
    }
    
    restartSim() {
        return this.stopSim() && this.startSim();
    }

    private offSequence() {
        if (!this.matPack) return false;
    
        Composite.clear(this.matPack.engine.world, false, true);
        Engine.clear(this.matPack.engine);
        Render.stop(this.matPack.render);
        Runner.stop(this.matPack.runner);
        // @ts-ignore TypeScript types are incorrect
        Events.off(this.matPack.engine)
        this.matPack.render.canvas.remove();
        this.matPack.render.textures = {};
        this.simRunning = false;
    }

    private bootSequence() {
        // Create an engine
        var engine = Engine.create();

        // Engine Configuration
        engine.gravity.y = 0;

        // Create a renderer / Canvas
        var render = Render.create({
            element: this.rootEl,
            engine: engine,
            options: {
                width: window.innerWidth, // width of canvas
                height: window.innerHeight, // height of canvas
                wireframes: false, // allows us to modify bodies of pops
                background: 'rgb(83, 104, 140)', // probably set this somewhere else
                showIds: true
            }
        });
        // run the renderer
        Render.run(render);
        // create runner
        var runner = Runner.create();
        // run the engine
        Runner.run(runner, engine);

        new World(engine);

        this.matPack = { engine, render, runner };
    }
}

export default SimController;
