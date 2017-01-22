# OSSG
A tiny static site generator.

*(Contributions welcome. Not suitable for production use.)*

## Usage and Settings
Written as a script for [NodeJS](https://nodejs.org/), without dependencies, in a single source file.

OSSG compiles a folder of 'pages' (text content) together with HTML templates, to produce static websites.

Download the ossg.js file, or clone this repo, and run it:
```bash
node ossg.js settings.json
```

Where 'settings.json' is a JSON file containing configuration options as detailed below:

Property name | Description
--------------|------------
`input_path` | Path to the root directory of the source files
`output_path`| Path to the output directory
`input_pages_path`| Path to the pages, relative to `input_path`.
`output_pages_path`| Path to the pages, relative to `output_path`.
`resources`| Path to resources folder, relative to input and output directories.
`templates`| Array of templates, with `path` and `name` properties.
`title`| Site title.
`default`| Name of the 'default' template, which encapsulates every other page template. 
... | Arbitrary properties are supported and can be accessed in templates.

To generate a template settings.json file, run:
```bash
node ossg.js -g [filename]
```
If no filename is supplied, the file is called 'settings.json'.

Additionally, the `input_path` directory should contain an index.html file.
Files and folders in the `resources` folder will be recursively copied to the output folder.

## Pages
Pages can be text content of any format, including HTML. Markdown is the recommended choice, however.

Each page should start with a set of YAML-style properties, like so:
```yaml
---
title: hello
template: blog-post
title: Hello World!
---
Text content goes here...
```

OSSG doesn't yet provide a Markdown parser (as doing so would introduce dependencies). Parsing of Markdown pages could be done client side with a script in the default template that looks something like this:
```html
<script src="https://cdn.rawgit.com/showdownjs/showdown/1.6.0/dist/showdown.min.js"></script>
<script>
    window.onload = function() {
    	// select the content of the page somehow
    	var text = document.getElementById("page-content").innerHTML;
    	var converter = new showdown.Converter();
    	var html = converter.makeHtml(text);
    	document.getElementById("page-content").innerHTML = html;
	}
</script>
```
Replace Showdown with your favourite Markdown parser.
Alternatively, Markdown could be parsed in a prebuild step (along with CSS compilation or whatever) 
and passed as HTML to OSSG.


## Templating
ES6 templates are used as a templating engine.
This is sufficient for most uses, including loops and conditionals.
Templates have access to a `site` object, which contains the contents of the settings file, and a `page` object, which has the properties of the current page. It also contains an array of page objects.

Every page object has the following properties:

Property name | Description
--------|--------
`path` | Path of this page relative to `output_path`.
`name` | Name of the page (or filename if it hasn't been set in the page properties).
`title` |  Title of the page as set in the properties.
`content` | Page content. 

Any other properties in the page properties header should be accessible.

Basic templating:
```html
<div>
	<h1>${page.title}</h1>
    <div>${page.content}</div>
</div>
```
As another example, getting the first five pages and displaying them as a list of links:
```js
${site.pages.map((page, index) => `
    ${(index < 5) ? `<li><a href="${page.path}">${page.title}</a></li>` : ''}
`).join('')}
```
The above example exploits the fact template strings are nestable.

Templates also have access to include() and getPage() functions which take a page name as an argument. This way, other pages can be included within a template.
