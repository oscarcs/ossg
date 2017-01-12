const fs = require('fs');

let settings = {};

function main()
{
    let args = getArguments();
    if (args.length < 1)
    {
        printHelp();
    }
    else 
    {
        if (args[0] == '-h' || args[0] == '-help' || args[0] == '--help')
        {
            printHelp();
        }
        else if (args[0] == '-V' || args[0] == '-version' || args[0] == '--version')
        {
            printVersion();
        }
        else if (args[0] == '-g')
        {
            generateSettings();
        }
        else 
        {
            let file = readFile(args[0]);
            if (file != null)
            {
                parseSettings(file);
                parsePages();

                // create page output folder if it doesn't exist.
                if (!folderExists(settings.output_path + '/' + settings.output_pages_path))
                {
                    createFolder(settings.output_path + '/' + settings.output_pages_path);
                }
                
                for (let index in settings.pages)
                {
                    let page = settings.pages[index];
                    let template = getTemplate(page.template);
                    let html = generateHTML(template, page);

                    // insert each page into the 'default' template.
                    let defaultTemplate = getTemplate(settings.default);
                    let defaultPage = page;
                    defaultPage.content = html;
                    let finalHtml = generateHTML(defaultTemplate, defaultPage);

                    writeFile(settings.output_path + '/' + settings.output_pages_path + '/' + page.name + '.html', finalHtml);
                }

                let index = getIndex();
                let indexHtml = generateHTML(index);
                writeFile(settings.output_path + '/index.html', indexHtml);
            }
        }
    }
}

//
// Get the command line arguments.
//
function getArguments()
{
    return process.argv.slice(2);
}

//
// Read in a utf8-encoded file.
//
function readFile(path)
{
    let data = '';
    try
    {
        data = fs.readFileSync(path, 'utf8');
        return data;
    }
    catch (err)
    {
        if (err.errno == -2)
        {
            //@@TODO: throw a proper error.
            throw "File not found: " + path;
        }
        else 
        {
            console.log(err);
        }
    }
}

//
// Write out a utf8-encoded file.
//
function writeFile(path, data)
{
    fs.writeFileSync(path, data);
}

//
// Get the names of files in a folder
//
function getFilenames(path)
{
    try {
        return fs.readdirSync(path);
    }
    catch (err) {
        if (err.errno == -2)
        {
            //@@TODO: throw a proper error.
            throw "Path not found: " + path;
        }
        else 
        {
            console.log(err);
        }
    }
}

//
// Check folder exists.
//
function folderExists(path)
{
    return fs.existsSync(path);
}

//
// Create folder.
//
function createFolder(path)
{
    fs.mkdirSync(path);
}

//
// Generate a settings JSON file.
//
function generateSettings()
{
    let json = {};
    json.input_path = "";
    json.output_path = "";
    json.input_pages_path = "";
    json.output_pages_path = "";
    json.templates = [{name: "default", path:""}];
    json.title = "";
    json.default = "default";

    let str = JSON.stringify(json, null, 4);
    writeFile("./settings.json", str);
}

//
// Parse the settings JSON file.
//
function parseSettings(data)
{
    let json = JSON.parse(data);
    const properties = {
        // paths
        input_path: ".",
        output_path: ".",
        input_pages_path: "./pages",
        output_pages_path: "./pages",

        templates: [
            // name:
            // path:
        ],

        // site settings
        base_url: "/",
        title: null,
        default: "default",

        // optimization options
        client_markdown: true,
        
    };

    for (property in properties)
    {
        if (json[property])
        {
            settings[property] = json[property];
        }
        else
        {
            settings[property] = properties[property];
        }
    }
}

//
// Parse the pages.
// Return page objects, which have metadata properties and a content property.
//
function parsePages()
{
    let filenames = getFilenames(settings.input_path + '/' + settings.input_pages_path);
    let pages = [];
    let pageObjs = [];

    for (file in filenames)
    {
        pages.push(readFile(settings.input_path + '/' + settings.input_pages_path + '/' + filenames[file]));
    }

    for (index in pages)
    {
        let page = pages[index];
        let pageObj = {};
        pageObj.name = filenames[index];

        //@@TODO: transform page contents

        // extract the metadata from the front of the file
        let pos = 0;
        let cur = page.charAt(pos);
        let metadata;

        function advance()
        {
            pos++; 
            cur = page.charAt(pos);
        }

        while (cur != null && cur != '')
        {
            if (cur == '-')
            {
                if (page.charAt(pos + 1) == '-' &&
                    page.charAt(pos + 2) == '-')
                {
                    pos++; 
                    cur = page.charAt(pos);
                    metadata = '';

                    while (cur != '-' || 
                        page.charAt(pos + 1) != '-' ||
                        page.charAt(pos + 2) != '-')
                    {
                        metadata += cur;
                        advance();
                    }
                    // move past the '---'
                    advance();
                    advance();
                    advance();
                    advance();
                    // chop off the metadata
                    page = page.slice(pos);
                    page = page.trimLeft();

                    // trim the front:
                    metadata = metadata.slice(2);
                    if (metadata.charAt(0) == '\n' || metadata.charAt(0) == '\r')
                    {
                        metadata = metadata.slice(1);
                    }

                    break;
                }
            }
            else if (cur != '\n' && cur != ' ' && cur != '\t' && cur != '\r')
            {
                //@@TODO: Emit a better error (and stop program?)
                console.log("no valid YAML, page " + index);
                break;
            }

            advance();
        }

        let dataObj = {};
        if (metadata)
        {
            dataObj = parseMetadata(metadata);
        }

        // defaults
        const properties = {
            name: pageObj.name,
            title: null,
            template: null,
            // ...
        };

        // copy the dataObj properties into the pageObj.
        for (property in properties)
        {
            if (dataObj[property])
            {
                pageObj[property] = dataObj[property];
            }
            else
            {
                pageObj[property] = properties[property];
            }
        }

        pageObj.content = page;
        pageObj.path = '/' + settings.output_pages_path + '/' + pageObj.name + '.html';

        pageObjs.push(pageObj);
    }
    settings.pages = pageObjs;
}

//
// Parse YAML metadata.
//
function parseMetadata(metadata)
{
    let lines = metadata.split('\n');
    let dataObj = {};
    for (i in lines)
    {
        let line = lines[i];
        line = line.trim();
        if (line == '') continue; // skip blank lines
        let separator = line.indexOf(':');
        let k = line.slice(0, separator);
        let v = line.substr(separator + 1);
        k = k.trim();
        v = v.trim();
        dataObj[k] = v;
    }
    return dataObj;
}

//
// Get template information by name.
//
function getTemplate(name)
{
    let template = settings.templates.find(function (e) {
        return e.name == name;
    });

    if (template != null)
    {
        template.html = readFile(settings.input_path + '/' + template.path);
    }
    else
    {
        //@@TODO: throw error and exit if template not found.
        throw 'No template called "' + name + '" found.';
    }

    return template;
}

//
// Get index template.
//
function getIndex()
{
    return {
        name: "index",
        path: settings.input_path + "/index.html",
        html: readFile(settings.input_path + '/index.html')
    };
}

//
// Get page information by name.
//
function getPage(name)
{
    let page = settings.pages.find(function (e) {
        return e.name == name;
    });

    if (page != null)
    {
        return page;
    }
    else
    {
        //@@TODO: throw error and exit if page not found.
        throw 'No page called ' + name + ' found.';
    }
}

//
// Generate HTML.
// A basic templating engine.
//
function generateHTML(template, page)
{
    site = settings; // alias global settings.

    let html = template.html;
    let output = '';

    //@@TODO: throw proper error.
    if (html.length == 0) throw "Template " + template.name + " has no content.";

    // include a page
    function include(name)
    {
        return getPage(name).content;
    }

    output = eval('`' + html + '`');

    return output;
}

function printHelp()
{
    console.log("Usage: node ossg.js [-g | -V | -h] [file]");
    console.log("Oscar's static site generator. Compile templates & pages into a website.");
}

function printVersion()
{
    console.log("OSSG: v0.0.1");
}

main();