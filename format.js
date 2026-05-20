const { ESLint } = require("eslint");
async function main() {
  const eslint = new ESLint({ fix: true });
  const results = await eslint.lintFiles(["src/app/(store_manager)/**/*.tsx", "src/components/store_manager/**/*.tsx"]);
  await ESLint.outputFixes(results);
  console.log("Done linting.");
}
main().catch(console.error);
