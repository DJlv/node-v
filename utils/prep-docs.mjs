import { prepareAutoHomes } from "./auto-gen-index.mjs";

const { count } = prepareAutoHomes();
console.log(`[prep-docs] generated ${count} home.md pages`);
