import React from "react";
import { Engine, Render, Runner, Vector, Composite, Common, Body, Bodies, IBodyDefinition } from "matter-js";
import Pop from "../classes/Pop";
import { World } from "../classes/World";
import { forEach } from "lodash";


const useInitMatter = (elementId: string) => {
    const [hasInitialized, setHasInitialized] = React.useState(false);

    function initMatter() {
        if (hasInitialized) return;

        const element = document.getElementById(elementId);
        if (!element) return;

        setHasInitialized(true);

        // Create an engine
        var engine = Engine.create();

        // Engine Configuration
        // engine.positionIterations = 144;
        // engine.velocityIterations = 20;
        // engine.constraintIterations = 144;

        // Physics configuration
        engine.gravity.y = 0;

        // Create a renderer / Canvas
        var render = Render.create({
            element,
            engine: engine,
            options: {
                width: window.innerWidth, // width of canvas
                height: window.innerHeight, // height of canvas
                wireframes: false, // allows us to modify bodies of pops
                background: 'rgb(83, 104, 140)' // probably set this somewhere else
            }
        });
        // run the renderer
        Render.run(render);
        // create runner
        var runner = Runner.create();
        // run the engine
        Runner.run(runner, engine);


        Common.random();

        const world = new World(engine);

        // Create Walls
        var width_screen = window.innerWidth;
        var height_screen = window.innerHeight;
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
        var wall_thickness = 10;
        var walls = [
            // x pos (center of shape), y pos, width, height, options
            Bodies.rectangle(width_screen / 2, height_screen, width_screen, wall_thickness, wall_options), // Bottom wall
            Bodies.rectangle(width_screen / 2, 0, width_screen, wall_thickness, wall_options), // Top wall
            Bodies.rectangle(width_screen, height_screen / 2, wall_thickness, height_screen, wall_options), // Right wall
            Bodies.rectangle(0, height_screen / 2, wall_thickness, height_screen, wall_options), // Left wall
        ];

        Composite.add(engine.world, walls)
    }

    React.useEffect(() => initMatter(), [elementId]);
}

export default useInitMatter;
