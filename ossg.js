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
                    console.log(pages);

                    let page = pages[index];
                    let template = getTemplate(page.template);
                    let html = generateHTML(template, page);

                    //@@TODO: write html out
                    console.log(html);
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
            console.log("File not found: " + path);
        }
        else 
        {
            console.log(err);
        }
    }
}

//
// Write out a ut8-encoded file.
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
            console.log("Path not found: " + path);
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

        // optimization options
        client_markdown: false,
        
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
        //console.log(pages[page]);

        // extract the metadata from the front of the file
        let pos = 0;
        let cur = page.charAt(pos);
        let metadata;
        while (cur != null)
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
                        pos++; 
                        cur = page.charAt(pos);
                    }

                    // trim the front:
                    metadata = metadata.slice(2);
                    if (metadata.charAt(0) == '\n' || metadata.charAt(0) == '\r')
                    {
                        metadata = metadata.slice(1);
                    }

                    console.log(metadata);

                    console.log("YAML found, page " + index);
                    break;
                }
            }
            else if (cur != '\n' && cur != ' ' && cur != '\t' && cur != '\r')
            {
                console.log("no valid YAML, page " + index);
                break;
            }

            pos++;
            cur = page.charAt(pos);
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
        let separator = line.indexOf(':');
        let k = line.slice(0, separator);
        let v = line.substr(separator + 1);
        k = k.trim();
        v = v.trim();
        console.log(k + ", " + v);
        dataObj[k] = v;
    }
    return dataObj;
}

//
// Get template information.
//
function getTemplate(name)
{
    if (settings.templates[name] != null)
    {
        return settings.templates[name];
    }
    else
    {
        //@@TODO: throw error and exit if template not found.
    }
}

//
// Generate HTML
//
function generateHTML(template, page)
{
    let html = '';
    function add(line)
    {
        html += line + '\n';
    }
    
    //@@TODO: add page contents

    add('<!DOCTYPE html>');
    add('<html>');
        //@@TODO: finish html header
        add('\t<head>');
            add('\t\t<title>' + page.title + '</title>')
            //@@TODO: add references to css and markdown parser as appropriate
        add('\t</head>');
        add('\t<body>');

        add('\t</body>');

    html += '</html>';
    return html;
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