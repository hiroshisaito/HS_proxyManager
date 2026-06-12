# Changes

## 1.2.1 - 2026-06-13

### Changed

* Updated the panel layout to separate proxy switching, alpha settings, proxy creation, and proxy folder settings.
* Aligned the panel widths and moved **Make Proxy** between **Proxy Alpha Mode** and **Proxy Folder**.
* Store preferences in `(hs_pref)` directly under the user profile/home folder.
* Resolve the preference folder from `USERPROFILE` on Windows and `HOME` on macOS.
* Migrate existing preference files from previous `(hs_pref)` locations when the new files do not exist.

## 1.2 - 2026-06-10

### Added

* Added direct Proxy Folder path input.
* Added AEP-relative Proxy Folder paths using `/` on Windows and macOS.
* Keep project `.proxy` settings relative when the Proxy Folder input is relative.

### Fixed

* Normalize repeated and trailing path separators in Proxy Folder input.
* Let edited Proxy Folder input override an existing project `.proxy` until it is applied.
* Reconnect existing proxies after applying a new project proxy folder.

## 1.1 - 2026-06-09

### Changed

* Removed **Enable Multiprocessing** from the proxy rendering setup dialog.
* Ignore the legacy `mp` preference and never pass `-mp` to `aerender`.
* Added an **Apply to All Items** option for proxy switching.
* Updated `README.md` to match the current render settings.
