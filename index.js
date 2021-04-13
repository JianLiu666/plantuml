const plantuml = require('node-plantuml');
const fs = require('fs');
const {promisify} = require('util');
const {resolve, dirname, basename} = require('path');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);


var projectPath = process.env.PROJECT_PATH;
console.log(`path = ${process.env.PROJECT_PATH}`);

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory()? getFiles(res): res;
    }));

    return files.reduce((a, f) => a.concat(f), []);
}


async function exportImages() {
    let files = [];
    if (!(await stat(projectPath)).isDirectory()) {
        files.push(projectPath);
    } else {
        files = await getFiles(projectPath);
    }

    let re = new RegExp(/\.puml$/);
    files.forEach(async (file) => {
        if (re.test(file)) {
            console.log(dirname(file).split("puml/")[1]);
            console.log(`Processing source: ${file}.`);

            let destDir = `${dirname(projectPath)}/images/${dirname(file).split("puml/")[1]}`;
            try {
                await mkdir(destDir);
            }
            catch(err) {
                // console.log(err);
            }

            let gen = plantuml.generate(file, {format: 'svg'});
            let dst = `${destDir}/${basename(file, '.puml')}.svg`;
            gen.out.pipe(fs.createWriteStream(dst));
            
            console.log(`Destination: ${dst}`);
        }
    });
}

exportImages();