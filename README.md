# htop for Omarchy

Live CPU and memory in the bar. Click it for the panel that answers what is
eating this machine right now — and a button that drops the real htop down
from under the widget.

The catalogue has four native process monitors and two plugins that launch
btop. This is the one that fronts htop, and it does not reimplement it.

## Install

```bash
omarchy plugin add https://github.com/fernandomenolli/omarchy-htop.git --enable
```

Needs `htop`, `jq`, Hyprland 0.56+ and Omarchy 4.

## What the clicks do

| Click | Action |
|-------|--------|
| left | open the panel |
| right | cycle what the bar shows: both → CPU → memory |

Inside the panel: **Open htop** drops the full htop from under the widget,
into Hyprland's `special:htop` workspace. It is spawned once and hidden
after that, so the second open is instant and htop keeps its sort column,
filter and tree mode. While it is showing, the button reads **Close htop**.

## Bind it to a key

The plugin never writes to your Hyprland config. If you want htop on a key,
add it yourself:

```lua
-- ~/.config/hypr/bindings/htop.lua
o.bind("SUPER + ESCAPE", "System monitor", "omarchy-shell io.github.fernandomenolli.htop toggle")
```

## Settings

Under Setup > Plugins.

| Setting | Default | What it does |
|---------|---------|--------------|
| Refresh interval | 2000 ms | how often the meters resample |
| Show in the bar | both | both, CPU only, or memory only |
| Urgent above | 85% | where a meter turns the theme's urgent colour |
| Rows per process list | 4 | length of the two lists in the panel |
| Dropdown width | 60% | htop window width, as a share of the screen |
| Dropdown height | 55% | htop window height |

## What it costs

Closed, the widget reads `/proc/stat` and `/proc/meminfo` — two files, no
subprocess — and burned no measurable CPU over 40 seconds on the machine it
was built on. Load, uptime and the process lists are only sampled while the
panel is open, and the process scan is a single `awk` pass over
`/proc/<pid>/stat` (8 ms for 529 processes) rather than a `ps` whose `%CPU`
is an average over each process's whole life.

The reason it is this cheap is that an Omarchy plugin is QML loaded into the
shell process that is already running. Nothing here is a daemon.

## Your htoprc is yours

On first open the plugin seeds a curated `htoprc` — two 50/50 columns,
kernel threads hidden, sorted by CPU — to:

```
~/.local/state/omarchy/plugins/io.github.fernandomenolli.htop/htoprc
```

htop rewrites that file when it exits, and the plugin never overwrites it
once it exists. Your `~/.config/htop/htoprc` is left alone either way.

Colours come from the terminal, which Omarchy themes, so htop follows a theme
switch on its own.

## Tests

```bash
node tests/run.js
```

No dependencies and no framework. They cover `model/` — the `/proc` parsing
and the formatting, which is the half that runs without a QML engine.

## Licence

MIT.
