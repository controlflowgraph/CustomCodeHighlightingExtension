function isCustomSnippet(snippet) {
    return /^custom:.+$/.test(snippet.getAttribute("lang"));
}

function getCustomSnippets() {
    return Array.from(document.querySelectorAll('pre'))
        .filter(isCustomSnippet);
}

function buildHighlightingUrl() {
    const regex = /https:\/\/github.com\/(?<user>[^\/]+)\/(?<repo>[^\/]+).*/;
    const groups = document.URL.match(regex).groups;
    return `https://raw.githubusercontent.com/${(groups.user)}/${(groups.repo)}/main/LANGUAGE.high`;
}

const url = buildHighlightingUrl();

function httpGet(language) {
    const target = url.replace("LANGUAGE", language);
    return fetch(target)
        .then((response) => response.text())
        .then((text) => [language, text], (ahh) => {
            console.warn("Unable to get highlighting file for language: " + language + "!");
            return [language, ""];
        });
}

function isNotEmptyOrSpaces(str) {
    return str.match(/^ *$/) === null;
}

function parseLine(lang, line) {
    const regex = /^(?<name>[a-zA-Z]+) +(?<color>"(\\\\.|.)*") (?<pattern>"(\\\\.|.)*")$/;
    const match = line.match(regex);
    if (match == null) {
        console.warn("Line '" + line + "' in definition of '" + lang + "' is malformed!");
        return null;
    }
    return {
        name: match.groups.name,
        color: JSON.parse(match.groups.color),
        pattern: new RegExp(JSON.parse(match.groups.pattern))
    };
}

function loadHighlightingFile(highlighting) {
    return [highlighting[0], highlighting[1].split("\n")
        .filter(isNotEmptyOrSpaces)
        .map(l => parseLine(highlighting[0], l))
        .filter(a => a != null)];
}

function getLanguage(snippet) {
    return snippet.getAttribute("lang").replace("custom:", "");
}

function loadAllLanguages(snippets) {
    return Promise.all(snippets
        .filter(s => !s.done)
        .map(getLanguage)
        .filter((val, idx, arr) => arr.indexOf(val) === idx)
        .map(httpGet))
        .then(res => res.map(loadHighlightingFile));
}

function getHighlighting(languages, language) {
    for (let lang of languages) {
        if (lang[0] === language) {
            return lang[1];
        }
    }
}

function getBestPattern(highlighting, text) {
    let currentBest = null;
    for (let pattern of highlighting) {
        const match = pattern.pattern.exec(text);
        if (match != null) {
            match.color = pattern.color;
            if (currentBest == null || (currentBest.index > match.index)) {
                currentBest = match;
            }
        }
    }
    return currentBest;
}

function convertText(highlighting, text) {
    let converted = "";
    while (text.length > 0) {
        const best = getBestPattern(highlighting, text);
        if (best) {
            converted += text.substring(0, best.index);
            converted += "<span style='color: " + best.color + "'>" + best[0] + "</span>";
            text = text.substring(best.index + best[0].length);
        } else {
            converted += text;
            text = "";
        }
    }
    return converted;
}

function processAll() {
    const snippets = getCustomSnippets();
    loadAllLanguages(snippets)
        .then(languages => {
            for (let snippet of snippets) {
                if (!snippet.done) {
                    const high = getHighlighting(languages, getLanguage(snippet));
                    snippet.innerHTML = convertText(high, snippet.innerText);
                    snippet.done = true
                }
            }
        });
}

const body = document.getElementsByTagName("body")[0];
const config = {attributes: true, childList: true, subtree: true};
let previousUrl = null;
const observer = new MutationObserver((l, o) => {
    const currentUrl = document.URL;
    if (currentUrl !== previousUrl) {
        if (currentUrl.endsWith(".md") || currentUrl.replace(/.+\//, "").indexOf('.') === -1) {
            processAll();
        }
    }
});
observer.observe(body, config);
