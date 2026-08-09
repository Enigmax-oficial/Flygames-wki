# Aetheria Addon Wiki & Ad Management

Welcome to the **Aetheria Addon Wiki**, a beautiful, fully functional wiki application built for the popular Minecraft Bedrock Edition Expansion. The wiki features rich 3D models, craft registries, categorizations, real-time-simulated search, full account authentication via Firebase, and modular advertisement placements.

---

## 📢 Advertisement Placements & Verification

To monetize traffic efficiently while keeping a highly professional game wiki experience, Google AdSense spots have been deployed across the layout.

### 1. AdSense Verification Files
The root domain serves standard authorization files to authenticate digital ad inventory sales:
- **`/ads.txt`**: Served directly in the web root containing authorized seller IDs:
  ```text
  google.com, pub-9144292410564162, DIRECT, f08c47fec0942fa0
  ```
- **`/ads.tx`**: An alias verification fallback file often requested by legacy crawlers or custom programmatic wrappers.

### 2. High-Performance Display Placements
We integrated three distinct responsive ad formats to maximize viewability without disrupting content readability:

*   **PC / Desktop Sidebar Slot (`type="sidebar"`)**
    *   **Location**: Fixed at the bottom of the sticky left-hand sidebar layout and inside standard article side-columns next to the item info sheets.
    *   **Behavior**: Adapts automatically to vertical viewport sizes. Supports both live programmatic scripts (`ca-pub-9144292410564162`) and immersive, wiki-themed fallback campaigns (such as server hosting partners or community portals).
*   **Inline Contextual Slot (`type="inline"`)**
    *   **Location**: Placed midway through boss guide pages, lore files, and at the footer of standard item articles.
    *   **Behavior**: Renders wide horizontal text/image assets or responsive native standard banner slots.
*   **Leaderboard Portal Footer Slot (`type="footer"`)**
    *   **Location**: Spanned horizontally across the Portal Home Page and Category Overview Hubs.
    *   **Behavior**: Generates a wide-span responsive banner, ideal for high-impact display branding.

---

## 🛠️ Tech Stack & Key Features

- **Frontend**: React 18, TypeScript, and Vite.
- **Styling**: Tailwind CSS with fully responsive adaptive mobile & desktop layouts.
- **Database & Authentication**: Firebase Authentication for full-stack secure account registrations, logins, and customized profiles.
- **Interactions**:
  - Interactive 3D Minecraft voxel model renderer.
  - Multi-variant crafting grid recipes.
  - Dynamic content creation panel for custom page additions.
  - Real-time instant index lookup system.

---

## 🚀 Running the Application Local

1.  **Install Base Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build Production Bundle**:
    ```bash
    npm run build
    ```
