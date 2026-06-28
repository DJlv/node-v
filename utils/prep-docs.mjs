import { prepareAutoHomes } from "./auto-gen-index.mjs";
import { reportDocsAssetIssues } from "./validate-docs-assets.mjs";

const { count } = prepareAutoHomes();
console.log(`[prep-docs] generated ${count} home.md pages`);
reportDocsAssetIssues();
