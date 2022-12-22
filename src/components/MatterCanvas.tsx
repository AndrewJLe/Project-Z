import React from 'react';
import useInitMatter from '../hooks/useInitMatter';

function MatterCanvas(): React.ReactElement {
    useInitMatter("matter-canvas");

    return (
        <div id="matter-canvas">

        </div>
    );
};

export default MatterCanvas;