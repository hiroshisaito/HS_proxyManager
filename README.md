# HS_ProxyManager for Adobe After Effects

Current version: **1.1**

## Overview

`HS_ProxyManager.jsx` is an ExtendScript for Adobe After Effects designed to streamline the creation, management, and application of proxy files within your projects.
Through a ScriptUI panel, it allows you to easily generate proxies at multiple resolutions for selected footage or compositions and switch between them.

## Features

* **ScriptUI Panel:** Provides an easy-to-use interface.
* **Proxy Generation:**
    * Creates proxies from selected items (footage, compositions).
    * Supports batch generation at multiple resolutions (100%, 50%, 33%, 25%).
    * Utilizes the After Effects Render Queue for rendering.
    * Supports background rendering execution via the `aerender` command line, allowing you to continue working (generates batch files for macOS/Windows).
* **Proxy Management:**
    * Easily switch between generated proxies (at different resolutions) and the original file ("Main").
    * Automatically generates and manages a dedicated proxy folder structure for each project.
    * The proxy folder location can be set to the same directory as the project file or a custom location.
    * Allows setting and changing the alpha mode interpretation for proxies (Auto/Straight/Premultiplied/Ignore).
* **Configuration:**
    * Set and save the default path for the proxy folder.
    * Configure render settings such as Output Module and audio output.
    * Settings are saved to a preference file.

## Requirements

* Adobe After Effects CS3 (Version 8) or later
* Included helper scripts (located in the `(includes)` folder: `HS_util.jsx`, `HS_render.jsx`, `HS_renderCore.jsx`)
* Render settings templates imported from `HS_proxyManager.ars`

## Render Settings Template Setup

Before using **Make Proxy** for the first time, import the bundled render settings templates into After Effects.

1. Open After Effects.
2. Choose **Edit > Templates > Render Settings...**.
3. Click **Import...**.
4. Select `HS_proxyManager.ars` from this repository.
5. Confirm that these templates are available:
    * `[HS_PROXY_1/1]`
    * `[HS_PROXY_1/2]`
    * `[HS_PROXY_1/3]`
    * `[HS_PROXY_1/4]`

`HS_proxyManager.jsx` uses these render settings templates when it builds the proxy render queue. If they are not installed, the script will stop and ask you to import `HS_proxyManager.ars`.

## License

[MIT License](LICENSE)

