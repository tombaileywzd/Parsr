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
import * as fs from 'fs';
import * as XmlStream from 'xml-stream';
import {
  BoundingBox,
  Character,
  Document,
  Element,
  Font,
  Image,
  Page,
  Word,
} from '../../types/DocumentRepresentation';
import { Color } from '../../types/DocumentRepresentation/Color';
import { SvgLine } from '../../types/DocumentRepresentation/SvgLine';
import { PdfminerFigure } from '../../types/PdfminerFigure';
import { PdfminerPage } from '../../types/PdfminerPage';
import { PdfminerShape } from '../../types/PdfminerShape';
import { PdfminerText } from '../../types/PdfminerText';
import { isPerimeterLine, isPixelLine } from '../../utils';
import * as CommandExecuter from '../../utils/CommandExecuter';
import logger from '../../utils/Logger';

/**
 * Executes the pdfminer extraction function, reading an input pdf file and extracting a document representation.
 * This function involves recovering page contents like words, bounding boxes, fonts and other information that
 * the pdfminer tool's output provides. This function spawns the externally existing pdfminer tool.
 *
 * @param pdfInputFile The path including the name of the pdf file for input.
 * @returns The promise of a valid document (in the format DocumentRepresentation).
 */

export function extractPages(
  pdfInputFile: string,
  pages: string,
  rotationDegrees: number = 0,
): Promise<string> {
  return new Promise<string>((resolveXml, rejectXml) => {
    const startTime: number = Date.now();
    CommandExecuter.pdfMinerExtract(pdfInputFile, pages, rotationDegrees)
      .then(xmlOutputPath => {
        logger.info(`PdfMiner xml: ${(Date.now() - startTime) / 1000}s`);
        try {
          resolveXml(xmlOutputPath);
        } catch (err) {
          rejectXml(`PdfMiner xml parser failed: ${err}`);
        }
      })
      .catch(({ error }) => {
        rejectXml(`PdfMiner pdf2txt.py error: ${error}`);
      });
  });
}

const pushElement = (element, array, index = null) => {
  if (index != null) {
    array[index] = array[index] || [];
    array[index].push(element);
  } else {
    array = array || [];
    array.push(element);
  }
};

export function extractDrawingsFromXML(xmlPath: string): Promise<any> {
  const startTime: number = Date.now();
  const fileStream = fs.createReadStream(xmlPath);
  const xml = new XmlStream(fileStream);

  let shapes = [];
  const allPages = [];

  return new Promise((resolve, reject) => {
    xml.on('endElement: rect', rect => {
      pushElement({ _attr: rect.$, type: 'rect' }, shapes);
    });

    // for now, curves are treated as polygons
    xml.on('endElement: curve', poly => {
      pushElement({ _attr: poly.$, type: 'poly' }, shapes);
    });

    xml.on('endElement: line', line => {
      pushElement({ _attr: line.$, type: 'line' }, shapes);
    });

    xml.on('updateElement: page', pageElement => {
      pushElement({ _attr: pageElement.$, shapes }, allPages);
      shapes = [];
    });

    xml.on('end', () => {
      logger.info(`SVGs extraction time: ${(Date.now() - startTime) / 1000}s`);
      resolve({ pages: { page: allPages } });
    });

    xml.on('error', message => {
      logger.info(`XML Parsing error: ${message}`);
      reject(message);
    });
  });
}

export function xmlParser(xmlPath: string): Promise<any> {
  const startTime: number = Date.now();

  return new Promise<any>((resolve, _reject) => {
    const fileStream = fs.createReadStream(xmlPath);
    const xml = new XmlStream(fileStream);

    const allPages: any[] = [];
    let textBoxes: any[] = [];
    let textLines: any[] = [];
    let texts: any[] = [];
    let figures: Figure[] = [];

    type Figure = {
      _attr: {};
      image: any[];
      text: any[];
      figure: Figure[];
    };

    let currentFigure: Figure = null;
    const figuresStack: Figure[] = [];

    const pushWord = (word, array, index = null) => {
      let element = {};
      if (word.$text != null && word.$ != null) {
        element = { _: word.$text.toString(), _attr: word.$ };
      } else if (word.$ != null) {
        element = { _attr: word.$ };
      }
      pushElement(element, array, index);
    };

    xml.on('endElement: page > textbox > textline > text', word => {
      pushWord(word, texts);
    });

    xml.on('endElement: page > textbox > textline', line => {
      pushElement({ _attr: line.$, text: texts }, textLines);
      texts = [];
    });

    xml.on('endElement: page > textbox', line => {
      pushElement({ _attr: line.$, textline: textLines }, textBoxes);
      textLines = [];
    });

    xml.on('startElement: figure', figFigure => {
      const f: Figure = { _attr: figFigure.$, figure: [], image: [], text: [] };
      if (figuresStack.length === 0) {
        figures.push(f);
      } else {
        currentFigure.figure.push(f);
      }
      figuresStack.push(f);
      currentFigure = f;
    });

    xml.on('startElement: image', figImage => {
      currentFigure.image.push({ _attr: figImage.$ });
    });

    xml.on('endElement: figure text', figText => {
      pushWord(figText, currentFigure.text);
    });

    xml.on('endElement: figure', _figure => {
      figuresStack.pop();
      currentFigure = figuresStack[figuresStack.length - 1];
    });

    xml.on('updateElement: page', pageElement => {
      pushElement({ _attr: pageElement.$, textbox: textBoxes, figure: figures }, allPages);
      textBoxes = [];
      figures = [];
    });

    xml.on('end', () => {
      logger.info(`Xml to Js: ${(Date.now() - startTime) / 1000}s`);
      resolve({ pages: { page: allPages } });
    });

    xml.on('error', message => {
      logger.info(`XML Parsing error: ${message}`);
    });
  });
}

export function jsParser(json: any): Document {
  const startTime: number = Date.now();
  const doc: Document = new Document(getPages(json));
  logger.info(`Js to Document: ${(Date.now() - startTime) / 1000}s`);
  return doc;
}

function getPages(jsonObj: any): Page[] {
  const docPages: Page[] = [];
  if (Array.isArray(jsonObj.pages.page)) {
    jsonObj.pages.page.forEach(pageObj => docPages.push(getPage(new PdfminerPage(pageObj))));
  } else if (jsonObj.pages != null) {
    docPages.push(getPage(new PdfminerPage(jsonObj.pages.page)));
  }
  return docPages;
}

function getPage(pageObj: PdfminerPage): Page {
  const boxValues: number[] = pageObj._attr.bbox.split(',').map(v => parseFloat(v));
  const pageBBox: BoundingBox = new BoundingBox(
    boxValues[0],
    boxValues[1],
    boxValues[2],
    boxValues[3],
  );

  let elements: Element[] = [];

  // treat paragraphs
  if (pageObj.textbox !== undefined) {
    pageObj.textbox.forEach(para => {
      para.textline.map(line => {
        elements = [
          ...elements,
          ...breakLineIntoWords(line.text, ',', pageBBox.height, 1, para._attr.wmode),
        ];
      });
    });
  }

  // treat figures
  if (pageObj.figure !== undefined) {
    pageObj.figure.forEach(fig => {
      if (hasImages(fig)) {
        elements = [...elements, ...interpretImages(fig, pageBBox.height)];
      }
      if (hasTexts(fig)) {
        elements = [
          ...elements,
          ...breakLineIntoWords(allTextsInFigure(fig), ',', pageBBox.height),
        ];
      }
    });
  }

  // treat svg lines and rectangles
  if (pageObj.shapes !== undefined) {
    pageObj.shapes.forEach(shape => {
      const shapes = pdfminerShapeToSvgShapes(shape, pageBBox.height)
        .filter(l => !isPerimeterLine(l, pageBBox) && !isPixelLine(l));
      elements.push(...shapes);
    });
  }

  return new Page(parseFloat(pageObj._attr.id), elements, pageBBox);
}

function pdfminerShapeToSvgShapes(shape: PdfminerShape, pageHeight: number): SvgLine[] {
  const drawingBox: BoundingBox = getBoundingBox(shape._attr.bbox, ',', pageHeight);

  const thickness = parseFloat(shape._attr.linewidth) || 1;
  const drawingContent: SvgLine[] = [];
  if (shape.type === 'rect') {
    drawingContent.push(
      new SvgLine(
        drawingBox,
        thickness,
        drawingBox.left,
        drawingBox.top,
        drawingBox.right,
        drawingBox.top,
      ),
      new SvgLine(
        drawingBox,
        thickness,
        drawingBox.right,
        drawingBox.top,
        drawingBox.right,
        drawingBox.bottom,
      ),
      new SvgLine(
        drawingBox,
        thickness,
        drawingBox.right,
        drawingBox.bottom,
        drawingBox.left,
        drawingBox.bottom,
      ),
      new SvgLine(
        drawingBox,
        thickness,
        drawingBox.left,
        drawingBox.bottom,
        drawingBox.left,
        drawingBox.top,
      ),
    );
  }

  if (shape.type === 'line') {
    drawingContent.push(
      new SvgLine(
        drawingBox,
        thickness,
        drawingBox.left,
        drawingBox.top,
        drawingBox.right,
        drawingBox.bottom,
      ),
    );
  }

  if (shape.type === 'poly') {
    const pts = shape._attr.pts.split(',').map(v => parseFloat(v));
    for (let i = 0; i < pts.length; i += 2) {
      const x1 = pts[i];
      const y1 = pageHeight - pts[i + 1];
      const x2 = pts[i + 2];
      const y2 = pageHeight - pts[i + 3];
      if ([x1, x2, y1, y2].every(num => typeof num === 'number')) {
        drawingContent.push(new SvgLine(drawingBox, thickness, x1, y1, x2, y2));
      }
    }

    const firstFromX = pts[0];
    const firstFromY = pageHeight - pts[1];
    const lastToX = pts[pts.length - 2];
    const lastToY = pageHeight - pts[pts.length - 1];

    if (firstFromX !== lastToX || firstFromY !== lastToY) {
      drawingContent.push(
        new SvgLine(drawingBox, thickness, lastToX, lastToY, firstFromX, firstFromY),
      );
    }
  }

  return drawingContent;
}

function hasTexts(figure: PdfminerFigure): boolean {
  if (figure.text !== undefined) {
    return true;
  }
  if (figure.figure !== undefined) {
    return figure.figure.map(fig => hasTexts(fig)).reduce((a, b) => a || b);
  }
  return false;
}
function hasImages(figure: PdfminerFigure): boolean {
  if (figure.image !== undefined) {
    return true;
  }
  if (figure.figure !== undefined) {
    return figure.figure.map(fig => hasImages(fig)).reduce((a, b) => a || b);
  }
  return false;
}

// Pdfminer's bboxes are of the format: x0, y0, x1, y1. Our BoundingBox dims are as: left, top, width, height
function getBoundingBox(
  bbox: string,
  splitter: string = ',',
  pageHeight: number = 0,
  scalingFactor: number = 1,
): BoundingBox {
  const values: number[] = bbox.split(splitter).map(v => parseFloat(v) * scalingFactor);
  const width: number = Math.abs(values[2] - values[0]); // right - left = width
  const height: number = Math.abs(values[1] - values[3]); // top - bottom = height
  const left: number = values[0];
  const top: number = Math.abs(pageHeight - values[1]) - height; // invert x direction (pdfminer's (0,0)
  // is on the bottom left)
  return new BoundingBox(left, top, width, height);
}

function getMostCommonFont(theFonts: Font[]): Font {
  const fonts: Font[] = theFonts.reduce((a, b) => a.concat(b), []);

  const baskets: Font[][] = [];

  fonts.forEach((font: Font) => {
    let basketFound: boolean = false;
    baskets.forEach((basket: Font[]) => {
      if (basket.length > 0 && basket[0].isEqual(font)) {
        basket.push(font);
        basketFound = true;
      }
    });

    if (!basketFound) {
      baskets.push([font]);
    }
  });

  baskets.sort((a, b) => {
    return b.length - a.length;
  });

  if (baskets.length > 0 && baskets[0].length > 0) {
    return baskets[0][0];
  } else {
    return Font.undefinedFont;
  }
}

/**
 * Fetches the character a particular pdfminer's textual output represents
 * TODO: This placeholder will accommodate the solution at https://github.com/aarohijohal/pdfminer.six/issues/1 ...
 * TODO: ... For now, it returns a '?' when a (cid:) is encountered
 * @param character the character value outputted by pdfminer
 * @param font the font associated with the character  -- TODO to be taken into consideration here
 */
function getValidCharacter(character: string): string {
  return RegExp(/\(cid:/gm).test(character) ? '?' : character;
}

function allTextsInFigure(figure: PdfminerFigure): PdfminerText[] {
  if (figure.figure) {
    return figure.figure.map(allTextsInFigure).reduce((a, b) => a.concat(b));
  }

  if (figure.text) {
    return figure.text;
  }
  return [];
}

function interpretImages(
  figure: PdfminerFigure,
  pageHeight: number,
  scalingFactor: number = 1,
  parentFigure: string = '',
): Image[] {
  if (figure.figure) {
    return figure.figure
      .map(fig =>
        interpretImages(fig, pageHeight, scalingFactor, parentFigure + figure._attr.name + '.'),
      )
      .reduce((a, b) => a.concat(b));
  }

  if (figure.image) {
    return figure.image.map(_img => {
      return new Image(
        getBoundingBox(figure._attr.bbox, ',', pageHeight, scalingFactor),
        '', // TODO: to be filled with the location of the image once resolved
        parentFigure + figure._attr.name,
      );
    });
  }
  return [];
}

function addMissingSpaces(char: PdfminerText, index: number, array: PdfminerText[]): PdfminerText[] {
  const nextChar = array[index + 1];
  if (nextChar && nextChar._attr && char && char._attr && !charsAreSideBySide(char, nextChar)) {
    return [char, new PdfminerText({ _: undefined, _attr: char._attr })];
  }
  return [char];
}

function charsAreSideBySide(char: PdfminerText, nextChar: PdfminerText): boolean {
  const charBBox = getBoundingBox(char._attr.bbox);
  const nextCharBBox = getBoundingBox(nextChar._attr.bbox);
  return Math.abs(charBBox.bottom - nextCharBBox.bottom) < 2 && charBBox.left < nextCharBBox.left;
}

function breakLineIntoWords(
  texts: PdfminerText[],
  wordSeparator: string = ' ',
  pageHeight: number,
  scalingFactor: number = 1,
  wMode: string = null,
): Word[] {
  const notAllowedChars = ['\u200B']; // &#8203 Zero Width Space
  const words: Word[] = [];
  const fakeSpaces = thereAreFakeSpaces(texts);
  const filteredTexts = texts
    .filter(char => !notAllowedChars.includes(char._) && !isFakeChar(char, fakeSpaces))
    .map(addMissingSpaces)
    .reduce((acc, val) => acc.concat(val), []);
  const chars: Character[] = filteredTexts
    .map(char => {
      if (char._ === undefined) {
        return undefined;
      } else {
        const font: Font = new Font(char._attr.font, parseFloat(char._attr.size), {
          weight: RegExp(/bold/gim).test(char._attr.font) ? 'bold' : 'medium',
          isItalic: RegExp(/italic/gim).test(char._attr.font) ? true : false,
          isUnderline: RegExp(/underline/gim).test(char._attr.font) ? true : false,
          color: ncolourToHex(char._attr.ncolour),
        });
        const charContent: string = getValidCharacter(char._);
        return new Character(
          getBoundingBox(char._attr.bbox, ',', pageHeight, scalingFactor),
          charContent,
          font,
        );
      }
    });
  if (chars[0] === undefined || chars[0].content === wordSeparator) {
    chars.splice(0, 1);
  }
  if (chars[chars.length - 1] === undefined || chars[chars.length - 1].content === wordSeparator) {
    chars.splice(chars.length - 1, chars.length);
  }

  if (chars.length === 0 || (chars.length === 1 && chars[0] === undefined)) {
    return words;
  }

  if (
    chars
      .filter(c => c !== undefined)
      .map(c => c.content.length)
      .filter(l => l > 1).length > 0
  ) {
    logger.debug(`pdfminer returned some characters of size > 1`);
  }

  const sepLocs: number[] = chars
    .map((c, i) => {
      if (c === undefined) {
        return i;
      } else {
        return undefined;
      }
    })
    .filter(l => l !== undefined)
    .filter(l => l !== 0)
    .filter(l => l !== chars.length);

  let charSelection: Character[] = [];
  if (sepLocs.length === 0) {
    charSelection = chars.filter(c => c !== undefined);
    words.push(
      new Word(
        BoundingBox.merge(charSelection.map(c => c.box)),
        charSelection,
        getMostCommonFont(charSelection.map(c => c.font)),
      ),
    );
  } else {
    charSelection = chars.slice(0, sepLocs[0]).filter(c => c !== undefined);
    if (charSelection.length > 0) {
      words.push(
        new Word(
          BoundingBox.merge(charSelection.map(c => c.box)),
          charSelection,
          getMostCommonFont(charSelection.map(c => c.font)),
        ),
      );
    }
    for (let i = 0; i !== sepLocs.length; ++i) {
      let from: number;
      let to: number;
      from = sepLocs[i] + 1;
      if (i !== sepLocs.length - 1) {
        to = sepLocs[i + 1];
      } else {
        to = chars.length;
      }
      charSelection = chars.slice(from, to).filter(c => c !== undefined);
      if (charSelection.length > 0) {
        words.push(
          new Word(
            BoundingBox.merge(charSelection.map(c => c.box)),
            charSelection,
            getMostCommonFont(charSelection.map(c => c.font)),
          ),
        );
      }
    }
  }

  return wMode
    ? words.map(w => {
      w.properties.writeMode = wMode;
      return w;
    })
    : words;
}

function thereAreFakeSpaces(texts: PdfminerText[]): boolean {
  // Will remove all <text> </text> only if in line we found
  // <text> </text> followed by empty <text> but with attributes
  // <text font="W" bbox="W" colourspace="X" ncolour="Y" size="Z"> </text>
  const emptyWithAttr = texts
    .map((word, index) => {
      return { text: word, pos: index };
    })
    .filter(word => word.text._ === undefined && word.text._attr !== undefined)
    .map(word => word.pos);
  const emptyWithNoAttr = texts
    .map((word, index) => {
      return { text: word, pos: index };
    })
    .filter(word => word.text._ === undefined && word.text._attr === undefined)
    .map(word => word.pos);

  let fakeSpaces = false;
  emptyWithNoAttr.forEach(pos => {
    if (emptyWithAttr.includes(pos + 1)) {
      fakeSpaces = true;
    }
  });
  return fakeSpaces;
}

function isFakeChar(word: PdfminerText, fakeSpacesInLine: boolean): boolean {
  if (fakeSpacesInLine && word._ === undefined && word._attr === undefined) {
    return true;
  }

  return false;
}

function ncolourToHex(color: string): Color {
  let finalColor: string = '#000000';
  if (color === undefined) {
    return finalColor;
  }
  const rgbToHex = (r, g, b) =>
    '#' +
    [r, g, b]
      .map(x => {
        const hex = Math.ceil(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('');

  const cmykToRGB = (c: number, m: number, y: number, k: number) => {
    return {
      r: (1 - c) * (1 - k),
      g: (1 - m) * (1 - k),
      b: (1 - y) * (1 - k),
    };
  };

  const colors = color.replace(/[()[\]\s]/g, '').split(',');

  if (colors.length === 3) {
    finalColor = rgbToHex(colors[0], colors[1], colors[2]);
  } else if (colors.length === 4) {
    const { r, g, b } = cmykToRGB(+colors[0], +colors[1], +colors[2], +colors[3]);
    finalColor = rgbToHex(r, g, b);
  } else {
    finalColor = '#000000';
  }
  return finalColor;
}
