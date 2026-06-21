# StayOn

Earn survey points during Cursor Agent wait time — real hook-based busy detection, gamified side panel, CPX paid surveys.

**Try it:** [stay-on-nu.vercel.app/try](https://stay-on-nu.vercel.app/try)

## Install (beta testers)

1. **Cursor** → Extensions → search **StayOn** (Open VSX) **or** install `stayon-0.1.5.vsix` from [Releases](https://github.com/ahzia/StayOn/releases).
2. Reload Cursor → open your project folder.
3. **StayOn: Set Up** → submit an Agent prompt.

Guide: [docs/21_beta_tester_guide.md](docs/21_beta_tester_guide.md)

## Developers

```bash
cd extension && npm install && npm run compile
# F5 from repo root — see docs/14_extension_dev_workflow.md
```

Publish Open VSX: [docs/23_open_vsx_publish.md](docs/23_open_vsx_publish.md)

## Architecture

```
Cursor Agent → .cursor/hooks/stayon-event.js → bridge → Side panel
                                    ↓
                         StayOn web (CPX postback → Supabase)
```

See [docs/03_implementation_plan.md](docs/03_implementation_plan.md).
