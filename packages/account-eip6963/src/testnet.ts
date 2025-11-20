import { sophonTestnet } from 'viem/chains';
import { createSophonEIP6963Emitter } from './emitter';

createSophonEIP6963Emitter(sophonTestnet.id);
