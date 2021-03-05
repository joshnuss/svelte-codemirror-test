<script>
  import Screen from './Screen.svelte'
  import CodeMirror from 'codemirror'
  import 'codemirror/mode/javascript/javascript'
  import 'codemirror/mode/ruby/ruby'
  import marked from 'marked'
  import {onMount} from 'svelte'
  import { quintInOut, elasticInOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'
  import { get, derived } from 'svelte/store'
  import { fly, fade } from 'svelte/transition'

  let scrollX
  let scrollY

  let current = null
  let language = 'javascript'
  let theme = 'light'
  const code =
`function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

function multiple(a, b) {
  return a * b
}

function divide(a, b) {
  return a / b
}

function double(a) {
  return multiply(a, 2)
}

function triple(a) {
  return multiply(a, 3)
}`
  let editorElement
  let editor
  let marks = []

  let steps = [
    {
      type: 'scroll',
      y: 200,
      caption: 'scrolling down',
      duration: 2000,
      pause: 500,
    },
    {
      type: 'scroll',
      y: -200,
      caption: 'scrolling up',
      pause: 500,
    },
    {
      type: 'selection',
      css: 'background: purple; color:white;',
      caption: 'selecting stuff',
      duration: 2000,
      selections: [
        {start: {line: 0, ch: 13}, end: {line: 0, ch: 14}},
        {start: {line: 1, ch: 9}, end: {line: 1, ch: 10}},
      ]
    },
    {
      type: 'selection',
      css: 'background: turquoise; color:#444;',
      selections: [
        {start: {line: 0, ch: 16}, end: {line: 0, ch: 17}},
        {start: {line: 1, ch: 13}, end: {line: 1, ch: 14}},
      ]
    },
    {
      type: 'add',
      start: {line: 2, ch: 1},
      text: '\n',
    },
    {
      type: 'add',
      caption: 'adding text',
      start: {line: 3, ch: 0},
      text: '// adding text in one shot',
    },
    {
      type: 'add',
      caption: 'adding more text',
      start: {line: 3, ch: 27},
      duration: 0,
      text: '\n',
    },
    {
      type: 'add',
      start: {line: 4, ch: 0},
      text: '// adding text with typewriter',
      duration: 2000,
      typewriter: true
    },
    {
      type: 'add',
      start: {line: 4, ch: 30},
      duration: 0,
      text: '\n',
    },
    {
      type: 'add',
      start: {line: 5, ch: 0},
      text: 'let syntaxHighlight = true // yay!',
      duration: 400,
      typewriter: true
    },
    {
      type: 'selection',
      start: {line: 0, ch: 0},
      end: {line: 0, ch: 8}
    },
    {
      type: 'selection',
      start: {line: 0, ch: 9},
      end: {line: 0, ch: 12}
    },
    {
      type: 'remove',
      start: {line: 0, ch: 13},
      length: 4,
      typewriter: true
    },
    {
      type: 'add',
      text: 'x, y',
      start: {line: 0, ch: 13},
      end: {line: 0, ch: 13},
      typewriter: true
    }
  ]

  onMount(() => {
    createEditor()
  })

  $: {
    const classList = document.body.classList

    classList.remove('dark-theme', 'light-theme')
    classList.add(`${theme}-theme`)
  }

  function createEditor() {
    if (editor)
      editorElement.innerHTML = ''

    editor = CodeMirror(editorElement, {
      mode: language,
      value: code,
      lineNumbers: true
    })
  }

  function record() {
    if (editor.getSelection() == "")
      return

    const start = editor.getCursor(true)
    const end = editor.getCursor(false)

    steps = [...steps, {type: 'selection', start, end}]
  }

  function dispatchEvent(name, detail) {
    const event = new CustomEvent(name, {detail})
    editorElement.dispatchEvent(event)
  }

  function nextStep(index) {
    if (current) {
      dispatchEvent("stepend", current)
    }

    current = steps[index]
    const duration = current.duration || 1000

    dispatchEvent("stepstart", current)

    switch (current.type) {
      case "scroll":
        let lastX = scrollX ? get(scrollX) : 0
        let lastY = scrollY ? get(scrollY) : 0

        scrollX = tweened(lastX, {duration, easing: elasticInOut})
        scrollY = tweened(lastY, {duration, easing: elasticInOut})

        scroll = derived([scrollX, scrollY], ([$scrollX, $scrollY], set) => {
          set({x: $scrollX, y: $scrollY})
        })

        scroll.subscribe(({x, y}) => {
          editor.scrollTo(x, y)
        })

        if (current.x) scrollX.set(current.x)
        if (current.y) scrollY.set(current.y)

        break
      case "selection":
        clearMarks()
        if (current.selections) {
          current.selections.forEach(selection => {
            editor.markText(selection.start, selection.end, {css: current.css, className: current.class})
          })
        } else  {
          editor.setSelection(current.start, current.end)

          if (current.css || current.class) {
            editor.markText(current.start, current.end, {css: current.css, className: current.class})
          }
        }
        break
      case "remove":
        const end = {line: current.start.line, ch: current.start.ch + current.length}
        editor.markText(current.start, end, {className: 'removing'})

        if (current.typewriter) {
          editor.setCursor(end)
          removeNextLetter(current, current.length)
        }
        else {
          editor.setCursor(current.start)

          setTimeout(() => {
            clearMarks()
            editor.setSelection(current.start, end)
            editor.replaceSelection("")
          }, duration)
        }
        break

      case "add":
        editor.setCursor(current.start)
        clearMarks()
        if (current.typewriter) {
          addNextLetter(current, 0)
        }
        else {
          editor.replaceSelection(current.text)
          const lines = current.text.split("\n").length
          editor.markText(current.start, {ch: current.start.ch + current.text.length, line: current.start.line + lines - 1}, {className: 'adding'})

          setTimeout(() => {
            clearMarks()
            editor.setSelection(current.start)
          }, duration)
        }
        break
    }

    if (index < steps.length-1) {
      setTimeout(() => nextStep(index + 1), duration+(current.pause || 0))
    } else {
      setTimeout(() => {
        current = null
        editor.setCursor(0)
        clearMarks()
        dispatchEvent("timelineend")
      }, (duration + (current.pause || 0)))
    }
  }

  function playback() {
    marks = []
    // set starting point to original code
    editor.setValue(code)

    dispatchEvent("timelinestart")

    nextStep(0)
  }

  function addNextLetter(step, index) {
    clearMarks()
    const letter = step.text[index]
    const line = step.start.line + step.text.substr(index).split("\n").length

    editor.setCursor({ch: step.start.ch + index, line})

    if (letter == "\n") {
      editor.execCommand('newlineAndIndent')
    } else {
      editor.replaceSelection(letter)
    }
    // TODO: wrong `ch` when mutliple lines, doesn't take into account "\n"
    editor.markText(step.start, {ch: step.start.ch + index + 1, line}, {className: 'adding'})

    if (index < step.text.length-1) {
      setTimeout(() => addNextLetter(step, index + 1), (((step.duration || 1000)-100)/step.text.length))
    }
  }

  function removeNextLetter(step, index) {
    clearMarks()

    editor.execCommand('delCharBefore')
    editor.markText(step.start, {ch: step.start.ch + index - 1, line: step.start.line}, {className: 'removing'})

    if (index > 1) {
      setTimeout(() => removeNextLetter(step, index - 1), (step.duration || 1000)/step.length)
    }
  }

  function clearMarks() {
    editor
      .getAllMarks()
      .forEach(mark => mark.clear())
  }

  function stepStart(e) {
    console.log('step:start', e.detail)
  }
  function stepEnd(e) {
    console.log('step:end', e.detail)
  }
  function timelineStart(e) {
    console.log('timeline:start')
  }
  function timelineEnd(e) {
    console.log('timeline:end')
  }

</script>

<div class="container">
  <Screen>
    <div class="editor" bind:this={editorElement} on:stepstart={stepStart} on:stepend={stepEnd} on:timelinestart={timelineStart} on:timelineEnd={timelineEnd}/>
    <div class="annotation-container">
      {#if current && current.caption}
        {#key current.caption}
          <div class="text" in:fly={{y:20, duration: 200}} out:fade={{x:40, duration: 200}}>
            {@html marked(current.caption)}
          </div>
        {/key}
      {/if}
    </div>
  </Screen>
</div>

<button on:click={record}>Record Selection</button>
<button on:click={playback} class="play">Playback</button>

<select bind:value={language} on:change={createEditor}>
  {#each ['javascript', 'ruby'] as lang}
    <option>{lang}</option>
  {/each}
</select>

<select bind:value={theme}>
  <option>light</option>
  <option>dark</option>
</select>

<pre>steps = {JSON.stringify(steps, null, 2)}</pre>

<style>
  .editor {
    font-size: 1.2rem;
  }
  .container {
    max-width: 800px;
  }
  .annotation-container {
    display: flex;
    justify-content: center;
  }
  .annotation-container .text {
    margin-top: -40px;
    z-index: 100;
    position: absolute;
    background: #ccc;
    padding: 5px;
    border-radius: 3px;
    box-shadow: 1px 1px white;
    font-family: sans-serif;
    font-size: 0.8rem;
  }
  :global(.annotation-container .text > p) {
    margin: 0;
  }
  :global(.removing), :global(.removing span) {
    background: #ffd0d0;
  }
  :global(.adding), :global(.adding span) {
    background: #b6ffb6;
  }
</style>
