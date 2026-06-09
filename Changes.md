# Changes

## 1.1 - 2026-06-09

### Changed

* Removed the **Enable Multiprocessing** option from the proxy rendering setup dialog.
* Stopped reading, applying, and saving the legacy `mp` render preference.
* Forced background `aerender` command generation to omit the legacy `-mp` flag, preventing conflicts with modern After Effects Multi-Frame Rendering.
* Updated `README.md` so the render configuration description no longer mentions multiprocessing.
