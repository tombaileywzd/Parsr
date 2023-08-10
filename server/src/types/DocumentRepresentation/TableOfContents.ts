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

import { reconstructTOCItem } from '../../processing/TableOfContentsDetectionModule/reconstruction-methods';
import { BoundingBox } from './BoundingBox';
import { Element } from './Element';
import { Line } from './Line';
import { TableOfContentsItem } from './TableOfContentsItem';

export class TableOfContents extends Element {

  public get content(): Element[] {
    return this._content;
  }
  public set content(value: Element[]) {
    this._content = value;
    this.updateItems();
    this.updateBoundingBox();
  }

  public get pageKeywords(): string[] {
    return this._pageKeywords;
  }

  public set pageKeywords(pageKeywords: string[]) {
    this._pageKeywords = pageKeywords;
  }

  public get items(): TableOfContentsItem[] {
    return this._items;
  }

  public set items(items: TableOfContentsItem[]) {
    this._items = items;
  }

  private _items: TableOfContentsItem[] = [];
  private _content: Element[] = [];
  private _pageKeywords: string[] = ['pag'];

  public toHTML() {
    return this.items.map(c => c.toHTML()).join('<br>');
  }
  public toMarkdown() {
    return this.items.map(c => c.toMarkdown()).join('  \n');
  }

  public toSimpleJSON(): any {
    return {
      type : 'tableOfContent',
      content : this.items.map(c => c.toString()),
    };
  }

  public toString() {
    return this.items.map(c => c.toString()).join('\n');
  }

  private updateItems() {
    this.items = this.splitInVerticalGroups(this.content)
      .map(g => this.contentToTOCItem(g, this.pageKeywords))
      .filter(c => !!c);
  }

  private contentToTOCItem(elements: Element[], pageKeywords: string[]): TableOfContentsItem {
    // detects and removes possible separation chains
    const text = elements
      .map(e => e.toString())
      .join(' ')
      .replace(/(\.{2,}|\.\s|\s\.)/g, ' ')
      .replace(/ +/g, ' ');
    const bbox = BoundingBox.merge(elements.map(e => e.box));
    return reconstructTOCItem(text, bbox, pageKeywords);
  }

  private updateBoundingBox() {
    const left = Math.min(...this.items.map(i => i.box.left));
    const top = Math.min(...this.items.map(i => i.box.top));
    const width = Math.max(...this.items.map(i => i.box.right)) - left;
    const height = Math.max(...this.items.map(i => i.box.bottom)) - top;
    this.box = new BoundingBox(left, top, width, height);
  }

  private splitInVerticalGroups(content: Element[]): Element[][] {
    const verticalGroups = {};
    content.forEach(paragraph => {
      (paragraph.content as Line[]).forEach(line => {
        if (!verticalGroups[Math.round(line.box.top)]) {
          verticalGroups[Math.round(line.box.top)] = [];
        }
        verticalGroups[Math.round(line.box.top)].push(line);
      });
    });
    return Object.values(verticalGroups);
  }
}
