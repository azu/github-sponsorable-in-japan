import { Octokit } from "@octokit/core";
import { paginateGraphql } from "@octokit/plugin-paginate-graphql";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const MyOctokit = Octokit.plugin(paginateGraphql);
const octokit = new MyOctokit({ auth: process.env.GITHUB_TOKEN });

export type UserNode = {
    login: string;
    name: string;
    url: string;
    location: string;
    avatarUrl: string;
    bio: string;
    pinnedItems: PinnedItems;
}

export type PinnedItems = {
    edges: Edge[];
}

export type Edge = {
    node: Node;
}

export type Node = {
    name: string;
    description: string;
    url: string;
}

const query = `query paginate($cursor: String) {
    search(type: USER query: "location:Japan is:sponsorable", first: 100, after: $cursor) {
        userCount
        pageInfo {
            hasNextPage
            endCursor
        }
        nodes {
          ... on User{
            login,
            name
            url
            location
            avatarUrl
            bio
            pinnedItems(first:1) {
              edges {
                node {
                  ... on Repository{
                    name
                    description
                    url
                  }
                }
              }
            }
          }
       }
    }
}`;

const results: UserNode[] = [];
for await (const result of octokit.graphql.paginate.iterator(query)) {
    // TODO: support "Optional: Opt-in to get featured on github.com/sponsors"
    // TODO: support opt-out users
    results.push(...result.search.nodes.filter((node: UserNode) => node.login !== undefined));
    console.log(`results: ${results.length}/${result.search.userCount}`);
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const RESULT_FILE_PATH = path.join(DATA_DIR, "results.json");
await fs.writeFile(RESULT_FILE_PATH, JSON.stringify(results, null, 2));
