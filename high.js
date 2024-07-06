function isCustomSnippet(snippet) {
    return /^custom-.+$/.test(snippet.getAttribute("lang"));
}

function getCustomSnippets() {
    return Array.from(document.querySelectorAll('pre'))
        .filter(isCustomSnippet);
}

const url = document.URL.replace("github", "raw.githubusercontent") + "/main/highlighting/LANGUAGE.high";

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

function parseLine(line) {
    const regex = /^(?<name>[a-zA-Z]+) +(?<color>"(\\\\.|.)*") (?<pattern>"(\\\\.|.)*")$/;
    const groups = line.match(regex).groups;
    return {
        name: groups.name,
        color: eval(groups.color),
        pattern: new RegExp(eval(groups.pattern))
    };
}

function loadHighlightingFile(highlighting) {
    return [highlighting[0], highlighting[1].split("\n")
        .filter(isNotEmptyOrSpaces)
        .map(parseLine)];
}

function getLanguage(snippet) {
    return snippet.getAttribute("lang").replace("custom-", "");
}

function loadAllLanguages(snippets) {
    return Promise.all(snippets.map(getLanguage)
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
            if (currentBest == null) {
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
                const high = getHighlighting(languages, getLanguage(snippet));
                snippet.innerHTML = convertText(high, snippet.innerText);
            }
        });
}

processAll();