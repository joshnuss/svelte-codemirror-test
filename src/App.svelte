<script>
  import Screen from './Screen.svelte'
  import CodeMirror from 'codemirror'
  import 'codemirror/mode/javascript/javascript'
  import {onMount} from 'svelte'
  import { tweened } from 'svelte/motion'

  const scrollX = tweened(0, {duration: 800})
  const scrollY = tweened(0, {duration: 800})

  const mode = 'javascript'
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
      y: 200
    },
    {
      type: 'scroll',
      y: 30
    },
    {
      type: 'scroll',
      y: 120
    },
  ]

  onMount(() => {
    editor = CodeMirror(editorElement, {
      mode,
      value: code,
      lineNumbers: true
    })
  })

  $: if (editor) {
    editor.scrollTo($scrollX, $scrollY)
  }

  function record() {
    if (editor.getSelection() == "")
      return

    const start = editor.getCursor(true)
    const end = editor.getCursor(false)

    steps = [...steps, {type: 'selection', start, end}]
  }

  function playback() {
    marks = []
    // set starting point to original code
    editor.setValue(code)

    steps.forEach((step, i) => {
      setTimeout(() => {
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
            if (step.typewriter) {
              addNextLetter(step, 0)
            }
            else {
              editor.replaceSelection(step.text)
              editor.markText(step.start, {ch: step.start.ch + step.text.length, line: step.start.line}, {className: 'adding'})

              setTimeout(() => {
                clearMarks()
                editor.setSelection(step.start)
              }, 700)
            }
            break
        }
      }, i*1000)
    })

    setTimeout(() => {
      editor.setCursor(0)
      clearMarks()
    }, steps.length * 1000)
  }

  function addNextLetter(step, index) {
    clearMarks()

    editor.setCursor({ch: step.start.ch + index, line: step.start.line})
    editor.replaceSelection(step.text[index])
    editor.markText(step.start, {ch: step.start.ch + index + 1, line: step.start.line}, {className: 'adding'})

    if (index < step.text.length-1) {
      setTimeout(() => addNextLetter(step, index + 1), 600/step.text.length)
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
</script>

<div class="container">
  <Screen>
    <div class="editor" bind:this={editorElement}/>
  </Screen>
</div>

<button on:click={record}>Record Selection</button>
<button on:click={playback} class="play">Playback</button>

<pre>steps = {JSON.stringify(steps, null, 2)}</pre>

<style>
  .editor {
    font-size: 1.2rem;
  }
  .container {
    max-width: 800px;
  }
  :global(.removing), :global(.removing span) {
    background: #ffd0d0;
  }
  :global(.adding), :global(.adding span) {
    background: #b6ffb6;
  }
</style>
