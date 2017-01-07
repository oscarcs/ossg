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
        else 
        {
            let file = readFile(args[0]);
            if (file != null)
            {
                parseSettings(file);
                let pages = parsePages();
                for (index in pages)
                {
                    let page = pages[index];
                    let template = getTemplate(page.template);
                    let html = generateHTML(template, page);

                    // insert each page into the 'default' template.
                    let defaultTemplate = getTemplate(settings.default);
                    let defaultPage = page;
                    defaultPage.content = html;
                    let finalHtml = generateHTML(defaultTemplate, defaultPage);

                    //@@TODO: write html out
                    console.log(finalHtml);
                }
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
// Parse the settings JSON file.
//
function parseSettings(data)
{
    let json = JSON.parse(data);
    const properties = {
        // paths
        input_path: ".",
        output_path: ".",
        pages_path: "./pages",

        // style and structure information
        styles: ["./style.css"],
        templates: [
            // name:
            // styles:
            // 
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
    let filenames = getFilenames(settings.pages_path);
    let pages = [];
    let pageObjs = [];

    for (file in filenames)
    {
        pages.push(readFile(settings.pages_path + '/' + filenames[file]));
    }

    for (index in pages)
    {
        let page = pages[index];
        let pageObj = {};
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

        pageObjs.push(pageObj);
    }
    return pageObjs;
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
// Get template information.
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
        throw 'No template called ' + name + ' found.';
    }

    return template;
}

//
// Generate HTML.
// A basic templating engine.
//
function generateHTML(template, page)
{
    site = settings;

    let html = template.html;
    let output = '';

    //@@TODO: throw proper error.
    if (html.length == 0) throw "Template " + template.name + " has no content.";

    output = eval('`' + html + '`');

    return output;
}

function printHelp()
{
    console.log("Usage: node ossg.js [options] file");
    console.log("Oscar's static site generator. Compile templates, css, & posts into a website.");
}

function printVersion()
{
    console.log("OSSG: v0.0.1");
}

main();