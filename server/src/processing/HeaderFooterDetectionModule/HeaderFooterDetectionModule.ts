/**
 * Copyright 2019 AXA Group Operations S.A.
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

import {
  BoundingBox,
  Document,
  Element,
  Page,
} from '../../types/DocumentRepresentation';
import * as utils from '../../utils';
import logger from '../../utils/Logger';
import { Module } from '../Module';
import * as defaultConfig from './defaultConfig.json';

/**
 * Stability: Experimental
 * Characterize marginals (header and footer) in a document. The word marginals comes
 * from https://english.stackexchange.com/a/25105
 */
interface Options {
  ignorePages?: number[];
  maxMarginPercentage?: number;
}

const defaultOptions = (defaultConfig as any) as Options;

export class HeaderFooterDetectionModule extends Module<Options> {
  public static moduleName = 'header-footer-detection';
  public static dependencies = [];

  constructor(options?: Options) {
    super(options, defaultOptions);
  }

  public main(doc: Document): Document {
    if (!this.isComputable(doc)) {
      return doc;
    }

    let occupancyAcrossHeight: number[] = [];
    let occupancyAcrossWidth: number[] = [];
    let pagesStoredBySize: Page[][] = [];

    doc.pages
      .filter(p => !this.options.ignorePages.includes(p.pageNumber))
      .forEach(page => {
        this.storePageSimilarSize(pagesStoredBySize, page);
      });

    pagesStoredBySize
      .filter(groupOfP => groupOfP.length > 1)
      .forEach(groupOfPage => {
        groupOfPage.forEach(page => {
          const h: number[] = page.horizontalOccupancy.map(this.boolToInt);
          occupancyAcrossHeight = utils.addVectors(occupancyAcrossHeight, h);
          const v: number[] = page.verticalOccupancy.map(this.boolToInt);
          occupancyAcrossWidth = utils.addVectors(occupancyAcrossWidth, v);
        });
        
        // UNCOMMENT THESE TO EXPORT OCCUPANCIES INTO EXTERNAL CSV FILES
        // writeFileSync("horizontal.csv", occupancyAcrossWidth.join(";"), {encoding: 'utf-8'})
        // writeFileSync("vertical.csv", occupancyAcrossHeight.join(";"), {encoding: 'utf-8'})
        this.setMargins(doc, occupancyAcrossHeight, occupancyAcrossWidth);
        groupOfPage.forEach(page => {
          this.setHeaderAndFooter(doc, page);
          const headerElements: Element[] = page.getElementsSubset(
            new BoundingBox(0, 0, page.width, doc.margins.top),
          );
          const footerElements: Element[] = page.getElementsSubset(
            new BoundingBox(0, doc.margins.bottom, page.width, page.height - doc.margins.bottom),
          );
          for (const element of footerElements) {
            element.properties.isFooter = true;
          }
          for (const element of headerElements) {
            element.properties.isHeader = true;
          }
        });
        occupancyAcrossHeight = [];
        occupancyAcrossWidth = [];
      });
    logger.debug('Done with marginals detection.');
    return doc;
  }

  private isComputable(doc: Document): boolean {
    const alreadyExist: boolean =
      doc.pages
        .map(p => {
          return p.elements.filter(e => e.properties.isHeader || e.properties.isFooter).length;
        })
        .reduce((a, b) => a + b, 0) > 0;

    let nbPageToTreat: number = this.countPageToTreat(doc.pages.length);
    if (nbPageToTreat <= 1) {
      logger.warn(
        'Not computing marginals (headers and footers)' +
          'the document has only 1 page to check (not enough data).',
      );
      return false;
    } else if (this.options.maxMarginPercentage === undefined) {
      logger.info(
        'Not computing marginals (headers and footers); maxMarginPercentage setting not found in the configuration.',
      );
      return false;
    } else if (alreadyExist) {
      logger.warn(
        'Not computing marginals (headers and footers): header and footer data already exists.',
      );
      return false;
    }
    logger.info(
      'Detecting marginals (headers and footers) with maxMarginPercentage:',
      this.options.maxMarginPercentage,
      '...',
    );
    return true;
  }
  private boolToInt(occupancy: boolean): number {
      return occupancy ? 1 : 0;
  }

  private setMargins(
    doc: Document,
    occupancyAcrossHeight: number[],
    occupancyAcrossWidth: number[],
  ) {
    const heightZeros: number[] = utils
      .findPositionsInArray(occupancyAcrossHeight, 0)
      .sort((a, b) => {
        return a - b;
      });
    const widthZeros: number[] = utils
      .findPositionsInArray(occupancyAcrossWidth, 0)
      .sort((a, b) => {
        return a - b;
      });

    const maxT: number = Math.floor(
      0 + (this.options.maxMarginPercentage * occupancyAcrossHeight.length) / 100,
    );
    doc.margins.top = heightZeros
      .filter(value => value < maxT)
      .sort((a, b) => {
        return b - a;
      })[0];
    const maxB: number = Math.floor(
      occupancyAcrossHeight.length -
        (this.options.maxMarginPercentage * occupancyAcrossHeight.length) / 100,
    );
    doc.margins.bottom = heightZeros
      .filter(value => value > maxB)
      .sort((a, b) => {
        return a - b;
      })[0];
    const maxL: number = Math.floor(
      0 + (this.options.maxMarginPercentage * occupancyAcrossWidth.length) / 100,
    );
    doc.margins.left = widthZeros
      .filter(value => value < maxL)
      .sort((a, b) => {
        return b - a;
      })[0];
    const maxR: number = Math.floor(
      occupancyAcrossWidth.length -
        (this.options.maxMarginPercentage * occupancyAcrossWidth.length) / 100,
    );
    doc.margins.right = widthZeros
      .filter(value => value > maxR)
      .sort((a, b) => {
        return a - b;
      })[0];

    logger.info(
      `Document margins for maxMarginPercentage ${this.options.maxMarginPercentage}: ` +
        `top: ${doc.margins.top}, bottom: ${doc.margins.bottom}, ` +
        `left: ${doc.margins.left}, right: ${doc.margins.right}`,
    );
  }

  private setHeaderAndFooter(doc: Document, page: Page) {
    const headerElements: Element[] = page.getElementsSubset(
      new BoundingBox(0, 0, page.width, doc.margins.top),
    );
    const footerElements: Element[] = page.getElementsSubset(
      new BoundingBox(0, doc.margins.bottom, page.width, page.height - doc.margins.bottom),
    );
    for (const element of footerElements) {
      element.properties.isFooter = true;
    }
    for (const element of headerElements) {
      element.properties.isHeader = true;
    }
  }
  private countPageToTreat(docLength: number): number {
    let nbPagesToTreat: number = docLength;
    this.options.ignorePages.forEach(p => {
      if (p > 0 && p <= docLength) {
        nbPagesToTreat = nbPagesToTreat - 1;
      }
    });
    return nbPagesToTreat;
  }

  private storePageSimilarSize(pagesStoredBySize: Page[][], page: Page) {
    const maxSizeSimilarity: number = 1 + this.options.similaritySizePercentage / 100;
    const minSizeSimilarity: number = 1 / maxSizeSimilarity;
    const indexValue = pagesStoredBySize.findIndex(
      pageSize =>
        pageSize[0].width * minSizeSimilarity <= page.width &&
        pageSize[0].width * maxSizeSimilarity >= page.width &&
        pageSize[0].height * minSizeSimilarity <= page.height &&
        pageSize[0].height * maxSizeSimilarity >= page.height,
    );
    if (indexValue !== -1 && pagesStoredBySize[indexValue].indexOf(page) === -1) {
      pagesStoredBySize[indexValue].push(page);
    } else if (indexValue === -1) {
      pagesStoredBySize.push([page]);
    }
  }
}
