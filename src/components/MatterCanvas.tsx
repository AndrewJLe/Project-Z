import React from 'react';
import useInitMatter from '../hooks/useInitMatter';

function MatterCanvas(): React.ReactElement {
    const { reset } = useInitMatter("matter-canvas");

    return (
        <div>
            <div id="matter-canvas"></div>
            <button onKeyDown={(event) => {
                console.log(event);
                reset();
            }}>Restart</button>
        </div>

    );
};

export default MatterCanvas;