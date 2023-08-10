# Parsr Configuration

- [Parsr Configuration](#parsr-configuration)

  - [1. Structure](#1-structure)
  - [2. Extractor Config](#2-extractor-config)
    - [2.1. Extractor Tools](#21-extractor-tools)
    - [2.2. Language](#22-language)
  - [3. Cleaner Config](#3-cleaner-config)
  - [4. Output Config](#4-output-config)
    - [4.1. Output Format](#41-output-format)
    - [4.2. Granularity](#42-granularity)
    - [4.3. Include Marginals](#43-include-marginals)
    - [4.4. Include Drawings](#44-include-drawings)
  - [5. Exempli gratia](#5-exempli-gratia)

To configure the pipeline and choose what modules will be called and with what parameters, you have to provide a JSON file.
There is only a few required keys:

- `version` `[Number]` is the version number of the API.
- `extractor` `[Object]` is a bunch of parameters about the extraction.
- `cleaner` `[Array]` is a list of every cleaning tools that will be called.
- `output` `[Object]` contains the list of formats to export and some other details.

Cleaning tools have default parameters that work pretty well, but you can override the parameters by providing them in the config.

The cleaner array may appear unconventional but is really easy to use. Every item can be of type:

- `String`: it's the name of the cleaning tool you want to call.
- `Object`: it's the parameters for the cleaning tool below.

## 1. Structure

```js
{
    "version": 0.9,               // Version number of the configuration file format
    "extractor": {                // Extraction options (See section 2.)
        "pdf": "extractor-tool",  // Select the tool to extract PDF files
        "ocr": "extractor-tool",  // Select the tool to extract image files (JPG, PNG, TIFF, etc.)
        "language": "lang",       // Select the defaut language of your document. This is used to increase the accuracy of OCR tools (See section 2.2)
        "credentials": {          // Extractors running online services may require credentials to work. (see section 2.3)
          "API_KEY": "..."
        }
    },
    // The cleaner pipeline consists of a list of modules that will run on given file (See section 3.)
    "cleaner": [
        // The first module to run on the document and send the result to the next module
        "module-name-1",
        // The second module to run. This syntax is also accepted. It will use only the default module options
        [
            "module-name-2"
        ],
        // The thrid module to run with some special options
        [
            "module-name-3",
            { "option-1": { value: 50, min: 0, max: 100 }, "option-2": { value: true } }
        ],
    ],
    // Output options (See section 4.)
    "output": {
        "formats": {                       // list of format that will be outputed (See section 4.1.)
            "json": true,
            "text": false,
            "csv": true,
            "markdown": false
        },
        "granularity": "word | character",  // Set the granularity of the output (See section 4.2.)
        "includeMarginals": false,          // Chose whether the output will include headers and footers (See section 4.3.)
        "includeDrawings": false,           // Choose whether the output will include Drawings information.
    }
}
```

_This means the module called `module-name-1` will be called, then `module-name-2`, then `module-name-3` with some special parameters, etc._

## 2. Extractor Config

### 2.1. Extractor Tools

Different extractors are available for each input file format.

- **PDF files:** four extractors are currently available for PDF files:

  - `pdfminer`, which is an advanced python based extractor capable of extracting low and high level textual structures (from characters to paragraphs),
  - `pdfjs`, Mozilla's free solution for parsing documents. This is the recommended extractor to parse large documents (200+ pages).
  - `abbyy`, uses ABBYY Finereader service to extract contents from a PDF.

  If none is specified, `pdfminer` is the default one.

- **Images:** five OCR extractors are supported for images:

  - `tesseract` which is an Open Source OCR software,
  - `abbyy`, that relies on ABBYY Finereader, a paid solution for OCR on documents and images,
  - `google-vision`, which uses the [Google Vision](https://cloud.google.com/vision/) API to detect the contents of an image (see the [google vision documentation for more](../server/src/input/google-vision/README.md)),
  - `ms-cognitive-services`, that uses [Microsoft Cognitive Services](https://azure.microsoft.com/es-es/services/cognitive-services/) OCR to detect and process text inside an image.
  - `amazon-textract`, that uses [Amazon Textract](https://us-east-2.console.aws.amazon.com/textract/home) service to detect and process text inside an image.

  If none is specified, `tesseract` is the default one.

*Other supported file formats:*
- **XML:** if an XML file is used as input, it will be interpreted with ABBYY.
- **JSON:** JSON files extractor will expect the structure defined in [Parsr JSON output](json-output.md)
- **EML:** .eml files will be converted into a PDF with A4 size pages, and then processed with the selected PDF extractor.
- **DOCX:** .docx files will be converted into a PDF with A4 size pages, and then processed with the selected PDF extractor.

### 2.2. Language

The language parameter is an option that will be pass to Tesseract when using it. It must be in the [Tesseract language format](https://github.com/tesseract-ocr/tesseract/blob/master/doc/tesseract.1.asc#languages), which is an equivalent of [ISO 639-2/T](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

### 2.3 Credentials

Each input module may require some credentials to work properly.
For example, `ms-cognitive-services` extractor requires two values:

```json
{
  "OCP_APIM_SUBSCRIPTION_KEY": "<SUBSCRIPTION_KEY>",
  "OCP_APIM_ENDPOINT": "https://westeurope.api.cognitive.microsoft.com/"
}
```

`OCP_APIM_SUBSCRIPTION_KEY` has to be obtained through Azure web console.
`OCP_APIM_ENDPOINT` is required, but has a default value set.

Default credential values for each module can be found in each `credentials.json` file.

The recommended way to set credentials is to add them to the extractor config:

```json
  "extractor": {
    "pdf": "pdfminer",
    "ocr": "ms-cognitive-services",
    "credentials": {
      "OCP_APIM_SUBSCRIPTION_KEY": "<API_KEY>",
      "OCP_APIM_ENDPOINT": "<API_ENDPOINT>" //as OCP_APIM_ENDPOINT is already defined in credentials.json, this key can be omitted.
    }
  },
```

For more information about input modules and their required credentials, you can check the [Input Modules Documentation](../server/src/input/README.md).

## 3. Cleaner Config

The pipeline is defined by every module names and their options. Modules will then be run one by one in the same order as in the configuration.

Module can be called in the full form:

```json
[
	"module",
	{
		"option-1": 100,
		"option-2": true
	}
],
```

Or just with there default options:

```json
[
	"module"
],
```

Or just with there default options in the condensed format:

```json
"module",
```

_Note: some modules have dependencies that need to be called before in the pipeline._

## 4. Output Config

### 4.1. Output Format

The platform can export the following formats:

- `json`, structure defined in [Parsr JSON output](json-output.md).
- `simpleJson`, structure defined in [Parsr simpleJSON output](simple-json-output.md).
- `markdown`,
- `text`,
- `csv`,
- `pdf` (pandoc required)

### 4.2. Granularity

The `granularity` parameter can be either `word` or `character` and defines at what level of granularity the export will be.

If the level is not specified, `word` is the default one.

_Warning: exporting with a character granularity will result on very big Json files (probably more than 10Mo)._

### 4.3. Include Marginals

The `includeMarginals: boolean` parameter allows to chose whether the output will include headers and footers.

### 4.4. Include Drawings

The `includeDrawings: boolean` parameter specifies if json output should contain information about Drawings.

*Warning: including Drawings information could greatly increase json output size.*

## 5. Exempli gratia

```json
{
  "version": 0.9,
  "extractor": {
    "pdf": "pdfminer",
    "ocr": "tesseract",
    "language": ["eng", "fra"]
  },
  "cleaner": [
    "out-of-page-removal",
    "whitespace-removal",
    "redundancy-detection",
    "table-detection",
    ["header-footer-detection", { "maxMarginPercentage": 15 }],
    ["reading-order-detection", { "minColumnWidthInPagePercent": 15 }],
    "link-detection",
    ["words-to-line", { "maximumSpaceBetweenWords": 100 }],
    "lines-to-paragraph",
    "page-number-detection",
    "hierarchy-detection",
    [
      "regex-matcher",
      {
        "queries": [
          {
            "label": "Car",
            "regex": "([A-Z]{2}\\-[\\d]{3}\\-[A-Z]{2})"
          },
          {
            "label": "Age",
            "regex": "(\\d+)[ -]*(ans|jarige)"
          },
          {
            "label": "Percent",
            "regex": "([\\-]?(\\d)+[\\.\\,]*(\\d)*)[ ]*(%|per|percent|pourcent|procent)"
          }
        ]
      }
    ]
  ],
  "output": {
    "granularity": "word",
    "includeMarginals": false,
    "includeDrawings": false,
    "formats": {
      "json": true,
      "text": true,
      "csv": true,
      "markdown": true,
      "pdf": false
    }
  }
}
```
