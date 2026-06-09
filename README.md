# HS_ProxyManager for Adobe After Effects

Current version: **1.1**

## Overview

`HS_ProxyManager.jsx` is an After Effects ScriptUI panel for creating and switching proxy files.
It renders selected footage or comps at multiple resolutions and stores them in a project-specific proxy folder.

## Features

* **ScriptUI Panel:** Create and switch proxies from one panel.
* **Proxy Generation:**
    * Render selected footage or comps at 100%, 50%, 33%, and 25%.
    * Use the After Effects Render Queue.
    * Optionally launch background rendering with `aerender`.
* **Proxy Management:**
    * Switch selected items, or all project items, between generated proxies and the original source ("Main").
    * Store proxies in a project-specific folder.
    * Use the project folder or a custom proxy root.
    * Set proxy alpha interpretation (Auto/Straight/Premultiplied/Ignore).
* **Configuration:**
    * Save the default proxy root.
    * Save output module, audio, and queue-only settings.

## Requirements

* Adobe After Effects CS3 (Version 8) or later
* Included helper scripts (located in the `(includes)` folder: `HS_util.jsx`, `HS_render.jsx`, `HS_renderCore.jsx`)
* Render settings templates from `HS_proxyManager.ars`

## Render Settings Template Setup

Import the bundled render settings templates once before using **Make Proxy**.

1. Open After Effects.
2. Choose **Edit > Templates > Render Settings...**.
3. Click **Import...**.
4. Select `HS_proxyManager.ars` from this repository.
5. Confirm these templates are available:
    * `[HS_PROXY_1/1]`
    * `[HS_PROXY_1/2]`
    * `[HS_PROXY_1/3]`
    * `[HS_PROXY_1/4]`

The script needs these templates to build the proxy render queue. If they are missing, it will ask you to import `HS_proxyManager.ars`.

## License

[MIT License](LICENSE)

