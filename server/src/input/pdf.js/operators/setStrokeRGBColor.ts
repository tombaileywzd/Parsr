
/**
 * Copyright 2020 AXA Group Operations S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import logger from '../../../utils/Logger';
import { OperationState } from '../OperationState';
import { rgbToHex } from './../../../utils';

export default {
  key: 'setStrokeRGBColor',
  value: (r: number, g: number, b: number) => {
    logger.debug(`==> setStrokeRGBColor(${r},${g},${b})`);
    OperationState.state.current.strokeColor = rgbToHex(r, g, b);
  },
};
