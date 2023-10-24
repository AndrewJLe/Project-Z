import React from "react";
import { Engine, Render, Runner } from "matter-js";
import { World } from "../classes/World";
import SimController from "../controller/SimController";


const useInitMatter = (ref: React.RefObject<HTMLElement>) => {
    const [controller, setController] = React.useState<SimController | null>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => { 
        if (ref.current && !controller) {
            const newController = new SimController(ref.current);
            newController.startSim();
            setController(newController);
        }
    }, [ref.current]);

    return { restart: controller?.restartSim, stop: controller?.stopSim, start: controller?.startSim };
}

export default useInitMatter;
