# Processing Modules

- [Processing Modules](#processing-modules)
	- [1. Current Processing Modules](#1-current-processing-modules)
	- [2. Create your own Processing Module](#2-create-your-own-processing-module)
		- [2.1. Creating and Naming your Typescript Module](#21-creating-and-naming-your-typescript-module)
		- [2.2. Add to Register](#22-add-to-register)
		- [2.3. Add it to the Configuration](#23-add-it-to-the-configuration)
		- [2.4. Run it!](#24-run-it)

The processing modules in Parsr perform a central role of cleaning and enriching the extracted raw output.
Each module performs a particular operation on a document representation, generates a new valid Document, and then passes it on to the next module for the next treatment.
Each module can contain a set of configurable parameters, which can be consulted in the per-module documentation pages below:

## 1. Current Processing Modules

1. [Drawing Detection](DrawingDetectionModule/README.md)
2. [Header and Footer Detection](HeaderFooterDetectionModule/README.md)
3. [Heading Detection](MLHeadingDetectionModule/README.md)
4. [Hierarchy Detection](HierarchyDetectionModule/README.md)
5. [Image Detection](ImageDetectionModule/README.md)
6. [Key-Value Pair Detection](KeyValueDetectionModule/README.md)
7. [Lines to Paragraph](LinesToParagraphModule/README.md)
8. [Link Detection](LinkDetectionModule/README.md)
9. [List Detection](ListDetectionModule/README.md)
10. [Number Correction](NumberCorrectionModule/README.md)
11. [Out of Page Removal](OutOfPageRemovalModule/README.md)
12. [Page Number Detection](PageNumberDetectionModule/README.md)
13. [Reading Order Detection](ReadingOrderDetectionModule/README.md)
14. [Redundancy Detection](RedundancyDetectionModule/README.md)
15. [Regex Matcher](RegexMatcherModule/README.md)
16. [Remote Module](RemoteModule/README.md)
17. [Separate Words](SeparateWordsModule/README.md)
18. [Table Detection](TableDetectionModule/README.md)
19. [Table of Contents Detection](TableOfContentsDetectionModule/README.md)
20. [Whitespace Removal](WhitespaceRemovalModule/README.md)
21. [Words To Line](WordsToLineModule/README.md)

## 2. Create your own Processing Module

Creating a custom module can be very useful to add some treatment on the document.

You have two ways to do it:

1. Use the [Remote Module](RemoteModule/README.md) that will send the JSON by HTTP and expect the modified JSON as an answer
2. Create a Typescript Module and add it to the pipeline

### 2.1. Creating and Naming your Typescript Module

The [template module folder](TemplateModule) shows how a module tree needs to be structured.
The folder name, the module's filename and the [class's name](https://github.com/axa-group/Parsr/blob/a92a254f7860bbfe51ec1f24171ef8d44c54ccac/server/src/processing/TemplateModule/TemplateModule.ts#L35) need to follow the [PascalCase naming convention](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md#class).

You can copy the entire folder to help you having a boilerplate.
The template code also contains some handy comments to help you get started.

### 2.2. Add to Register

To add your newly created module to the register, simply open the [Cleaner file](../Cleaner.ts) `/server/src/Cleaner.ts` and add your module class to the `Cleaner.cleaningToolRegister` attribute.

### 2.3. Add it to the Configuration

If you want your module to run you need to enable it in your [configuration](../../../docs/configuration.md#3-Cleaner-Config).

Simply add a line in the `cleaner` array with the name of your module, and potential options.

### 2.4. Run it!

That's it! Your new awesome processing module should run and modify the document according to your needs!
