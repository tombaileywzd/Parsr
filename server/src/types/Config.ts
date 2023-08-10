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

export class Config {
  public version: number;
  public cleaner: CleanerConfig;
  public extractor: ExtractorConfig;
  public output: OutputConfig;
  constructor(configStr: any) {
    let config;
    try {
      config = JSON.parse(configStr);
    } catch (err) {
      throw new Error(`The Json config file is not valid`);
    }
    if (
      {}.hasOwnProperty.call(config, 'version') &&
      {}.hasOwnProperty.call(config, 'extractor') &&
      {}.hasOwnProperty.call(config, 'cleaner') &&
      {}.hasOwnProperty.call(config, 'output')
    ) {
      this.version = config.version;
      this.cleaner = config.cleaner;
      if (config.version <= 0.8) {
        const deprecatedConfig: ExtractorConfig = {
          pdf: config.extractor.pdf,
          ocr: config.extractor.img,
          language: config.extractor.language,
        };
        this.extractor = deprecatedConfig;
      } else {
        this.extractor = config.extractor;
      }
      this.output = config.output;

      if (typeof this.extractor.pdf === 'undefined') {
        this.extractor.pdf = 'pdfminer';
      }

      if (typeof this.extractor.ocr === 'undefined') {
        this.extractor.ocr = 'tesseract';
      }

      if (typeof this.output.granularity === 'undefined') {
        this.output.granularity = 'word';
      }
    } else {
      throw new Error(
        `Required key(s) is/are missing. Please check your config file with the documentation.`,
      );
    }
  }
}

export type OutputGranularityOptions = 'character' | 'word';
export interface OutputConfig {
  granularity: OutputGranularityOptions;
  includeMarginals: boolean;
  includeDrawings?: boolean;
  formats: {
    json?: boolean;
    simpleJson?: boolean;
    // 'json-compact'?: boolean;
    text?: boolean;
    markdown?: boolean;
    // xml?: boolean;
    // confidences?: boolean;
    csv?: boolean;
    pdf?: boolean;
  };
}

export type CleanerConfig = Array<string | [string, object]>;

export interface ExtractorConfig {
  pdf: 'pdfminer' | 'tesseract' | 'abbyy' | 'pdfjs';
  ocr: 'tesseract' | 'abbyy' | 'google-vision' | 'ms-cognitive-services' | 'amazon-textract';
  credentials?: {
    ABBYY_SERVER_URL?: string; // ABBYY
    ABBYY_SERVER_VER?: string; // ABBYY
    ABBYY_WORKFLOW?: string; // ABBYY
    AWS_ACCESS_KEY_ID?: string; // AWS TEXTRACT
    AWS_SECRET_ACCESS_KEY?: string; // AWS TEXTRACT

    // GOOGLE VISION
    auth_provider_x509_cert_url?: string;
    auth_uri?: string;
    client_email?: string;
    client_id?: string;
    client_x509_cert_url?: string;
    private_key?: string;
    private_key_id?: string;
    project_id?: string;
    token_uri?: string;
    type?: string;

    // MS COGNITIVE SERVICES
    OCP_APIM_SUBSCRIPTION_KEY?: string;
    OCP_APIM_ENDPOINT?: string;
  };

  language: TesseractLanguage | TesseractLanguage[];
}

type TesseractLanguage =
  | 'afr'
  | 'amh'
  | 'ara'
  | 'asm'
  | 'aze'
  | 'aze_cyrl'
  | 'bel'
  | 'ben'
  | 'bod'
  | 'bos'
  | 'bre'
  | 'bul'
  | 'cat'
  | 'ceb'
  | 'ces'
  | 'chi_sim'
  | 'chi_sim_vert'
  | 'chi_tra'
  | 'chi_tra_vert'
  | 'chr'
  | 'cos'
  | 'cym'
  | 'dan'
  | 'deu'
  | 'div'
  | 'dzo'
  | 'ell'
  | 'eng'
  | 'enm'
  | 'epo'
  | 'est'
  | 'eus'
  | 'fao'
  | 'fas'
  | 'fil'
  | 'fin'
  | 'fra'
  | 'frk'
  | 'frm'
  | 'fry'
  | 'gla'
  | 'gle'
  | 'glg'
  | 'grc'
  | 'guj'
  | 'hat'
  | 'heb'
  | 'hin'
  | 'hrv'
  | 'hun'
  | 'hye'
  | 'iku'
  | 'ind'
  | 'isl'
  | 'ita'
  | 'ita_old'
  | 'jav'
  | 'jpn'
  | 'jpn_vert'
  | 'kan'
  | 'kat'
  | 'kat_old'
  | 'kaz'
  | 'khm'
  | 'kir'
  | 'kmr'
  | 'kor'
  | 'kor_vert'
  | 'lao'
  | 'lat'
  | 'lav'
  | 'lit'
  | 'ltz'
  | 'mal'
  | 'mar'
  | 'mkd'
  | 'mlt'
  | 'mon'
  | 'mri'
  | 'msa'
  | 'mya'
  | 'nep'
  | 'nld'
  | 'nor'
  | 'oci'
  | 'ori'
  | 'osd'
  | 'pan'
  | 'pol'
  | 'por'
  | 'pus'
  | 'que'
  | 'ron'
  | 'rus'
  | 'san'
  | 'script/Arabic'
  | 'script/Armenian'
  | 'script/Bengali'
  | 'script/Canadian_Aboriginal'
  | 'script/Cherokee'
  | 'script/Cyrillic'
  | 'script/Devanagari'
  | 'script/Ethiopic'
  | 'script/Fraktur'
  | 'script/Georgian'
  | 'script/Greek'
  | 'script/Gujarati'
  | 'script/Gurmukhi'
  | 'script/HanS'
  | 'script/HanS_vert'
  | 'script/HanT'
  | 'script/HanT_vert'
  | 'script/Hangul'
  | 'script/Hangul_vert'
  | 'script/Hebrew'
  | 'script/Japanese'
  | 'script/Japanese_vert'
  | 'script/Kannada'
  | 'script/Khmer'
  | 'script/Lao'
  | 'script/Latin'
  | 'script/Malayalam'
  | 'script/Myanmar'
  | 'script/Oriya'
  | 'script/Sinhala'
  | 'script/Syriac'
  | 'script/Tamil'
  | 'script/Telugu'
  | 'script/Thaana'
  | 'script/Thai'
  | 'script/Tibetan'
  | 'script/Vietnamese'
  | 'sin'
  | 'slk'
  | 'slv'
  | 'snd'
  | 'snum'
  | 'spa'
  | 'spa_old'
  | 'sqi'
  | 'srp'
  | 'srp_latn'
  | 'sun'
  | 'swa'
  | 'swe'
  | 'syr'
  | 'tam'
  | 'tat'
  | 'tel'
  | 'tgk'
  | 'tha'
  | 'tir'
  | 'ton'
  | 'tur'
  | 'uig'
  | 'ukr'
  | 'urd'
  | 'uzb'
  | 'uzb_cyrl'
  | 'vie'
  | 'yid'
  | 'yor';
