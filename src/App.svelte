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
  let steps = [
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
            editor.setCursor(step.start)
            editor.replaceSelection(step.text)
            mark = editor.markText(step.start, {ch: step.end.ch + step.text.length, line: step.start.line}, {className: 'adding'})

            setTimeout(() => {
              mark.clear()
              editor.setSelection(step.start)
            }, 700)
            break
        }
      }, i*1000)
    })

    setTimeout(() => editor.setCursor(0), steps.length * 1000)
  }
</script>

<div class="editor" bind:this={editorElement}/>

<button on:click={record}>Record Selection</button>
<button on:click={playback}>Playback</button>

<pre>steps = {JSON.stringify(steps, null, 2)}</pre>

<style>
  .editor {
    font-size: 2rem;
  }
  :global(.removing), :global(.removing span) {
    background: red;
    color: white !important;
  }
  :global(.adding), :global(.adding span) {
    background: green;
    color: white !important;
  }
</style>
