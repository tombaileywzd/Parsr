# Parsr Usage Guide

- [Parsr Usage Guide](#parsr-usage-guide)
  - [1. Install npm packages](#1-install-npm-packages)
  - [2. Run](#2-run)
    - [2.1. Configuration](#21-configuration)
    - [2.2. Demo: Web Viewer](#22-demo-web-viewer)
      - [2.2.1. Under Linux/MacOS](#221-under-linuxmacos)
      - [2.2.2. Under Windows](#222-under-windows)
      - [2.2.3. GUI Usage](#223-gui-usage)
    - [2.3. Command Line Usage](#23-command-line-usage)
      - [2.3.1. Available Parameters](#231-available-parameters)
      - [2.3.2. Usage examples](#232-usage-examples)
  - [3. API](#3-api)
  - [4. Test](#4-test)

You can use Parsr in different ways:

- Using the command line
- Using the API
- Using the demo web viewer

## 1. Install npm packages

Inside the Parsr folder (where it has been installed), launch:

```sh
npm install
```

## 2. Run

### 2.1. Configuration

The tool contains a pipeline of modules that process the document step by step and is highly configurable. To change it's default configuration, please refer to the [configuration file documentation](configuration.md).

### 2.2. Demo: Web Viewer

To start the web viewer demo, simply run:

#### 2.2.1. Under Linux/MacOS:

```sh
npm run start:web:vue
```

#### 2.2.2. Under Windows:

In two different terminals, first:

```sh
npm run start:api
```

then in the other one:

```sh
cd demo/vue-viewer && npm install && npm run serve
```

Open [localhost:8080](http://localhost:8080) with your favorite browser to use the GUI.

#### 2.2.3. GUI Usage

For an explanation on how to use the web viewer demo, refer to the [GUI Usage Guide](gui-guide.md).

### 2.3. Command Line Usage

#### 2.3.1. Available Parameters

````
-f, --input-file <filename>       // Input file to be processed.
-o, --output-folder <foldername>  // Location of the folder where the output will be stored.
-n, --document-name <name>        // Name of the document.
-c, --config <filename>           // The file's path from which the application's parameters will be loaded.
-l, --log-level <verbosity>       // Verbosity level: debug, info (default), warn, error.
-p, --pretty-logs                 // Make logs look pretty but unreadable for a machine.
````

#### 2.3.2. Usage examples

Under Mac OS X, Linux:

```sh
npm run run:debug -- --input-file samples/t1.pdf --output-folder dist/ --document-name example --config server/defaultConfig.json --pretty-logs
```

Under Windows:

```sh
cmd /C "npm run run:debug -- --input-file samples/t1.pdf --output-folder samples --document-name example --config server/defaultConfig.json --pretty-logs"
```

## 3. API

Install the API server with:

```sh
npm run install:api
```

And then start the API server with:

```sh
npm run start:api
```

You can then call endpoints on [localhost:3001](http://localhost:3001).

The documentation for the API can be found [here](api-guide.md).

## 4. Test

```sh
npm run test
```
