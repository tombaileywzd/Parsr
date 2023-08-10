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

import { Document } from '../types/DocumentRepresentation';
import * as CommandExecuter from '../utils/CommandExecuter';

export function setPageDimensions(doc: Document, inputFileName: string): Promise<Document> {
  return new Promise<Document>(resolve => {
    CommandExecuter.magickImageDimensions(inputFileName).then(dimensions => {
      doc.pages.forEach((page, i) => {
        page.width = dimensions[i].width;
        page.height = dimensions[i].height;
        // Remove weird false positive coming from Tesseract
        page.elements = page.elements.filter(elem => {
          return elem.height !== page.height || elem.width !== page.width;
        });
      });
      resolve(doc);
    });
  });
}
