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

import { expect } from 'chai';
import { existsSync, unlinkSync } from 'fs';
import { withData } from 'leche';
import 'mocha';
import { DocxExtractor } from '../server/src/input/doc/DocxExtractor';
import { EmailExtractor } from '../server/src/input/email/EmailExtractor';
import { PDFJsExtractor } from '../server/src/input/pdf.js/PDFJsExtractor';
import { LinesToParagraphModule } from '../server/src/processing/LinesToParagraphModule/LinesToParagraphModule';
import { OutOfPageRemovalModule } from '../server/src/processing/OutOfPageRemovalModule/OutOfPageRemovalModule';
import { ReadingOrderDetectionModule } from '../server/src/processing/ReadingOrderDetectionModule/ReadingOrderDetectionModule';
import { WhitespaceRemovalModule } from '../server/src/processing/WhitespaceRemovalModule/WhitespaceRemovalModule';
import { WordsToLineNewModule } from '../server/src/processing/WordsToLineNewModule/WordsToLineNew';
import { Document, Paragraph } from '../server/src/types/DocumentRepresentation';
import { runModules } from './helpers';

const ASSETS_DIR = __dirname + '/assets/sources/';

describe('PDF.js input module', () => {
  withData(
    {
      'one paragraph text extraction': [
        'One_Paragraph.pdf',
        "**Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      ],
    },
    (fileName, expectedText) => {
      let exportedText: string = '';

      before(done => {
        const extractor = new PDFJsExtractor({
          version: 0.5,
          extractor: {
            pdf: 'pdfjs',
            ocr: 'tesseract',
            language: ['eng', 'fra'],
          },
          cleaner: [],
          output: {
            granularity: 'word',
            includeMarginals: false,
            formats: {},
          },
        });

        extractor.run(ASSETS_DIR + fileName).then(document => {
          runModules(document, [
            new OutOfPageRemovalModule(),
            new WhitespaceRemovalModule(),
            new WordsToLineNewModule(),
            new ReadingOrderDetectionModule(),
            new LinesToParagraphModule(),
          ]).then(doc => {
            exportedText = doc
              .getElementsOfType<Paragraph>(Paragraph)
              .map(p => p.toMarkdown())
              .join(' ');
            done();
          });
        });
      });

      it('PDF.js should export expected text', () => {
        expect(exportedText).to.eq(expectedText);
      });
    },
  );
});

describe('EML input module', () => {
  withData(
    {
      'one paragraph text extraction': [
        'One_Paragraph.eml',
        "**Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        1,
      ],
      attachments: ['with_attachments.eml', 'this is the email body', 3],
    },
    (fileName, expectedText, pageCount) => {
      let docAfter: Document;
      before(done => {
        const extractor = new EmailExtractor({
          version: 0.5,
          extractor: {
            pdf: 'pdfjs',
            ocr: 'tesseract',
            language: ['eng', 'fra'],
          },
          cleaner: [],
          output: {
            granularity: 'word',
            includeMarginals: false,
            formats: {},
          },
        });

        extractor.run(ASSETS_DIR + fileName).then(document => {
          runModules(document, [
            new OutOfPageRemovalModule(),
            new WhitespaceRemovalModule(),
            new WordsToLineNewModule(),
            new ReadingOrderDetectionModule(),
            new LinesToParagraphModule(),
          ]).then(doc => {
            docAfter = doc;
            done();
          });
        });
      });

      it('EML extractor should export expected text', () => {
        const exportedText = docAfter
          .getElementsOfType<Paragraph>(Paragraph)
          .map(p => p.toMarkdown())
          .join(' ');
        expect(exportedText).to.eq(expectedText);
      });

      it('PDF resulting file should have the expected amount of pages', () => {
        expect(docAfter.pages.length).to.eq(pageCount);
      });

      after(done => {
        if (existsSync(ASSETS_DIR + fileName.replace('.eml', '-tmp.pdf'))) {
          unlinkSync(ASSETS_DIR + fileName.replace('.eml', '-tmp.pdf'));
        }
        done();
      });
    },
  );
});

describe('MS Word input module', () => {
  withData(
    {
      'one paragraph text extraction': [
        'One_Paragraph.docx',
        "**Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        1,
      ],
    },
    (fileName, expectedText, pageCount) => {
      let docAfter: Document;
      before(done => {
        const extractor = new DocxExtractor({
          version: 0.5,
          extractor: {
            pdf: 'pdfjs',
            ocr: 'tesseract',
            language: ['eng', 'fra'],
          },
          cleaner: [],
          output: {
            granularity: 'word',
            includeMarginals: false,
            formats: {},
          },
        });

        extractor.run(ASSETS_DIR + fileName).then(document => {
          runModules(document, [
            new OutOfPageRemovalModule(),
            new WhitespaceRemovalModule(),
            new WordsToLineNewModule(),
            new ReadingOrderDetectionModule(),
            new LinesToParagraphModule(),
          ]).then(doc => {
            docAfter = doc;
            done();
          });
        });
      });

      it('doc extractor should export expected text', () => {
        const exportedText = docAfter
          .getElementsOfType<Paragraph>(Paragraph)
          .map(p => p.toMarkdown())
          .join(' ');
        expect(exportedText).to.eq(expectedText);
      });

      it('PDF resulting file should have the expected amount of pages', () => {
        expect(docAfter.pages.length).to.eq(pageCount);
      });

      after(done => {
        if (existsSync(ASSETS_DIR + fileName.replace('.docx', '-tmp.pdf'))) {
          unlinkSync(ASSETS_DIR + fileName.replace('.docx', '-tmp.pdf'));
        }
        done();
      });
    },
  );
});
