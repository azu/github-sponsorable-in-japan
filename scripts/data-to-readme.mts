import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { UserNode } from "./search-github-sponsorable-in-japan.mjs";
import { mdEscape, mdImg, mdLink } from "markdown-function"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datadir = path.join(__dirname, "../data");
const resultJSON: UserNode[] = JSON.parse(await fs.readFile(path.join(datadir, "results.json"), "utf-8"));
const escapeTable = (text: string) => text.replace(/\|/g, "\\|");
const persons = resultJSON.map((person) => {
    const firstPin = person.pinnedItems?.edges?.[0]?.node ?? {};
    const firstItem = firstPin.name && firstPin.url ? mdLink({ text: firstPin.name, url: firstPin.url }) : "";
    const firstItemDescription = firstPin.description ? mdEscape(firstPin.description ?? "") : "";
    return `## ${mdLink({
        text: `${person.name} (@${person.login})`,
        url: person.url,
    })}
    
| <!-- Img --> | <!-- bio --> |
| --- | --- |
| ${mdImg({ url: person.avatarUrl, alt: "" })} | ${mdEscape(escapeTable(person.bio ?? ""))} |
| ${escapeTable(firstItem)} | ${escapeTable(firstItemDescription)} |

    `

}).join("\n\n");

const README_FILE = path.join(__dirname, "../README.md");
await fs.writeFile(README_FILE, persons);
