# PokeRelaxer

This small userscript is aimed at making the experience of an idle game, [PokeClicker](https://www.pokeclicker.com/), a bit more relaxing.

## Installation

Before running, you must add an extension for your browser that supports userscripts. I recommend [ViolentMonkey](https://violentmonkey.github.io/).

To install PokeRelaxer, open
[https://raw.githubusercontent.com/moriakaice/PokeRelaxer/master/pokerelaxer.user.js](https://raw.githubusercontent.com/moriakaice/PokeRelaxer/master/pokerelaxer.user.js)
in your browser.

## Configuration

After installing and reloading the game, you should see a new menu next to the existing Start Menu. That's where you can control all the options:

- `Autobreeding` controls whether the script should automatically add most efficient Pokemon to the breeding.
- `Breeding priority` setting control the selection of Pokemon to breeding. It can prioritise player's current region, none or a selected one. Please note that
  it will only add a modifier to the breeding efficiency when sorting, so Pokemon outside of the selected region might still be picked.
- `Auto use Proteins` will automatically use Proteins on Pokemon before breeding them.
- `Auto add Proteins` will grant player Proteins if they need them.
- `Extend dungeon time` will add extra time to dungeons based on the number of the region (warning: Kanto doesn't grant extra time).
- `Extend gym time` will add extra time to gyms based on the number of the region (warning: Kanto doesn't grant extra time).
- `Auto Battle Frontier` will, if turned on, automate Battle Frontier - just enter the location manually and the script will take care of the rest,
  auto-quitting when killing enemy Pokemon takes too long to speed up breeding. To stop, either turn the option off or reload the game.

## Other functions

On the Pokedex page, you'll find two new options: `Add All Visible` "catches" all Pokemon visible in Pokedex with current filter, while `Add All Shiny` also
make them shiny.

Eggs that are ready will be auto-hatched. This saves a click, but does not impact the gameplay in any other way.
