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

import { Config } from '../types/Config';
import { Document } from '../types/DocumentRepresentation';
import logger from '../utils/Logger';

export class Module<T = undefined> {
  public static moduleName: string = '';
  public static dependencies: Array<typeof Module> = [];
  private _options: any = {};
  private _extraOptions: any = {};

  constructor(options?: T, defaultOptions?: T, extraOptions?: T) {
    /*
      this takes the 'options' in key-value format and the 'defaultOptions' in specs format
      and returns a merged object in key-value format, prioritizing the values in options object
    */
    this._options = {};
    const specsKeys = [];
    const optKeys = [];

    if (defaultOptions && {}.hasOwnProperty.call(defaultOptions, 'specs')) {
      const spec = 'specs';
      Object.keys(defaultOptions[spec]).forEach(key => {
        specsKeys.push(key);
      });
      if (options) {
        Object.keys(options).forEach(optKey => {
          optKeys.push(optKey);
        });
      }

      if (optKeys.length > specsKeys.length) {
        logger.info(
          'To many keys as been set inside of this: ' +
            JSON.stringify(options) +
            '\nGot ' +
            optKeys.length +
            'keys, expected ' +
            specsKeys.length +
            '.',
        );
      }
      const mergedOptions = Object.assign({}, (defaultOptions as any).specs);
      let i: number = 0;
      Object.keys(mergedOptions).forEach(key => {
        if (i < optKeys.length && !specsKeys.includes(optKeys[i])) {
          logger.info("The key '" + optKeys[i] + "' is misspelled or unknown.");
        }
        if (options && {}.hasOwnProperty.call(options, key)) {
          mergedOptions[key] = options[key];
        } else {
          logger.info(
            "The key '" +
              key +
              "' is not set, the default value has been set to " +
              mergedOptions[key].value,
          );
          mergedOptions[key] = mergedOptions[key].value;
        }
        i += 1;
      });
      this._options = mergedOptions;
    }
    this._extraOptions = extraOptions;
  }

  public run(document: Document, config: Config = null): Promise<Document> {
    return Promise.resolve(this.main(document, config));
  }

  public bypass(document: Document, _config: Config): Promise<Document> {
    return Promise.resolve(document);
  }

  /**
   * Getter options
   * @return {any}
   */
  public get options(): any {
    return this._options;
  }

  /**
   * Setter options
   * @param {any} value
   */
  public set options(value: any) {
    this._options = value;
  }

  /**
   * Getter extraOptions
   * @return {any }
   */
  public get extraOptions(): any {
    return this._extraOptions;
  }

  /**
   * Setter extraOptions
   * @param {any } value
   */
  public set extraOptions(value: any) {
    this._extraOptions = value;
  }

  protected main(document: Document, config: Config): Document | Promise<Document> {
    logger.warn('Module main should not be called.');
    return this.bypass(document, config);
  }
}
