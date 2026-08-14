# 📚 Minecraft Addon Wiki - Templates & Expansion Guide

This folder contains the **Official JSON Templates** for expansion and static creation of Wikipedia pages for your Minecraft Addon.

## 🚀 How to Expand this Wiki on GitHub Pages

To publish new pages on GitHub Pages or keep your repository synchronized:

1. **Choose a Template:**
   - `item-template.json` -> For Weapons, Tools, Armor, or Items
   - `mob-template.json` -> For Hostile, Passive Mobs, and Bosses
   - `block-template.json` -> For Blocks, Ores, and Workbenches
   - `recipe-template.json` -> For Recipes and Rituals
   - `biome-template.json` -> For Biomes and Dimensions
   - `guide-template.json` -> For Guides, Tutorials, and Patch Notes

2. **Create or Edit in the Application:**
   - Open the wiki on the web and click the **"➕ Create with Template"** button in the menu.
   - Select the desired page type, fill in the data, and preview the result in real-time with 3x3 interactive crafting recipes.
   - Click **"Download JSON / Export Page"** or add directly to the bundle.

3. **Deploy on GitHub Pages:**
   - Run `npm run build`
   - The project generates the static `/dist` folder
   - Publish the files to your `gh-pages` branch or configure GitHub Actions (included in the export modal).

---
*Generated for the Static Wikipedia of the Minecraft Addon.*
