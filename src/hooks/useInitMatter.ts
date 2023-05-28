import React from "react";
import { Engine, Render, Runner } from "matter-js";
import { World } from "../classes/World";


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
        engine.gravity.y = 0;

        // Create a renderer / Canvas
        var render = Render.create({
            element,
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
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => initMatter(), [elementId]);
}

export default useInitMatter;
