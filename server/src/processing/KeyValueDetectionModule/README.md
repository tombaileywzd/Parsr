# Key-Value Detection Module

## Purpose

Detect pairs of key-value throughout each page of a document, depending on a certain number of key-value patterns passed onto the pipeline in the configuration.

## What it does

Generates new `metadata` instances for each match of a key-value pair which validate a match above a certain threshold.

## Dependencies

[Words to Line Module](../WordsToLineModule/README.md)

## How it works

1. All the Line elements of a page are searched for matches with a set of predefined keys in the module parameters using a string matching algorithm based on the Sørensen–Dice coefficient.
   Only the matches with a similarity score higher than a threshold are kept as candidates.
2. The resulting set of matched keys are kept as candidates, and a corresponding value is looked for in the vicinity of the found key (on the right of the separator character: ':' or ';' by default).
3. Each key with its corresponding value is saved as a KeyValueMetadata type and attached to the concerned elements.

## Parameters

The configuration of the module is where the key patterns are described.
Following is an example of the configuration of the key-value search module:

```json
[
  "key-value-detection",
  {
    "thresholdRatio": 0.8,
    "keyValueDividerChars": [":", ";"],
    "keyPatterns": {
      "Name": ["Name", "Fullname", "User"],
      "Date of admission": ["ADMISSION DATE & TIME", "Adm Date/Time", "Reg/Admit Date"]
    }
  }
]
```

Here, the `keyValueDividerChars` describes the sets of characters that are used in the input document to separate the keys from values in a key-pair description.
`keyPatterns` describe objects describing the key names and patterns on which these key names need to be matched.
`threshold` describes the minimum similarity score for candidate substrings matches to pass.

## Example

Imagine a document containing the following text:
```
.....
Name: John
Surnames: Doe
Residence: Fake Street 123
.....
```


with config: 
```json
{
  "thresholdRatio": 0.8,
  "keyValueDividerChars": [
    ":",
  ],
  "keyPatterns": {
    "First Name": [
      "Name", "First Name"
    ],
    "Surname": [
      "Surname", "Surnames", "Last Name"
    ],
    "Address": [
      "Address", "Domicile", "Residence"
    ]
  }
}
```

`document.metadata` property after execution of this module:
```json
[
  {
    "id": 1,
    "elements": [
      468,
      476
    ],
    "type": "key-value",
    "data": {
      "keyName": "First Name",
      "keyElements": [
        468
      ],
      "valueElements": [
        476
      ]
    }
  },
  {
    "id": 2,
    "elements": [
      487,
      498
    ],
    "type": "key-value",
    "data": {
      "keyName": "Surname",
      "keyElements": [
        487
      ],
      "valueElements": [
        498,
      ]
    }
  },
  {
    "id": 3,
    "elements": [
      399,
      431
    ],
    "type": "key-value",
    "data": {
      "keyName": "Address",
      "keyElements": [
        399
      ],
      "valueElements": [
        431
      ]
    }
  }
]
```

Here we can see that 3 matches have been found:
- **First Name**: Elements with IDs 468 and 476, corresponding to Words with contents "Name" and "John" respectively.
- **Surname**: Elements with IDs 487 and 498, corresponding to Words with contents "Surnames" and "Doe".
- **Address**: Elements with IDs 399 and 431, with contents "Residence" and "Fake Street 123"

Note that `keyElements` and `valueElements` properties are defined as an array, because more than one match can be found for that key-value pair.

## Accuracy

The accuracy is high.
There is a direct corelation with the quality of the readability of the input document, the OCR's output, as well as the threshold for acceptance of candidates.

## Limitations

The current implementation supposes that key value pairs are always arranged in a single line and in the form `key : value`.
This makes it applicable to only a few limited cases.
