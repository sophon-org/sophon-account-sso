import { describe, expect, it } from 'vitest';
import {
  getDynamicSmartAccountUniqueId,
  getSophonSmartAccountUniqueId,
} from '../smart-contract';

describe('Account Unique Ids', () => {
  it('should be able to find the correct unique id for a sophon account v1 deployed account', async () => {
    // given
    const k1Owner = '0xe0a2D14709A0a8b69288b9f2F4065aa1bf3099B1';

    const result = getDynamicSmartAccountUniqueId(k1Owner);
    expect(result).toEqual(
      '0x1990511fd66bad6a0c3d991fd88409b234475df540994280c3b2b8574432daf6',
    );
  });

  it('should be able to find the correct unique id for a sophon account v2 deployed account', async () => {
    // given
    const k1Owner = '0xDd6Ab38C81E687F53E15B01BD4595B3d0D43b895';
    const deployerAddress = '0xD73253EC5fA2D6390206EA188B41215A40FCb761';

    const result = getSophonSmartAccountUniqueId(k1Owner, deployerAddress);
    expect(result).toEqual(
      '0x45b3685d2876674c7ec06061ced9794c14cd482bb82bf2773ee833d9c8837282',
    );
  });
});
