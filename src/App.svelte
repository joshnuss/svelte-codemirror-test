<script>
  import Screen from './Screen.svelte'
  import CodeMirror from 'codemirror'
  import 'codemirror/mode/javascript/javascript'
  import 'codemirror/mode/ruby/ruby'
  import marked from 'marked'
  import {onMount} from 'svelte'
  import { quintInOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'
  import { fly, fade } from 'svelte/transition'

  const scrollX = tweened(0, {duration: 800, easing: quintInOut})
  const scrollY = tweened(0, {duration: 800, easing: quintInOut})

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
      caption: 'scrolling down'
    },
    {
      type: 'scroll',
      y: -200,
      caption: 'scrolling up'
    },
    {
      type: 'selection',
      css: 'background: purple; color:white;',
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
      text: '\n',
    },
    {
      type: 'add',
      start: {line: 4, ch: 0},
      text: '// adding text with typewriter',
      typewriter: true
    },
    {
      type: 'add',
      start: {line: 4, ch: 30},
      text: '\n',
    },
    {
      type: 'add',
      start: {line: 5, ch: 0},
      text: 'let syntaxHighlight = true // yay!',
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

  $: if (editor) {
    editor.scrollTo($scrollX, $scrollY)
  }

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

  function playback() {
    marks = []
    // set starting point to original code
    editor.setValue(code)

    dispatchEvent("timelinestart")

    steps.forEach((step, i) => {
      setTimeout(() => {
        if (current) {
          dispatchEvent("stepend", step)
        }

        current = step

        dispatchEvent("stepstart", step)

        switch (step.type) {
          case "scroll":
            if (step.x) $scrollX = step.x
            if (step.y) $scrollY = step.y
            break
          case "selection":
            clearMarks()
            if (step.selections) {
              step.selections.forEach(selection => {
                editor.markText(selection.start, selection.end, {css: step.css, className: step.class})
              })
            } else  {
              editor.setSelection(step.start, step.end)

              if (step.css || step.class) {
                editor.markText(step.start, step.end, {css: step.css, className: step.class})
              }
            }
            break
          case "remove":
            const end = {line: step.start.line, ch: step.start.ch + step.length}
            editor.markText(step.start, end, {className: 'removing'})

            if (step.typewriter) {
              editor.setCursor(end)
              removeNextLetter(step, step.length)
            }
            else {
              editor.setCursor(step.start)

              setTimeout(() => {
                clearMarks()
                editor.setSelection(step.start, end)
                editor.replaceSelection("")
              }, 700)
            }
            break

          case "add":
            editor.setCursor(step.start)
            clearMarks()
            if (step.typewriter) {
              addNextLetter(step, 0)
            }
            else {
              editor.replaceSelection(step.text)
              const lines = step.text.split("\n").length
              editor.markText(step.start, {ch: step.start.ch + step.text.length, line: step.start.line + lines - 1}, {className: 'adding'})

              setTimeout(() => {
                clearMarks()
                editor.setSelection(step.start)
              }, 700)
            }
            break
        }
      }, i*3000)
    })

    setTimeout(() => {
      current = null
      editor.setCursor(0)
      clearMarks()
      dispatchEvent("timelineend")
    }, steps.length * 3000)
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
    editor.markText(step.start, {ch: step.start.ch + index + 1, line}, {className: 'adding'})

    if (index < step.text.length-1) {
      setTimeout(() => addNextLetter(step, index + 1), 10/step.text.length)
    } else {
      setTimeout(() => clearMarks(), 400)
    }
  }

  function removeNextLetter(step, index) {
    clearMarks()

    editor.execCommand('delCharBefore')
    editor.markText(step.start, {ch: step.start.ch + index - 1, line: step.start.line}, {className: 'removing'})

    if (index > 1) {
      setTimeout(() => removeNextLetter(step, index - 1), 600/step.length)
    } else {
      setTimeout(() => clearMarks(), 400)
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
