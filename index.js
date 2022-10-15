const cheerio = require("cheerio");
const request = require("request");
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('[1] Enter Link (list)\n[2] Random (Enter Number)\n[3] One Random Article\n', option => {
    switch (option) {
        case '1':
            rl.question('Enter Link', link => {
                request({ uri: link, },
                    function(error, response, body) {
                        load(body, 0, new Set(), body.slice(body.indexOf('<title>') + 7, body.indexOf('</title>') - 12), true, 1);
                    }
                );
                rl.close();
            });
            break;
        case '2':
            rl.question('Number of Random Articles', number => {
                start(number);
                process.stdout.write(`Progress 0/${number}`);
                rl.close();
            });
            break;
        case '3': 
            start(1);
            rl.close();
            break;
        default:
            break;
    }
});


var dp = new Map();
var list = [];

function load(text, c, visited, originalName, printName, limit) {
    const $ = cheerio.load(text);
    let name = text.slice(text.indexOf('<title>') + 7, text.indexOf('</title>') - 12);
    if (printName) {
        console.log(`${c}] ${name}`);
    }
    if (visited.has(name)) {
        endCondo(originalName, -1, limit);
        return -1;
    } else {
        visited.add(name);
    }

    if (Number.isInteger(dp.get(name))) {
        if (dp.get(name) < 0) {
            endCondo(originalName, -1, limit);
            return -1;
        } else {
            endCondo(originalName, dp.get(name) + c, limit);
            return dp.get(name) + c;
        }
    }

    if (text.includes('<title>Philosophy')) {
        endCondo(originalName, c, limit);
        return c;
    }

    $('.noexcerpt nowraplinks').remove()
    $('.thumbinner').remove();
    $('#coordinates').remove();
    let link = $('#mw-content-text').html();

    let opens = allOpen(link, '<table');
    for (let index of opens) {
        link = close(link, index + 1, '<table', '</table>');
    }


    link = link.substring(link.indexOf('<p>'));


    opens = allOpen(link, '(');
    for (let index of opens) {
        link = close(link, index + 1, '(', ')');
    }
    
    while (link.includes('<a href="/wiki/File:')) {
        let index = link.indexOf('<a href="/wiki/File:');
        link = link.replace(link.slice(index, index + 20), '');
    }

    while (link.includes('<a href="/wiki/Category:')) {
        let index = link.indexOf('<a href="/wiki/Category:');
        link = link.replace(link.slice(index, index + 20), '');
    }

    while (link.includes('<a href="/wiki/Help:')) {
        let index = link.indexOf('<a href="/wiki/Help:');
        link = link.replace(link.slice(index, index + 20), '');
    }

    let start = link.slice(link.indexOf('<a href="/wiki'))
    link = link.slice(link.indexOf('<a href="/wiki'), link.indexOf('<a href="/wiki') + start.indexOf('</a>'));
    link = link.slice(link.indexOf('"') + 1, link.indexOf('" '));

    request({ uri: 'https://en.wikipedia.org' + link, },
        function(error, response, body) {
            let async_bad = c;
            dp.set(name, load(body, ++c, visited, originalName, printName, limit) - async_bad);
        }
    );
}

async function start(limit) {
    for (let i = 0; i < limit; i++) {
        request({ uri: "https://en.wikipedia.org/wiki/Special:Random", },
            function(error, response, body) {
                load(body, 0, new Set(), body.slice(body.indexOf('<title>') + 7, body.indexOf('</title>') - 12), limit == 1 ? true : false, limit)
            }
        );
    }

}

function endCondo(name, count, limit) {
    list.push([name, count]);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Progress ${list.length}/${limit}`);
    if (list.length == limit) {
        console.log();
        list.sort((a, b) => {
            return b[1] > a[1]
        });
        console.log(list);
    }
}

function allOpen(str, open) {
    let arr = [];
    const openlen = open.length;
    for (let i = 0; i < str.length; i++) {
        if (str.substring(i, i + openlen) === open) arr.push(i);
    }
    return arr;
}


function close(str, index, open, close) {
    let count = 0;
    const openlen = open.length;
    const closelen = close.length;
    for (let i = 0; i < str.length; i++) {
        if (str.substring(i + index, i + index + openlen) === open) count++;
        else if (str.substring(i + index, i + index + closelen) === close) {
            if (count == 0) {
                return str;
            } else {
                count--;
            }
        } else if (str[i + index] === '=') {
            str = str.replaceAt(i + index, 'X')
        }
    }
    return str;
}


String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}