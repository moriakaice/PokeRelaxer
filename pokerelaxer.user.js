// ==UserScript==
// @name        PokeRelaxer
// @namespace   Play PokeClicker at a more relaxed pace
// @match       https://www.pokeclicker.com/
// @match       https://pokeclicker.com/
// @grant       GM_setValue
// @grant       GM_getValue
// @version     1.1
// @author      Mori
// @run-at      document-idle
// ==/UserScript==

;(async function () {
  // Source: https://stackoverflow.com/a/26752410
  Object.unfreeze = function (o) {
    var oo = undefined
    if (o instanceof Array) {
      oo = []
      var clone = function (v) {
        oo.push(v)
      }
      o.forEach(clone)
    } else if (o instanceof String) {
      oo = new String(o).toString()
    } else if (typeof o == 'object') {
      oo = {}
      for (var property in o) {
        oo[property] = o[property]
      }
    }
    return oo
  }

  const settings = {
    autobreeding: GM_getValue('autobreeding', false),
    regionPrioForBreeding: GM_getValue('regionPrioForBreeding', -1),
    extendDungeonTime: GM_getValue('extendDungeonTime', false),
    extendGymTime: GM_getValue('extendGymTime', false),
    useProteins: GM_getValue('useProteins', false),
    addProteins: GM_getValue('addProteins', false),
    autoBattleFrontier: GM_getValue('autoBattleFrontier', false),
  }
  const sleep = (timeToSleep) => new Promise((r) => setTimeout(r, timeToSleep))

  await sleep(5000)

  while (!App || !App.game) {
    console.log('Game not ready')
    await sleep(100)
  }

  GameConstants = Object.unfreeze(GameConstants)

  function applyTimeMods() {
    if (settings.extendDungeonTime) {
      GameConstants.DUNGEON_TIME = 6000 + player.region * 6000
    } else {
      GameConstants.DUNGEON_TIME = 6000
    }

    if (settings.extendGymTime) {
      GameConstants.GYM_TIME = 3000 + player.region * 3000
    } else {
      GameConstants.GYM_TIME = 3000
    }

    setTimeout(applyTimeMods, 1000)
  }
  applyTimeMods()

  function saveSettings() {
    GM_setValue('autobreeding', settings.autobreeding)
    GM_setValue('regionPrioForBreeding', settings.regionPrioForBreeding)
    GM_setValue('extendDungeonTime', settings.extendDungeonTime)
    GM_setValue('extendGymTime', settings.extendGymTime)
    GM_setValue('useProteins', settings.useProteins)
    GM_setValue('addProteins', settings.addProteins)
    GM_setValue('autoBattleFrontier', settings.autoBattleFrontier)
  }
  saveSettings()

  async function hatchEggs() {
    if (App.game.breeding && App.game.breeding.eggSlots) {
      for (let i = App.game.breeding.eggSlots - 1; i >= 0; i--) {
        const currentEgg = App.game.breeding.eggList[i]()
        if (currentEgg && currentEgg.type >= 0 && currentEgg.stepsRemaining() <= 0) {
          console.log(`Hatching an egg (position: ${i + 1})`)
          App.game.breeding.hatchPokemonEgg(i)
          await sleep(100)
        }
      }

      if (settings.autobreeding && App.game.breeding.hasFreeEggSlot() && App.game.party.hasMaxLevelPokemon()) {
        const pokemonAvailable = App.game.party.caughtPokemon.filter((pokemon) => pokemon.level === 100).filter((pokemon) => !pokemon.breeding)
        pokemonAvailable.sort((a, b) => {
          if (settings.useProteins && (player.itemList.Protein() || settings.addProteins)) {
            const list = [a, b]

            for (let i = 0; i < list.length; i++) {
              const pokemon = list[i]

              if (pokemon.proteinUsesRemaining() > 0) {
                if (settings.addProteins && player.itemList.Protein() < pokemon.proteinUsesRemaining()) {
                  player.itemList.Protein(pokemon.proteinUsesRemaining())
                }

                pokemon.useProtein(pokemon.proteinUsesRemaining())
              }
            }
          }

          const regionToCompare = settings.regionPrioForBreeding === 'player' ? player.region : parseInt(settings.regionPrioForBreeding, 10)

          const prioA = regionToCompare === pokemonMap[a.name].nativeRegion ? 1 : 0.4
          const prioB = regionToCompare === pokemonMap[b.name].nativeRegion ? 1 : 0.4

          return (
            (prioB * (b.baseAttack * (GameConstants.BREEDING_ATTACK_BONUS / 100) + b.proteinsUsed())) / pokemonMap[b.name].eggCycles -
            (prioA * (a.baseAttack * (GameConstants.BREEDING_ATTACK_BONUS / 100) + a.proteinsUsed())) / pokemonMap[a.name].eggCycles
          )
        })

        while (App.game.breeding.hasFreeEggSlot() && pokemonAvailable.length) {
          const pokemon = pokemonAvailable.shift()
          console.log(
            `Breeding ${pokemon.name} (attack: ${pokemon.attack}; base: ${pokemon.baseAttack}, bonus: ${pokemon.attackBonusAmount}; region: ${
              GameConstants.Region[pokemonMap[pokemon.name].nativeRegion]
            })`
          )
          App.game.breeding.addPokemonToHatchery(pokemon)
          await sleep(100)
        }
      }

      setTimeout(hatchEggs, 100)
    } else {
      console.log('No egg slots / breeding not ready')
      setTimeout(hatchEggs, 1000)
    }
  }
  hatchEggs()

  async function pokedexCatchAll() {
    const pokedexModal = document.querySelector('#pokedexModal')

    if (pokedexModal) {
      const addAllLinkCheck = pokedexModal.querySelector('#addAllLink')

      if (!addAllLinkCheck) {
        const h4 = pokedexModal.querySelector('h4')

        const addAllLink = document.createElement('span')
        addAllLink.id = 'addAllLink'
        addAllLink.textContent = ' [Add All Visible] '
        addAllLink.style.cursor = 'pointer'
        addAllLink.addEventListener('click', async function () {
          const list = PokedexHelper.filteredList()
          for (let i = list.length - 1; i >= 0; i--) {
            const pokemon = list[i]

            if (pokemon.id > 0) {
              App.game.party.gainPokemonById(pokemon.id, false)
              await sleep(10)
            }
          }
        })

        h4.appendChild(addAllLink)

        const addAllShinyLink = document.createElement('span')
        addAllShinyLink.id = 'addAllShinyLink'
        addAllShinyLink.textContent = ' [Add All Shiny] '
        addAllShinyLink.style.cursor = 'pointer'
        addAllShinyLink.addEventListener('click', async function () {
          const list = PokedexHelper.filteredList()
          for (let i = list.length - 1; i >= 0; i--) {
            const pokemon = list[i]

            if (pokemon.id > 0) {
              App.game.party.gainPokemonById(pokemon.id, true)
              await sleep(10)
            }
          }
        })

        h4.appendChild(addAllShinyLink)
      }
    }
  }
  pokedexCatchAll()

  async function battleFrontier() {
    if (settings.autoBattleFrontier && BattleFrontier.canAccess()) {
      if (App.game.gameState === GameConstants.GameState.battleFrontier) {
        if (!BattleFrontierRunner.started()) {
          BattleFrontier.start()
        } else {
          const maxTicks = 10

          if (Battle.enemyPokemon()) {
            const myDamage = App.game.party.calculatePokemonAttack(Battle.enemyPokemon().type1, Battle.enemyPokemon().type2)
            const enemyMaxHealth = Battle.enemyPokemon().maxHealth()

            const ticks = Math.ceil(enemyMaxHealth / myDamage)

            if (ticks > maxTicks) {
              BattleFrontierRunner.battleLost()
            }
          }
        }
      }
    }

    setTimeout(battleFrontier, 1000)
  }
  battleFrontier()

  async function createSettingsMenu() {
    let regionOptions = ''

    for (let i = -1; i < 100; i++) {
      if (GameConstants.Region[i]) {
        regionOptions += `<option value="${i}" ${parseInt(settings.regionPrioForBreeding, 10) === i ? 'selected="selected"' : ''}>
          ${GameConstants.Region[i]}
        </option>\n`
      }
    }

    const settingsMenuHTML = `
<div id="relaxerSettingsMenu" class="dropdown clearfix" style="position:absolute; right:200px; top:0; z-index: 100; font-family: pokemonFont,'Helvetica Neue',sans-serif;">
    <button class="btn btn-secondary dropdown-toggle float-right triggerMenu" type="button" style="font-family: pokemonFont,'Helvetica Neue',sans-serif;">
        Relaxer Menu
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu dropdown-menu-right" style="padding: 5px; width: 400px; position: absolute; top: -1000px; left: 0px; will-change: transform; font-family: pokemonFont,'Helvetica Neue',sans-serif;">
        <li>
            Autobreeding: <input type="checkbox" id="autobreeding" ${settings.autobreeding ? 'checked="checked"' : ''} />
        </li>
        <li>
            Breeding priority:
            <select id="regionPrioForBreeding">
              <option value="player" ${settings.regionPrioForBreeding === 'player' ? 'selected="selected"' : ''}>Player region</option>
              ${regionOptions}
            </select>
        </li>
        <li>
            Auto use Proteins: <input type="checkbox" id="useProteins" ${settings.useProteins ? 'checked="checked"' : ''} />
        </li>
        <li>
            Auto add Proteins: <input type="checkbox" id="addProteins" ${settings.addProteins ? 'checked="checked"' : ''} />
        </li>
        <li>
            Extend dungeon time: <input type="checkbox" id="extendDungeonTime" ${settings.extendDungeonTime ? 'checked="checked"' : ''} />
        </li>
        <li>
            Extend gym time: <input type="checkbox" id="extendGymTime" ${settings.extendGymTime ? 'checked="checked"' : ''} />
        </li>
        <li>
            Auto Battle Frontier: <input type="checkbox" id="autoBattleFrontier" ${settings.autoBattleFrontier ? 'checked="checked"' : ''} />
        </li>
        <li>
            <button class="btn btn-secondary float-right saveSettings" type="button" style="font-family: pokemonFont,'Helvetica Neue',sans-serif;">
                Save settings
            </button>
        </li>
    </ul>
</div>
    `

    document.querySelector('#startMenu').insertAdjacentHTML('afterend', settingsMenuHTML)
    const relaxerSettingsMenu = document.querySelector('#relaxerSettingsMenu')

    relaxerSettingsMenu.querySelector('button.triggerMenu').addEventListener('click', function () {
      if (relaxerSettingsMenu.querySelector('ul.dropdown-menu').classList.contains('show')) {
        relaxerSettingsMenu.querySelector('ul.dropdown-menu').classList.remove('show')
      } else {
        relaxerSettingsMenu.querySelector('ul.dropdown-menu').style.transform = 'translate3d(-222px, 36px, 0px)'
        relaxerSettingsMenu.querySelector('ul.dropdown-menu').style.top = '0px'
        relaxerSettingsMenu.querySelector('ul.dropdown-menu').classList.add('show')
      }
    })

    relaxerSettingsMenu.querySelector('button.saveSettings').addEventListener('click', function () {
      settings.autobreeding = relaxerSettingsMenu.querySelector('#autobreeding').checked
      settings.regionPrioForBreeding = relaxerSettingsMenu.querySelector('#regionPrioForBreeding').selectedOptions[0].value
      settings.extendDungeonTime = relaxerSettingsMenu.querySelector('#extendDungeonTime').checked
      settings.extendGymTime = relaxerSettingsMenu.querySelector('#extendGymTime').checked
      settings.useProteins = relaxerSettingsMenu.querySelector('#useProteins').checked
      settings.addProteins = relaxerSettingsMenu.querySelector('#addProteins').checked
      settings.autoBattleFrontier = relaxerSettingsMenu.querySelector('#autoBattleFrontier').checked

      saveSettings()
    })
  }
  createSettingsMenu()
})()
