const fs = require('fs');

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
                console.log(file);
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