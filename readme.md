# OrderCSS CLI

**Name:** OrderCSS

**Install:** npm i -D @webkrafters/ordercss

**Usage:**  `ordercss <main entry module path>`

# Intro

This is a cli tool created to alleviate the CSS extraction conflict order issues encountered in next.js applications. It is intended to be run BEFORE the build process of next.js or similarly situated applications where the aforementioned CSS order conflict error is a concern.

# Mechanics

OrderCSS is designed to pull and organize in hierarchy all non-referenced CSS module imports from script files of .js, .jsx, .ts and .tsx modules found in the dependency graph of a main entry script module. The resultant organised CSS paths are listed in the terminal.

 - The usage of the term "non-referenced" refers to imports and requires statements and expressions made for their side effects as defined in the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Import_a_module_for_its_side_effects_only) 

Additionally, a newly generated module is also installed within the same directory as the main entry script module to serve as a CSS manifest listing all non-referenced CSS module imports in the order of priority. All of the curated CSS paths are imported into the manifest module relative to the entry script module. The installed module is named in the following format:

    <main entry script module filename>_css_manifest.<js or ts accoring to main entry script module extension>

## Special cases

Any module import/require expression with path argument ***(better known as module name)*** without extension information is assumed to be either a direct script import with any of the following extensions **.js .jsx .ts .tsx** or a directory containing an index file with one of the four aforementioned extensions.

Please keep in mind that as a result of the CSS manifest generation within the project under inspection infinite reloads may occur in auto-reload environments (such as those engaging in **hmr** and **nodemon**). This is a side effect which produces instant development feedback and therefore encouraged. However, This behavior could be prevented by running this tool prior to engaging the auto-reloader.

# Usage

### Preamble

It is advisable to make in advance, within the main entry script module, a non-referenced import of the yet-to-be generated CSS manifest module. This would make the side effects of the module immediately available to the project upon generation. Such import/require of the CSS manifest module is to be made in the main entry script module in any one of the following formats:

    import './<main entry script module filename>_css_manifest.<js|ts>'
    require('./<main entry script module filename>_css_manifest.<js|ts>')
    require './<main entry script module filename>_css_manifest.<js|ts>'

 
### Requirements

Only script module import/require expressions with path argument starting with at least a dot **(.)** are currently inspected for non-referenced CSS module usage.

Only non-referenced CSS module import/require expressions with the following extensions are currently curated: **.css, .less, .sass, .scss .stylus**

Furthermore, all non-referenced CSS import/require expressions to be curated are to be commented in the dependent script module in any one of these formats:

    //[optional space]--[optional space]import '../../example.css'
    //[optional space]--[optional space]require('../../example.css')
    //[optional space]--[optional space]require '../../example.css'


### Usage Steps

open the command line terminal

cd into the project root or any other preferred location within the project.

run `ordercss <main entry module path>`

#### The mainEntryModulePath Argument

The lone ***mainEntryModulePath*** is a required argument bearing the file location of a module whose dependency graph would be inspected for non-referenced css module imports and curated. The expected parameter value is either the absolute path to the entry module file or the entry module file path relative to the current working directory.


# Prologue

Consideration was initially given to creating this package as webpack plugin. Also considered were the concerns of individuals using other build systems and the continued compatibility with all complementary build tools. The eventual decision was to provide this package a standalone entity at the present time.
