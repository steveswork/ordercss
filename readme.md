# OrderCSS CLI

**Name:** OrderCSS

**Usage:** Please see [Usage](#usage) section

**Install:**\
npm i -g @webkrafters/ordercss\
npm i -D @webkrafters/ordercss

# Intro

This is a cli tool created to alleviate the CSS extraction conflict order issues encountered in next.js and similarly situated applications. It is intended to be run BEFORE the build process where the aforementioned CSS ordering conflict error is a real concern. ***And it would only ever need to be run when new [non-referenced CSS import statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Import_a_module_for_its_side_effects_only) are made to project modules as described in the [Requirements](#requirements) section.***

For those using CSS-in-JS or other scoped CSS technologies but are still receiving the CSS extraction conflict order warnings, such warnings may be suppressed by merely setting the `ignoreOrder` property of their CSS extractor options (for those that support it). For the rest of the applications, doing same may suppress such warnings but may not abate style misapplication and other effects of CSS ordering conflicts.

### Motivation

There is forever a need for the proverbial UI component whose look-and-feel is readily and intuitively configurable. The direct application of CSS selectors (whether through non-referenced pure CSS modules or through its non-referenced preprocessor modules such as LESS, SASS etc.) to UI components is a direct solution to this need.

 - The usage of the term "non-referenced" refers to import and require statements and expressions made for their side effects as defined in the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Import_a_module_for_its_side_effects_only) 

The OrderCSS CLI facilitates this paradigm in modularized UI component building by assisting with the hierarchical arrangement and importation of non-referenced CSS modules in environments that for one reason or another cannot do the same.

# Mechanics

OrderCSS is designed to pull and organize in hierarchy all non-referenced CSS module imports from script files of .js, .jsx, .ts and .tsx modules found in the dependency graph of a main entry script module. The resultant organized CSS paths are firstly listed in the terminal.

Additionally, a newly generated module is installed within the same directory as the main entry script module to serve as a CSS manifest listing all non-referenced CSS module imports in the order of priority. All of the curated CSS paths are imported into the manifest module relative to the entry script module. 

**Where multiple main entry path arguments are supplied, the result is an aggregated hierarchy. The resultant CSS manifest module is created at the last argument directory.** 

The installed manifest module is named in the following format:

    <main entry script module filename>_css_manifest.<js or ts accoring to main entry script module extension>

Please be sure to see the [Usage Steps](#usage-steps) section below for very crucial details.

## Special cases

Any module import/require expression with path argument ***(better known as module name)*** without extension information is assumed to be either a direct script import with any of the following extensions **.js .jsx .ts .tsx** or a directory containing an index file with one of the four aforementioned extensions.

# Usage

### Preamble

It is advisable to make in advance, within the main entry script module, a non-referenced import of the yet-to-be generated CSS manifest module. This would make the side effects of the manifest immediately available to the project after the initial build following its generation. Such import/require of the CSS manifest module is to be made at the point of usage in any one of the following formats:

    import './<main entry script module filename>_css_manifest.<js|ts>'
    require('./<main entry script module filename>_css_manifest.<js|ts>')
    require './<main entry script module filename>_css_manifest.<js|ts>'
 
### Requirements

Only script module import/require expressions with path argument starting with at least a dot **(.)** are currently inspected for non-referenced CSS module usage.

Only non-referenced CSS module import/require expressions with the following extensions are currently curated: **.css, .less, .sass, .scss .stylus**

Furthermore, all non-referenced CSS import/require expressions to be curated are to be commented in the dependent script module in any one of these formats:

    //[optional space(s)]--[optional space(s)]import '../../example.css'
    //[optional space(s)]--[optional space(s)]require('../../example.css')
    //[optional space(s)]--[optional space(s)]require '../../example.css'


### Usage Steps

open the command line terminal

cd into the project root or any other preferred location within the project.

run `ordercss <...main entry module path>`

#### The mainEntryModulePath Arguments

The ordercss cli is variadic. The lone ***mainEntryModulePath*** is a required argument set bearing the file location(s) of one or many module(s) whose dependency graph(s) would be inspected for non-referenced CSS module imports and curated. The expected parameter value for each argument item is the absolute path to the entry module file or the entry module file path relative to the current working directory.

**Note:** for usual use-cases, it is advisable to enter path arguments hierarchically beginning from the logical top-most module.

The motivation behind the support for variadic functionality is the accommodation for breaks in the import/require sequence. One good example of this use-case is the disconnect between the next.js pages/_app.js and page/<specific_page>.js. For such a scenario, the following sample cli command is applicable:

`ordercss <pages dirname>/pages/_app.js <pages dirname>/pages/<specific page>.js`

The resolution of arguments into a single hierarchized CSS import list is carried out in a LIFO manner. The resulting CSS manifest module is created for the module residing in and stored in the parent directory of the last path argument.

### Sample Use-case: Mild Complexity (Curating a Whole Next JS Application)

Let us consider a whole next.js application containing the usual `./pages/_app.js` and five pages which we shall place as thusly:
- ./pages/page_1/index.js
- ./pages/page_2/index.js
- ./pages/page_3/index.js
- ./pages/page_4.js
- ./pages/page_5/index.js

Let us further consider that each page imports several child js|jsx|ts|tsx modules and perhaps non-referenced CSS import(s) of its own local CSS module(s) (colocated hopefully but not mandatory).

As is customary in a regular component based application, many of the child modules in turn further import and share themselves and their child modules with each other. Their child modules do the same. So on and so forth...

**Assume:** we would like to import all of our non-referenced CSS modules at the app level. This will make all of the application CSS modules automatically curated, hierarchized according to need and imported at a location that is accessible to all parts of application at all times.

#### Approach 1:

1. Make sure that all affected instances of non-referenced CSS import statements are commented as described in the [Requirements](#requirements) section.
    
2. Add a non-referenced import statement to the pages/_app.js file.\
**./page_5/index.js** will be the last path in our mainEntryModulePath parameter. Therefore the `./page_5` directory will be the location of the generated CSS manifest. Hence the need to import page_5 CSS manifest.  See [Approach 2](#approach-2) for an alternative. 
	##### Feel free to adjust the list according to your specific requirements.  Keep in mind that CSS manifests are colocated with the lastly listed path of the mainEntryModulePath parameter.
	   
	    ...
	    import './page_5/index_css_manifest.js'
	    ...
	   
3. In terminal, cd to any directory in the application and run the ordercss command for the 5 pages.\
For the sake of this exercise, let's navigate to the root of the proverbial application (e.g. */home/dev/demo* )
	- run `ordercss /home/dev/demo/pages/page_1/index.js /home/dev/demo/pages/page_2/index.js  /home/dev/demo/pages/page_3/index.js /home/dev/demo/pages/page_4.js  /home/dev/demo/pages/page_5/index.js`

4. Check your pages/page_5 directory and expect to find the following CSS manifest file
	- index_css_manifest.js

5. Please see the [What to Expect](#what-to-expect) section


####  Approach 2:

1. Make sure that all affected instances of non-referenced CSS import statements are commented as described in the [Requirements](#requirements) section.

2. Add a script (.js or .ts) module to the application (preferably sharing same parent directory with the _app.js file).\
Let's place this file in the `pages/` directory and name it `app-styles.js` for instance. The file contains non-referenced imports of the yet-to-be generated CSS manifests such as the following:
   ```
    import './page_1/index_css_manifest.js'
    import './page_2/index_css_manifest.js'
    import './page_3/index_css_manifest.js'
    import './page_4_css_manifest.js'
    import './page_5/index_css_manifest.js'
   ```
    
3. Add a non-referenced import statement to the pages/_app.js file.
   ```
    ...
    import './app-style'
    ...
   ```

4. In terminal, cd to any directory in the application and run the ordercss command for the 5 pages.\
For the sake of this exercise, let's navigate to the root of the proverbial application (e.g. */home/dev/demo* )
	- run `ordercss /home/dev/demo/pages/page_1/index.js`
	- run `ordercss /home/dev/demo/pages/page_2/index.js`
	- run `ordercss /home/dev/demo/pages/page_3/index.js`
	- run `ordercss /home/dev/demo/pages/page_4.js`
	- run `ordercss /home/dev/demo/pages/page_5/index.js`

	**Note:** these commands could also be bundled up in an external script file, referenced in a package.json script property and then ran collectively as an ordinary `npm script`.<br />

	**Extra credit:** Add the node js `child_process.spawn` functionality to your script file have them run concurrently.  

5. Check your directory structure and expect to find the following CSS manifests
	- pages/page_1/index_css_manifest.js
	- pages/page_2/index_css_manifest.js
	- pages/page_3/index_css_manifest.js
	- pages/page_4_css_manifest.js
	- pages/page_5/index_css_manifest.js

#### What to Expect

1. CSS changes are immediately available within the application following the build process. Even more so, if the application is running in auto-reload environments (such as those engaging in **hmr** and **nodemon**).

2. Blazingly fast client side transitions and markedly improved server-side navigation.

3. End of CSS extraction order conflict issues.

# Prologue

Consideration was initially given to creating this application as a webpack plugin. Also considered were the concerns of developers using other build systems and the continued compatibility with all complementary build tools. The eventual decision was to provide this application as a standalone cli tool at the present time.
