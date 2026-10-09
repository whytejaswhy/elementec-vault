# Elementec Vault

A lightweight product and prompt library for **vault.elementec.co**, hosted on GitHub Pages.

## UI direction

Show category labels in rounded, bordered badges. Keep product and prompt cards compact: omit descriptions from cards. Retain descriptions in the content file for search and in the opened prompt dialog.

Keep products and prompts in two columns on phones, including narrow 320px screens. Follow the current live [Elementec Journal](https://elementec.co/journal), not the retired ChatGPT Site or its local checkout. The theme uses Satoshi, the blue-to-lime brand mark, rounded joined panels, lime action buttons, and system light/dark colours. Light mode uses `#f7f7f5` paper and white surfaces; dark mode uses `#191a1c` paper and `#232427` surfaces. Cards expand to three columns on wider desktop screens. Keep prompt reading and copy actions in the full-width dialog. The current font and brand mark are bundled so the Vault uses the same assets as the Journal. Recheck the live Journal before future theme changes.

## Add products and prompts

1. Open `https://vault.elementec.co/edit.html`.
2. Add a product link or paste a full prompt. Save the entry to your working file.
3. Download changes. This downloads `content.json`.
4. Click **Upload to GitHub**, upload that file into the `site` folder, and commit the change.
5. The **Publish Elementec Vault** workflow validates the content and updates the site.

The editor runs in your browser. It cannot write to GitHub or publish changes by itself. Only people with repository write access can publish. Download changes before closing the editor. Hidden entries are still in the public JSON file and public repository; do not put private drafts or secrets here.

Collection titles are chosen by Tejas or an assigned team member to describe the reel. In the editor, choose an existing **Collection**, or **Create a new collection…** and enter its exact **Collection title**. Assign related entries to that collection. Editing an existing collection title renames the heading for all its members while keeping the shared URL stable. Two separate reels can have separate collections even if their titles match. Product categories, such as Phones, remain separate from collection titles. **Open collection** gives you a shareable page containing only that group; an optional **Reel link** adds **Watch reel** for the group. Reel links and groups survive editor imports, edits and downloads.

New entries are placed first. Editing an entry preserves its stable ID, so prompt links keep working after name changes. Entries may be hidden from the public page, removed, or given an affiliate label. Prompts have **Copy prompt** and **Copy link** actions. Search covers names, descriptions, categories, and full prompt text.

## Initial publishing setup

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. Under **Custom domain**, save `vault.elementec.co` before changing DNS.

In GoDaddy's DNS manager for `elementec.co`, add:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | vault | whytejaswhy.github.io |

Use the default TTL. Keep the main site's existing records. After GitHub reports the domain is configured and its certificate is available, turn on **Enforce HTTPS**.

GitHub's custom-domain verification is recommended. Add `elementec.co` under account **Settings → Pages → Add a domain**, then add the exact TXT record GitHub provides in GoDaddy. Do not invent a verification token.

## Content file

`site/content.json` is the source of truth. It contains Tejas's supplied Amazon links for the MacBook Neo and Samsung QN2EH TV, preserving the original shortened URLs and affiliate attribution. The four phones supplied on 9 October 2026 are grouped under Tejas’s title “Phones under 40,000”. No public prompts have been supplied yet. The `preview` folder contains clearly marked samples and is excluded from the Pages artifact. The repository is public: preview samples are not private.

Optional `collections` contain a stable `id`, a `title`, and an optional reel `url`. An entry can refer to a collection with `collectionId`.

Each entry has an `id`, `type` (`product` or `prompt`), `title`, `category`, `description`, `published`, and optional `updated` date (`YYYY-MM-DD`). Product entries have a full `url`, optional `retailer`, optional `image` URL, and optional `affiliate` flag. Prompt entries have the full `prompt` text. Using the editor fills these fields for you.

To edit directly, open `site/content.json` in GitHub and use the pencil button. A failing validation workflow leaves the last successful site version in place; fix the content file and commit again.

## Local preview

Serve `site` with any static HTTP server. For a populated preview, copy `site` to a temporary directory and replace that copy's `content.json` with `preview/content.json`; never substitute those samples into the live content file.

## References

- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
