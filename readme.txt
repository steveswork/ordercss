Name: ordercss

npm i -D ordercss;

This package is a cli application created to alleviate the CSS extraction conflict order issues encountered in next.js 
applications. It is intended to be run BEFORE build process of next.js applications or similar applications where the
aforementioned CSS order conflict error is a concern.

It pulls and organizes in heirarchy all non-referenced style imports from script files of .js, .jsx, .ts and .tsx modules 
found in the dependency graph of a main entry script module. The resultant organised CSS paths are listed in the terminal.

Additionally, a newly generated module is also installed within the same directory as the main entry script module. All of 
the curated CSS paths are then imported into the installed module relative to the entry script module. The installed module 
is named in the following format: 
		<main entry script module filename>_css_manifest.<js or ts accoring to main entry script module extension>.

It is advisable to make in advance, within the main entry script module, an unreferenced import of the yet-to-be generated
css manifest module. This would make the side effects of the module immediately available to the application upon generation.
Such import/require of the css manifest is to made in the main entry script module in any of the following formats:

import './<main entry script module filename>_css_manifest.<js, ts>'
require('./<main entry script module filename>_css_manifest.<js, ts>')
require './<main entry script module filename>_css_manifest.<js, ts>'

Module import paths without extensions are assumed to be either direct script imports with any of those extensions or
index files residing in a directory of the imported source path.

Only script module import paths starting with '.' are currently examined. 

Only non-referenced css 'imports' and 'requires' with the following extensions are currently curated:
.css, .less, .sass, .scss and .stylus.
Futhermore, all non-referenced css 'imports' and 'requires' to be curated are to be commented in the dependent script module 
in any of these format:
//[optional space]--[optional space]import '../../example.css'
//[optional space]--[optional space]require('../../example.css')
//[optional space]--[optional space]require '../../example.css'

Usage Scenario:
cd: into your project root or any other preferred location within the project.
run: ordercss <entryModulePath> // Please see argument details in the next section 

cli arguments:
1. entryModulePath
The entryModulePath is a required argument bearing the file location of a module whose dependency graph would be 
examined for non-referenced css imports and curated. The expected path is either the absolute module path or the module path 
relative to the current working directory.

Prologue: Consideration was given to creating this package as webpack plugin. Also considered were others using other
build systems and the continued compatibility with all complimentary build tools. The eventual decision was to provide 
this package a standalone entity at the present time.
