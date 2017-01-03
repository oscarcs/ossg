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
                let htmls = generateHTML(pages);
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
    var data = '';
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
// Parse the pages
//
function parsePages()
{
    let filenames = getFilenames(settings.pages_path);
    let pages = [];

    for (file in filenames)
    {
        pages.push(readFile(settings.pages_path + '/' + filenames[file]));
    }

    for (index in pages)
    {
        let page = pages[index];
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

        if (metadata)
        {
            yamlObj = parseMetadata(metadata);
        }
    }
}

//
// Parse YAML metadata.
//
function parseMetadata(metadata)
{

}

//
// Generate HTML
//
function generateHTML(contents)
{
    //@@TODO: add html header
    //@@TODO: add references to css and markdown parser as appropriate
    //@@TODO: add page contents
    //@@TODO: close html file
    //@@TODO: write html out
}

function printHelp()
{
    console.log("Usage: node osstk.js [options] file");
    console.log("Oscar's simple site toolkit. Compile templates, css, & posts into a website.");
}

function printVersion()
{
    console.log("OSSTK: v0.0.1");
}

main();