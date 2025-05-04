# HS_ProxyManager for Adobe After Effects

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
    * Configure render settings such as Output Module, multiprocessing, and audio output.
    * Settings are saved to a preference file.

## Requirements

* Adobe After Effects CS3 (Version 8) or later
* Included helper scripts (located in the `(includes)` folder: `HS_util.jsx`, `HS_render.jsx`, `HS_renderCore.jsx`)

## License

[MIT License](LICENSE)
*(You may need to create a separate LICENSE file containing the actual MIT license text)*

## Author

Hiroshi Saito
