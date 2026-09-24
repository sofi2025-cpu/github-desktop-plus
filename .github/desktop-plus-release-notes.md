Desktop Plus v3.6.6

Upstream: [GitHub Desktop 3.6.6 release notes](https://github.com/desktop/desktop/releases/tag/release-3.6.6)

## Changes and improvements:

- [#183] You can now search by commit author in the history view. Thank you @anaseeem for this great contribution!  
  Simply type `author:` to bring up the author search filter, then either select an author from the list or continue typing to filter the list. Click an author or press Enter to select it.  
  Use `author:` multiple times to find commits created by any one of them (`OR` search).

- [#260] The "recent repositories" list length is now configurable. Thanks @TurtIeSocks!  
  This replaces the old "Show recent repositories" checkbox in the appearance settings. If you want to hide the recent repositories list, you can set the length to 0.

- [#269] When "Show Conventional Commits prefixes as badges" is enabled, the badges now respect the capitalization used in the commit message.


## Fixes:

- [#233] The app now opens the correct URL when selecting "Repository > Create issue on ..." on a GitLab, Codeberg/Forgejo, or Gitea repository.

- [#258] **Linux**: Updated Electron to fix a crash on startup when running with `--ozone-platform=x11` on desktops that load `appmenu-gtk-module` (e.g. KDE Plasma with the global menu).

- **macOS**: Migrated the Homebrew cask from the deprecated `postflight` script to the new declarative `postflight_steps` format. Thanks @EstebanForge!

- **Arch Linux**: Added missing `libnotify` dependency to the AUR package, which is required for notifications to work.
