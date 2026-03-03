## [0.1.1](https://github.com/resumx/resumx/compare/v0.1.0...v0.1.1) (2026-03-03)

### Bug Fixes

- **templates:** remove theme from starter template ([b042941](https://github.com/resumx/resumx/commit/b04294172f08f53d175960f33daea540ef4f5400))

# [0.1.0](https://github.com/resumx/resumx/compare/c2647ad9f53e7457413f865acc3d6df7d3c75f67...v0.1.0) (2026-03-03)

- chore!: scope package name to @resumx/resumx ([7730cc7](https://github.com/resumx/resumx/commit/7730cc7eabdece49fd7c51b9e96ed0cb0c18b756))
- refactor(view)!: always suffix output filename with view name ([8050111](https://github.com/resumx/resumx/commit/80501111036f04eb5f9360e318a72530de420d99))
- feat(bullet-order)!: implement order-bullets processor and rename `source` to `none` ([04e3307](https://github.com/resumx/resumx/commit/04e330772c169e8779bb128784ad3c9723c91b68))
- feat(layout)!: drop two-column layout feature ([4af54fd](https://github.com/resumx/resumx/commit/4af54fdc8c74ecbd578d1a1933fb68a19544a193))
- refactor!: rename {target} to {view}, filter-by-target to filter-by-tag ([c1dbe7d](https://github.com/resumx/resumx/commit/c1dbe7ddabd8bb1d72805bdedefb30badb34c833))
- refactor!: rename targets to tags across CLI, frontmatter, and API ([8549283](https://github.com/resumx/resumx/commit/8549283cbdd778f3ed231a3c57a439c2263985ba))
- refactor(style)!: consolidate variables and add gap scaling ([f0bba64](https://github.com/resumx/resumx/commit/f0bba6447af4477ed6c6f57d348a3301b8a2e2c9))
- refactor!: rename role to target across CLI, frontmatter, and docs ([f61417b](https://github.com/resumx/resumx/commit/f61417bae77eeb83c8c61950e6af9e3de2a10f90))
- refactor!: remove theme system, replace with opinionated default + css cascading ([dd7db20](https://github.com/resumx/resumx/commit/dd7db2052cdddeadb23da74351d608a71620cdc4))
- chore!: remove postinstall Chromium install ([aa6bf60](https://github.com/resumx/resumx/commit/aa6bf60c2e2f2dc8cd810b5e0a28928927fa3358))
- feat(fenced-div)!: add attribute fallthrough for unnamed fenced divs ([d678456](https://github.com/resumx/resumx/commit/d678456862050eecd2a181c07d2e9063374feb69))
- feat(icon)!: switch to single-colon syntax and add emoji support ([280f7ee](https://github.com/resumx/resumx/commit/280f7ee66ddde3ef47a2f0836bad7d4151b14b23))
- refactor!: integrate validation into render command ([f5b1f18](https://github.com/resumx/resumx/commit/f5b1f18c301f300c2d240d8c489b855414b64495))
- feat!: remove theme, eject commands and global config ([e0e5429](https://github.com/resumx/resumx/commit/e0e542947a4ed73c0407c41db4cf01fc557d4e99))
- feat!: remove interpolation feature ([96befbf](https://github.com/resumx/resumx/commit/96befbf11c9d79dafb0b4561ebd76f476b4b35af))
- feat(renderer)!: add Tailwind CSS v4 compilation and Playwright PDF rendering ([58fa940](https://github.com/resumx/resumx/commit/58fa940ed7d8c151414d35442e2a7e69d50f0898))

### Bug Fixes

- add more content to page-fit tightness tests ([15ed415](https://github.com/resumx/resumx/commit/15ed415fcfc5aef4e6ad2865d6a1ebffd00a50a8))
- adjust padding for highlighted words in docs ([1557d9a](https://github.com/resumx/resumx/commit/1557d9a1c6def2e64cb60b56919f622257333166))
- apply {attrs} on continuation lines to <li> instead of <ul> ([e3e133f](https://github.com/resumx/resumx/commit/e3e133fdecf2130cfa01cb73bcb7e4fb8975adb3))
- **check:** use which package for cross-platform command detection ([dd5b9e7](https://github.com/resumx/resumx/commit/dd5b9e7c0d38f6275efc82a93d4073c1051cb74f))
- correct test expectations for role-based output filenames ([bd29029](https://github.com/resumx/resumx/commit/bd290296a16ff4f2274d0ac9f6928aab2029b7fc))
- **docs:** prevent title and sidebar overlap when scrolling ([0c4c940](https://github.com/resumx/resumx/commit/0c4c940cdee48c7ffbb8de5b942a7900bf4f897b))
- **docs:** update README and skill documentation to reflect docx flag name changes ([70253bc](https://github.com/resumx/resumx/commit/70253bc68d334e5c71810cb7e48560b363db5131))
- enhance link normalization in SidebarGroupLabel component ([681b686](https://github.com/resumx/resumx/commit/681b686b94fc0a8a88f09f67c9211df5cf9eaea3))
- **frontmatter:** catch invalid parse errors and bypass gray-matter cache ([0d4e69d](https://github.com/resumx/resumx/commit/0d4e69d3dd51919f25fc0f138c235eac9e81ae04))
- **icons:** correct icon filenames for arch and td-securities ([4822509](https://github.com/resumx/resumx/commit/482250946fff0a3f70c63a6bf2d9a817038ca873))
- improve variable validation logic in frontmatter extraction ([70a3a36](https://github.com/resumx/resumx/commit/70a3a3630cc76598895c4626a03d98209278c9d6))
- **page-fit:** improve fit stability and boundary behavior ([42c85a4](https://github.com/resumx/resumx/commit/42c85a45079a503009fe10235860204e92abdd46))
- **page-fit:** prevent over-shrinking when fitting to 2 or 3 pages ([6422552](https://github.com/resumx/resumx/commit/6422552cb1097f97f5afde24b248ea97abfcd70a))
- **page-fit:** reduce minimum page-margin-y from 0.3in to 0.25in ([9f8fa8e](https://github.com/resumx/resumx/commit/9f8fa8ee0386477d868767f96443852b6088e800))
- preserve block structure when wrapping multiple contact elements ([0fad3c2](https://github.com/resumx/resumx/commit/0fad3c2f7333705b45c812b43e0dba7893b9f70c))
- refactor bracketed spans plugin to support nested spans ([7fcfb28](https://github.com/resumx/resumx/commit/7fcfb28029973f7b521e10acb8f8a6c8c56100fd))
- remove default PDF format setting in render function ([b1a722c](https://github.com/resumx/resumx/commit/b1a722c15c1e6f1da12b1acf61d4f97130cfa790))
- remove max-width constraint and unused Pandoc title block styles ([02ec773](https://github.com/resumx/resumx/commit/02ec773da5b0115794285b188a63d3db78f7860f))
- rename minimal style to modern and fix browser pool bugs ([0405358](https://github.com/resumx/resumx/commit/0405358a8d512a1d403f7e362d24d30b84b6e929))
- **renderer:** replace Pandoc with markdown-it and WeasyPrint ([a29b515](https://github.com/resumx/resumx/commit/a29b515bf2a07c6382ebefd5165f5071bc8d3f6c)), closes [hi#fidelity](https://github.com/hi/issues/fidelity)
- replace iconify web component with SVG renderer to prevent overflow clipping ([4a508be](https://github.com/resumx/resumx/commit/4a508be9aa9ecf77a7a4e29d81dd26c893e418b2))
- **security:** replace execSync shell interpolation with execFileSync array args ([f16fac0](https://github.com/resumx/resumx/commit/f16fac0c1568699aa97db69689a172fc05594f26))
- **security:** replace execSync shell interpolation with execFileSync array args ([e6507ba](https://github.com/resumx/resumx/commit/e6507ba3fa7f60ed79bc9e353deb3930b687cce8))
- **themes:** adjust section title size ([6aa66a7](https://github.com/resumx/resumx/commit/6aa66a7e53d47eba1554535d9d21f509b6bf0b75))
- **themes:** wrap CSS in cascade layers for Tailwind v4 compatibility ([325cbe2](https://github.com/resumx/resumx/commit/325cbe27c6b72f66b1c023012ad88b820abeb063))

### Code Refactoring

- **core:** replace PipelineContext with functional pipeline and split render into plan/generate/write ([101e180](https://github.com/resumx/resumx/commit/101e180b9af6b4381d9acb2bb60832b33371c133))

### Features

- add automatic time parsing with semantic HTML5 time tags ([6646abb](https://github.com/resumx/resumx/commit/6646abbe94993e202225769cdbf55c4a2c4851c5))
- add cities.json dependency and enhance test commands ([77dc749](https://github.com/resumx/resumx/commit/77dc749c9de43e68e1c362fd918ae31bbbde8f4d))
- add comprehensive devicon mappings for technology icons ([2c4b1a5](https://github.com/resumx/resumx/commit/2c4b1a58025548e23b5740c4891cd1ba1d3ae47a))
- add inline icon support with Iconify integration ([5976e09](https://github.com/resumx/resumx/commit/5976e09f2105d52d3d66d8b2d293efc3a9f4a5f9))
- add intelligent page-fit system with predictive layout engine ([1893464](https://github.com/resumx/resumx/commit/18934646f03ca9502aed666530b9b5ff0c2d84f2))
- add Markdown to JSON Resume conversion skill ([61867e7](https://github.com/resumx/resumx/commit/61867e7ca2f25233d5d0adb240ffb94a231878ae))
- add performance measurement to render task ([f87d2b6](https://github.com/resumx/resumx/commit/f87d2b6b7832159fbb4a47b49eede6adec0cf297))
- add PNG output format support to rendering system ([983b656](https://github.com/resumx/resumx/commit/983b6569d76f2c1fe79d744e5164dae8d46a20bf))
- add role-based content filtering with fenced div support ([5ee6580](https://github.com/resumx/resumx/commit/5ee6580023bf8b3898b94b29d56d4f79d521abbd))
- add section classification processor for HTML resumes ([3b8dfa0](https://github.com/resumx/resumx/commit/3b8dfa0d84cc534276ae82d0b814c3ee8aec8710))
- add stdin support for piping markdown into resumx ([1ddc246](https://github.com/resumx/resumx/commit/1ddc246c9c1e91a823858a7a5596e070e3b19da7))
- add three new DOM processors and optimize pipeline order ([38362f1](https://github.com/resumx/resumx/commit/38362f1ee2e4cd609047428b5897830e50584507))
- add validate command with plugin-based resume linting ([0d18000](https://github.com/resumx/resumx/commit/0d180000a2c19b609efe29198af1f29b904f40fa))
- add wrapEntries processor for HTML resume entries ([3ad1127](https://github.com/resumx/resumx/commit/3ad1127b23c0524af3d4b7b05e36a7e43043e891))
- **branding:** replace logo assets with new wordmark SVGs ([153508d](https://github.com/resumx/resumx/commit/153508d037b0bbab5285a97da717625df2aef25d))
- **branding:** update logo assets and replace logo references in configuration ([3e7c948](https://github.com/resumx/resumx/commit/3e7c9488bb1486587ae7911bfb68804b363525ed))
- **cli:** add -l and -p shorthands for --lang and --pages ([57ad348](https://github.com/resumx/resumx/commit/57ad348d53fa9d7ca1a9de03bba55a617ae046d3))
- **cli:** add -r short flag for --role option ([be39390](https://github.com/resumx/resumx/commit/be39390c0914c63c5f4fb9c3b1dd2b919b0784a2))
- **column-sep:** add || syntax for inline column layout ([ad31627](https://github.com/resumx/resumx/commit/ad3162768453ce1ebfec123316207e153c35fe29))
- **css-resolver:** add CSS import resolver with recursive resolution ([2a99807](https://github.com/resumx/resumx/commit/2a99807571da205e503b8b365daa9f53a3dca01d))
- **css:** add CSS import resolution and modularize styles ([837382a](https://github.com/resumx/resumx/commit/837382abe4b5a5699a4d8b5b95920a3800c4353b))
- **demo:** add interactive resume demo component and update documentation ([4f55ba0](https://github.com/resumx/resumx/commit/4f55ba0839e1b52203ea2e542cd3b21b94286bb0))
- **demo:** add responsive styling for resume demo iframe ([d8645fc](https://github.com/resumx/resumx/commit/d8645fcef9c51c4381551d33f0d7b3a155873f96))
- **docs:** add resume playbook section with writing best practices ([0378eeb](https://github.com/resumx/resumx/commit/0378eeb61053a8bd8becf28aa3d05b39d3b7ce60))
- **docs:** underline plain-text links in syntax highlighting ([17fb82a](https://github.com/resumx/resumx/commit/17fb82aedd9b61d467c512d6772c922e4c214876))
- enhance base CSS for PDF generation and improve typography ([8b0f75f](https://github.com/resumx/resumx/commit/8b0f75f72c862846d2e3eb86128dc7da3d374fae))
- enhance CLI options for multi-style and role support ([bb3e75b](https://github.com/resumx/resumx/commit/bb3e75bee8ea4d2bd937557b8c88de0bdb489201))
- enhance contact information detection in resume validation ([95c2309](https://github.com/resumx/resumx/commit/95c23097992f09e0fb26e98fc1c61c44981ce830))
- enhance resumx syntax highlighting for fenced divs with depth-based opacity ([9126bec](https://github.com/resumx/resumx/commit/9126bec0b6b03370ce5039f82b844d01b17839e5))
- enhance resumx syntax highlighting with new formatting rules ([311ffd9](https://github.com/resumx/resumx/commit/311ffd9d20ea0997049b6cd26512ebfac4c727c9))
- expand icon system with logos, Wikimedia Commons, and GitHub resolvers ([d6b2894](https://github.com/resumx/resumx/commit/d6b2894e4c4d4a69ec5ff4087a776975b1da8677))
- **expressions:** add JavaScript expression evaluation in markdown ([3be2377](https://github.com/resumx/resumx/commit/3be2377513a88efb5478cc02d50ccf04dfc36410))
- **expressions:** enhance expression parsing for nested object literals ([25bac63](https://github.com/resumx/resumx/commit/25bac635c8367e50459723f684a8d4d77261a6c2))
- **icons:** add Facebook and PostgreSQL SVG icons ([32f3f0f](https://github.com/resumx/resumx/commit/32f3f0fcd72b5c27e2194a3d030691613871c38e))
- **icons:** add new SVG icons for various brands ([e3021a3](https://github.com/resumx/resumx/commit/e3021a330905226d1ce50a62e16870f3eac6eaad))
- **icons:** add new SVG icons for various brands and technologies ([3320b9f](https://github.com/resumx/resumx/commit/3320b9f95721485ffaa66be68d1b99fdd5529e66))
- **icons:** add new SVG icons for various brands including 2sigma, Adobe, Airbnb, and more ([9814d74](https://github.com/resumx/resumx/commit/9814d74a316bb36139018c13f5f61696b069f3a8))
- **icons:** add new SVG icons for various brands including Ableton, Airwallex, Algolia, and more ([91df181](https://github.com/resumx/resumx/commit/91df181e50a730bad8ad526c5272c495260d7126))
- **icons:** add new SVG icons for various technologies ([2fc6f2c](https://github.com/resumx/resumx/commit/2fc6f2c36d41b906872d11fa7cbeae91a4d36741))
- **icons:** add svgo for SVG optimization and update icon files ([61f5228](https://github.com/resumx/resumx/commit/61f522880b1dba58155520de6f43bba12901e076))
- **icons:** replace external resolvers with local assets and frontmatter overrides ([56fe741](https://github.com/resumx/resumx/commit/56fe741dcc2bca6563f71015ed562d3ae25867b8))
- **icons:** update ada.svg and add new jest.svg and pwc.svg icons ([ec9f732](https://github.com/resumx/resumx/commit/ec9f732cac5d0010bed29c7fd91a4aa433db4778))
- **icons:** update SVG icons and add new optimization script ([079d89f](https://github.com/resumx/resumx/commit/079d89fe21da76a2a140f56783cf72cdaa9fa96a))
- implement core CLI with commands and styling system ([c2647ad](https://github.com/resumx/resumx/commit/c2647ad9f53e7457413f865acc3d6df7d3c75f67))
- implement link classification and contact block detection ([87a17c1](https://github.com/resumx/resumx/commit/87a17c1e2923f8b7005f201a9ddfe5f2371785e0))
- implement multi-language support with filtering and output generation ([c31a0ac](https://github.com/resumx/resumx/commit/c31a0ac57f1b6085cd2bb5d6e83cb6f24ca9b2dd))
- implement text classification system with preprocessing and similarity matching ([78c7dea](https://github.com/resumx/resumx/commit/78c7dea285610593ae9a01a04af015bc3adecfa5))
- implement two-column layout processing with DOM parsing ([8a1c06a](https://github.com/resumx/resumx/commit/8a1c06a72822583338eb1cf807a5b5b15b570164))
- improve PNG rendering quality with 2x device scale factor ([8f9c9c5](https://github.com/resumx/resumx/commit/8f9c9c58e797d74108114a9cafbf648e65f42aa8)), closes [hi#resolution](https://github.com/hi/issues/resolution)
- integrate js-beautify for improved HTML formatting ([be5a521](https://github.com/resumx/resumx/commit/be5a52128e7cc2dc349ce9fd5e66e265708debb4))
- **markdown:** add bracketed spans plugin for inline styling ([512252c](https://github.com/resumx/resumx/commit/512252c0973a52cfb444773c29c57a0222f01c71))
- **markdown:** add description list support via @mdit/plugin-dl ([a6750d0](https://github.com/resumx/resumx/commit/a6750d0dc7201e988a8619116887782b171e9301))
- **markdown:** add mark plugin support for text highlighting ([f7cd66b](https://github.com/resumx/resumx/commit/f7cd66bc45f8b728f055962a91921c3b7bf84658))
- **markdown:** add subscript and superscript plugin support ([50856fc](https://github.com/resumx/resumx/commit/50856fc47583c1a17f06012ce2d02af3542a2c90))
- refactor eject command to preserve imports and support common/ styles ([b08989a](https://github.com/resumx/resumx/commit/b08989a490d5f6e1ba96dcad4751c75c1de7a56b))
- **render:** return WatchHandle from watch mode for programmatic control ([b350569](https://github.com/resumx/resumx/commit/b350569a6c7e557426a872cd54be23231290af2e))
- replace project config with frontmatter configuration ([4b22448](https://github.com/resumx/resumx/commit/4b22448e141e26f0c8796d873d1ced5481c02ca0))
- **roles:** add frontmatter role composition for union-based variants ([da73aed](https://github.com/resumx/resumx/commit/da73aedeb11af13e0d9b35d1c59fdb7de509ca89))
- **skills:** add interactive resume writing skill ([9e29fd2](https://github.com/resumx/resumx/commit/9e29fd2781a08e3947a7debc368874cb94781a52))
- **strip-comments:** implement stripComments processor to remove HTML comments ([18de452](https://github.com/resumx/resumx/commit/18de45235550727443fb620f66fbc1b6982d274b))
- **style:** add max-N utilities to cap visible children ([8b5690b](https://github.com/resumx/resumx/commit/8b5690b6957c9071e8cf4cb53a5926d225a87884))
- **tags:** add hierarchical tags with lineage inheritance ([6cb2220](https://github.com/resumx/resumx/commit/6cb22203eb3c8af66aba0f930b96786d17dd9959))
- **themes:** enhance typography variables for improved font management ([007e48b](https://github.com/resumx/resumx/commit/007e48b1d4afc9e1ca1f33c80e28eb832b9c00d6))
- unify output config and add template variable support ([98e2291](https://github.com/resumx/resumx/commit/98e22911a7213b9c00477f41885ca1d95e7d427b))
- **validator:** add non-pt-font-size rule for style font-size ([5d34bc0](https://github.com/resumx/resumx/commit/5d34bc0d1a9fd8b7add467f13faa8cee56967227))
- **vars:** add {{ var }} interpolation and update CLI flag and frontmatter ([27f9825](https://github.com/resumx/resumx/commit/27f982543803fca3c85ed080b8ea0ca20b84b0a1))
- **view:** add --for default and make --for \* include base view ([3a9f3c4](https://github.com/resumx/resumx/commit/3a9f3c4a046dbf6c18fc09832ec5dfa27c883655))
- **view:** add custom .view.yaml files and --for glob/file path support ([e3a7f06](https://github.com/resumx/resumx/commit/e3a7f06e5a9fd2d7f49c012e1e3f39a055281728))
- **view:** add expanded tag views with per-tag config and typo validation ([f01e1c4](https://github.com/resumx/resumx/commit/f01e1c4b99546cff19527b932779273eb2105128))
- **watch:** re-render only affected views on file change ([341f5e9](https://github.com/resumx/resumx/commit/341f5e91fccb69b50fe0eccab96775e8e0431fbf))

### Performance Improvements

- parallelize PDF rendering with a browser pool ([2a32b42](https://github.com/resumx/resumx/commit/2a32b42572b6af51b57d307d0042ab8c900d7ace))

### BREAKING CHANGES

- npm package is now published under @resumx/resumx.
  Update install to `npm install -g @resumx/resumx` and any dependency references.
- single-target renders with --for now produce suffixed
  filenames (e.g. resume-frontend.pdf) instead of resume.pdf
- `bullet-order: source` is no longer valid. Replace with `bullet-order: none`.
- **core:** `render()`, `renderMultiple()`, `runPipeline()`, and
  `PipelineContext` are removed. Use `writeOutput()`, `assemblePipeline()`,
  and `planRenders()` instead.
- `---` no longer creates two-column layout. Use
  sections.pin and sections.hide for section arrangement. Style options
  two-col-widths, two-col-gap, two-col-template are removed.
- Output path template variable {target} is now {view}. Update custom output paths and frontmatter accordingly.
- Replace target terminology with tags. CLI flag --target/-t
  is now --for. Frontmatter field targets is now tags. API options target and
  targetMap are now for and tagMap. Function resolveTargetSet is now resolveTagSet.
- Several style variables in frontmatter and CSS have
  been renamed or merged. Existing resumes using the old variable names
  will need to be updated.
- Use --target instead of --role, targets instead of roles in frontmatter, and {target} instead of {role} in output templates.
- `themes:` frontmatter field renamed to `css:`,
  `--theme` CLI flag renamed to `--css`, `{theme}` output template
  variable removed, named themes no longer exist.
- Run `npx playwright install chromium` after installing.
- Unnamed fenced divs no longer wrap content in `<div>`.
  `::: {.class}\nContent\n:::` now forwards `.class` to the child element.
  Use `::: div {.class}` for an explicit div wrapper.
- icon syntax changed from `::name::` to `:name:` and
  Iconify format from `::prefix:name::` to `:prefix/name:`. The CSS
  variable `--icons` is now `--auto-icons`.
- `resumx validate` is removed. Use `resumx --check` for
  validate-only mode, or `resumx --strict` to block render on errors.
- `resumx theme` and `resumx eject` commands are removed. Global default theme and persistent per-theme style overrides are no longer supported. Use frontmatter or CLI flags instead.
- The {{ }} interpolation syntax is no longer supported. Any resume files using {{ expression }} syntax will now render the literal text instead of evaluating the expression.
- markdownToHtml function signature changed to support async Tailwind compilation
