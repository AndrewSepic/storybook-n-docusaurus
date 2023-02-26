import { resolve } from "path";
import { context, BuildOptions } from "esbuild";
import rimraf from "rimraf";

const srcPath = resolve(__dirname, "src");
const distPath = resolve(__dirname, "dist");

const flagNames = ["watch", "build"] as const;
const flags = flagNames.reduce((acc, name) => {
  acc[name] = !!process.argv.slice(2).find((s) => s.startsWith(`--${name}`));
  return acc;
}, {}) as Record<typeof flagNames[number], boolean>;

const run = async () => {
  rimraf(distPath);

  const baseOptions: BuildOptions = {
    entryPoints: ["index.ts", "preview.tsx", "preset.ts"].map((e) =>
      resolve(srcPath, e)
    ),
    platform: "node",
    outdir: distPath,
    minify: flags.build,
  };

  const esm = await context({
    ...baseOptions,
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
  });

  const cjs = await context({
    ...baseOptions,
    format: "cjs",
    outExtension: {
      ".js": ".cjs",
    },
  });

  if (flags.watch) {
    await Promise.all([esm.watch(), cjs.watch()]);
  } else {
    await Promise.all([esm.rebuild(), cjs.rebuild()]);

    await esm.dispose();
    await cjs.dispose();
  }
};

run().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.stack);
  }

  process.exit(1);
});
