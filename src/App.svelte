<script>
  import CodeMirror from 'codemirror'
  import 'codemirror/mode/javascript/javascript'
  import {onMount} from 'svelte'

  const mode = 'javascript'
  const code =
`function add(a, b) {
  return a + b
}`
  let editorElement
  let editor
  let typewriterIndex = 0
  let steps = [
    {
      type: 'add',
      start: {line: 2, ch: 1},
      text: '\n// adding text in one shot',
    },
    {
      type: 'add',
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
      text: 'let syntaxHighlightWorking = true || false // yay!',
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
      end: {line: 0, ch: 17}
    },
    {
      type: 'add',
      text: 'x, y',
      start: {line: 0, ch: 13},
      end: {line: 0, ch: 13}
    }
  ]

  onMount(() => {
    editor = CodeMirror(editorElement, {
      mode,
      value: code,
      lineNumbers: true
    })
  })

  function record() {
    if (editor.getSelection() == "")
      return

    const start = editor.getCursor(true)
    const end = editor.getCursor(false)

    steps = [...steps, {type: 'selection', start, end}]
  }

  function playback() {
    let mark
    // set starting point to original code
    editor.setValue(code)

    steps.forEach((step, i) => {
      setTimeout(() => {
        switch (step.type) {
          case "selection":
            editor.setSelection(step.start, step.end)
            break
          case "remove":
            editor.setCursor(step.start)
            mark = editor.markText(step.start, step.end, {className: 'removing'})
            setTimeout(() => {
              mark.clear()
              editor.setSelection(step.start, step.end)
              editor.replaceSelection("")
            }, 700)
            break

          case "add":
            typewriterIndex = 0
            editor.setCursor(step.start)
            if (step.typewriter) {
              addNextLetter(step, null, 0)
            }
            else {
              editor.replaceSelection(step.text)
              mark = editor.markText(step.start, {ch: step.start.ch + step.text.length, line: step.start.line}, {className: 'adding'})

              setTimeout(() => {
                mark.clear()
                editor.setSelection(step.start)
              }, 700)
            }
            break
        }
      }, i*1000)
    })

    setTimeout(() => editor.setCursor(0), steps.length * 1000)
  }

  function addNextLetter(step, mark, index) {
    if (mark) mark.clear()

    editor.setCursor({ch: step.start.ch + index, line: step.start.line})
    editor.replaceSelection(step.text[index])
    mark = editor.markText(step.start, {ch: step.start.ch + index + 1, line: step.start.line}, {className: 'adding'})

    if (index < step.text.length-1) {
      setTimeout(() => addNextLetter(step, mark, index + 1), 600/step.text.length)
    } else {
      setTimeout(() => mark.clear(), 400)
    }
  }
</script>

<div class="editor" bind:this={editorElement}/>

<button on:click={record}>Record Selection</button>
<button on:click={playback} class="play">Playback</button>

<pre>steps = {JSON.stringify(steps, null, 2)}</pre>

<style>
  .editor {
    font-size: 2rem;
  }
  :global(.removing), :global(.removing span) {
    background: #ffd0d0;
  }
  :global(.adding), :global(.adding span) {
    background: #b6ffb6;
  }
</style>
