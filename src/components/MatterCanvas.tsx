import React from 'react';
import useInitMatter from '../hooks/useInitMatter';

function MatterCanvas(): React.ReactElement {
    const canvasRef = React.useRef<HTMLDivElement>(null);

    const { restart } = useInitMatter(canvasRef);

    return (
        <div>
            <div id="matter-canvas" ref={canvasRef}></div>
            <button onClick={restart}>Restart</button>
        </div>
    );
};

export default MatterCanvas;